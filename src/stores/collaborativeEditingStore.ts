import React from 'react';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Operation, OperationalTransform, TextState } from '../utils/operationalTransform';
import toast from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CollaborativeEditingState {
  // Document states for each field
  documentStates: Record<string, TextState>; // key: `${slideId}_${field}_${contentIndex?}`
  
  // Pending operations
  pendingOperations: Record<string, Operation[]>; // key: same as documentStates
  
  // Real-time channel
  realtimeChannel: RealtimeChannel | null;
  
  // Current presentation ID
  presentationId: string | null;
  
  // Operation queue for processing
  operationQueue: Operation[];
  isProcessingQueue: boolean;
}

interface CollaborativeEditingActions {
  // Initialize collaborative editing for a presentation
  initializeCollaborativeEditing: (presentationId: string) => void;
  
  // Apply local text change
  applyLocalTextChange: (
    slideId: string,
    field: Operation['field'],
    oldText: string,
    newText: string,
    contentIndex?: number
  ) => void;
  
  // Handle remote operation
  handleRemoteOperation: (operation: Operation) => void;
  
  // Get current text state
  getTextState: (slideId: string, field: Operation['field'], contentIndex?: number) => string;
  
  // Set initial text state
  setTextState: (slideId: string, field: Operation['field'], text: string, contentIndex?: number) => void;
  
  // Process operation queue
  processOperationQueue: () => void;
  
  // Debounced save to database
  debouncedSave: (slideId: string, field: string, text: string, contentIndex?: number) => void;
  
  // Text change notification callback
  notifyTextChange?: (slideId: string, field: string, contentIndex?: number) => void;
  
  // Cleanup
  cleanup: () => void;
}

type CollaborativeEditingStore = CollaborativeEditingState & CollaborativeEditingActions;

const initialState: CollaborativeEditingState = {
  documentStates: {},
  pendingOperations: {},
  realtimeChannel: null,
  presentationId: null,
  operationQueue: [],
  isProcessingQueue: false,
};

export const useCollaborativeEditingStore = create<CollaborativeEditingStore>((set, get) => ({
  ...initialState,

  initializeCollaborativeEditing: (presentationId) => {
    const current = get();
    
    // Cleanup existing connection
    if (current.realtimeChannel) {
      supabase.removeChannel(current.realtimeChannel);
    }

    // Create new channel for this presentation
    const channel = supabase.channel(`presentation_editing:${presentationId}`);
    
    channel
      .on('broadcast', { event: 'operation' }, async (payload) => {
        const operation = payload.payload as Operation;
        const { data: { user } } = await supabase.auth.getUser();
        if (operation.userId !== user?.id) {
          get().handleRemoteOperation(operation);
        }
      })
      .subscribe();

    set({
      presentationId,
      realtimeChannel: channel,
      documentStates: {},
      pendingOperations: {},
      operationQueue: [],
    });
  },

  setTextState: (slideId, field, text, contentIndex) => {
    const key = `${slideId}_${field}${contentIndex !== undefined ? `_${contentIndex}` : ''}`;
    
    set((state) => ({
      documentStates: {
        ...state.documentStates,
        [key]: {
          text,
          version: 0,
          operations: []
        }
      }
    }));
  },

  getTextState: (slideId, field, contentIndex) => {
    const key = `${slideId}_${field}${contentIndex !== undefined ? `_${contentIndex}` : ''}`;
    const state = get().documentStates[key];
    return state?.text || '';
  },

  applyLocalTextChange: async (slideId, field, oldText, newText, contentIndex) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const operation = OperationalTransform.generateOperation(
      oldText,
      newText,
      user.data.user.id,
      slideId,
      field,
      contentIndex
    );

    if (!operation) return; // No change

    const key = `${slideId}_${field}${contentIndex !== undefined ? `_${contentIndex}` : ''}`;
    
    // Apply operation locally
    set((state) => {
      const currentState = state.documentStates[key];
      const newDocumentState = {
        text: newText,
        version: (currentState?.version || 0) + 1,
        operations: [...(currentState?.operations || []), operation]
      };

      return {
        documentStates: {
          ...state.documentStates,
          [key]: newDocumentState
        },
        pendingOperations: {
          ...state.pendingOperations,
          [key]: [...(state.pendingOperations[key] || []), operation]
        }
      };
    });

    // Broadcast operation to other clients
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'operation',
        payload: operation
      });
    }

    // Save to database (debounced)
    get().debouncedSave(slideId, field, newText, contentIndex);
  },

  handleRemoteOperation: (operation) => {
    set((state) => ({
      operationQueue: [...state.operationQueue, operation]
    }));
    
    if (!get().isProcessingQueue) {
      get().processOperationQueue();
    }
  },

  processOperationQueue: async () => {
    const { operationQueue } = get();
    if (operationQueue.length === 0) return;

    set({ isProcessingQueue: true });

    try {
      while (get().operationQueue.length > 0) {
        const operation = get().operationQueue[0];
        
        // Remove from queue
        set((state) => ({
          operationQueue: state.operationQueue.slice(1)
        }));

        const key = `${operation.slideId}_${operation.field}${operation.contentIndex !== undefined ? `_${operation.contentIndex}` : ''}`;
        
        set((state) => {
          const currentState = state.documentStates[key];
          const pendingOps = state.pendingOperations[key] || [];

          // Transform the incoming operation against pending operations
          const transformedOperation = OperationalTransform.transformAgainstOperations(
            operation,
            pendingOps
          );

          // Apply the transformed operation
          const currentText = currentState?.text || '';
          const newText = OperationalTransform.applyOperation(currentText, transformedOperation);

          const newDocumentState = {
            text: newText,
            version: (currentState?.version || 0) + 1,
            operations: [...(currentState?.operations || []), transformedOperation]
          };

          return {
            documentStates: {
              ...state.documentStates,
              [key]: newDocumentState
            }
          };
        });

        // Trigger UI update callback if needed
        get().notifyTextChange?.(operation.slideId, operation.field, operation.contentIndex);
      }
    } catch (error) {
      console.error('Error processing operation queue:', error);
      toast.error('Error synchronizing changes');
    } finally {
      set({ isProcessingQueue: false });
    }
  },

  // Debounced save to database
  debouncedSave: (() => {
    const saveTimeouts: Record<string, NodeJS.Timeout> = {};
    
    return (slideId: string, field: string, text: string, contentIndex?: number) => {
      const key = `${slideId}_${field}${contentIndex !== undefined ? `_${contentIndex}` : ''}`;
      
      // Clear existing timeout
      if (saveTimeouts[key]) {
        clearTimeout(saveTimeouts[key]);
      }
      
      // Set new timeout
      saveTimeouts[key] = setTimeout(async () => {
        try {
          const { presentationId } = get();
          if (!presentationId) return;

          // Save to database through edge function
          await supabase.functions.invoke('save-collaborative-changes', {
            body: {
              presentationId,
              slideId,
              field,
              text,
              contentIndex
            }
          });
        } catch (error) {
          console.error('Failed to save collaborative changes:', error);
        } finally {
          delete saveTimeouts[key];
        }
      }, 2000); // 2 second debounce
    };
  })(),

  // Notification callback for UI updates
  notifyTextChange: undefined,

  cleanup: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
    }
    
    set(initialState);
  },
}));

// Hook for using collaborative editing in components
export const useCollaborativeText = (
  slideId: string,
  field: Operation['field'],
  initialText: string,
  contentIndex?: number
) => {
  const {
    getTextState,
    setTextState,
    applyLocalTextChange,
    initializeCollaborativeEditing,
    presentationId
  } = useCollaborativeEditingStore();

  // Initialize text state if not exists
  React.useEffect(() => {
    const currentText = getTextState(slideId, field, contentIndex);
    if (!currentText && initialText) {
      setTextState(slideId, field, initialText, contentIndex);
    }
  }, [slideId, field, initialText, contentIndex]);

  const handleTextChange = (newText: string) => {
    const oldText = getTextState(slideId, field, contentIndex);
    if (oldText !== newText) {
      applyLocalTextChange(slideId, field, oldText, newText, contentIndex);
    }
  };

  return {
    text: getTextState(slideId, field, contentIndex) || initialText,
    setText: handleTextChange,
    isCollaborative: !!presentationId
  };
};
