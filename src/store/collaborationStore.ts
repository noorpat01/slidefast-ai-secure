import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { 
  Collaborator, 
  Comment, 
  PresentationInvitation, 
  UserPresence,
  ActivityLogEntry,
  InviteUserRequest,
  AcceptInvitationRequest,
  SetPermissionsRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  PermissionLevel
} from '../types/collaboration';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface CollaborationState {
  // Current presentation being collaborated on
  currentPresentationId: string | null;
  
  // Collaborators and presence
  collaborators: Collaborator[];
  userPresences: Record<string, UserPresence>;
  
  // Comments
  comments: Comment[];
  
  // Invitations
  pendingInvitations: PresentationInvitation[];
  
  // Activity log
  activityLog: ActivityLogEntry[];
  
  // Real-time subscriptions
  realtimeChannel: RealtimeChannel | null;
  
  // Loading states
  isLoadingCollaborators: boolean;
  isLoadingComments: boolean;
  isLoadingInvitations: boolean;
  
  // Error states
  error: string | null;
}

interface CollaborationActions {
  // Presentation management
  setCurrentPresentation: (presentationId: string | null) => void;
  
  // Collaborator management
  loadCollaborators: (presentationId: string) => Promise<void>;
  inviteUser: (request: InviteUserRequest) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation: (token: string) => Promise<{ success: boolean; error?: string; presentation_id?: string }>;
  setUserPermissions: (request: SetPermissionsRequest) => Promise<{ success: boolean; error?: string }>;
  removeCollaborator: (presentationId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Comments management
  loadComments: (presentationId: string) => Promise<void>;
  createComment: (request: CreateCommentRequest) => Promise<{ success: boolean; error?: string }>;
  updateComment: (request: UpdateCommentRequest) => Promise<{ success: boolean; error?: string }>;
  deleteComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  resolveComment: (commentId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Invitations management
  loadInvitations: (presentationId?: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Real-time presence
  updateUserPresence: (presentationId: string, presence: Partial<UserPresence>) => void;
  subscribeToPresence: (presentationId: string) => void;
  unsubscribeFromPresence: () => void;
  
  // Activity log
  loadActivityLog: (presentationId: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

type CollaborationStore = CollaborationState & CollaborationActions;

const initialState: CollaborationState = {
  currentPresentationId: null,
  collaborators: [],
  userPresences: {},
  comments: [],
  pendingInvitations: [],
  activityLog: [],
  realtimeChannel: null,
  isLoadingCollaborators: false,
  isLoadingComments: false,
  isLoadingInvitations: false,
  error: null,
};

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  ...initialState,
  
  // Presentation management
  setCurrentPresentation: (presentationId) => {
    const currentId = get().currentPresentationId;
    if (currentId !== presentationId) {
      // Unsubscribe from previous presentation's real-time updates
      get().unsubscribeFromPresence();
      
      set({ currentPresentationId: presentationId });
      
      // Subscribe to new presentation's real-time updates
      if (presentationId) {
        get().subscribeToPresence(presentationId);
        get().loadCollaborators(presentationId);
        get().loadComments(presentationId);
      }
    }
  },
  
  // Collaborator management
  loadCollaborators: async (presentationId) => {
    set({ isLoadingCollaborators: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .eq('presentation_id', presentationId);
      
      if (error) throw error;
      
      set({ 
        collaborators: data || [],
        isLoadingCollaborators: false 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoadingCollaborators: false 
      });
    }
  },
  
  inviteUser: async (request) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: request
      });
      
      if (error) throw error;
      
      if (data.success && data.invitation) {
        // Refresh invitations list
        get().loadInvitations(request.presentation_id);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to invite user' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  acceptInvitation: async (token) => {
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token }
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Refresh collaborators list for the presentation
        if (data.presentation_id) {
          get().loadCollaborators(data.presentation_id);
        }
        return { 
          success: true, 
          presentation_id: data.presentation_id 
        };
      } else {
        return { success: false, error: data.error || 'Failed to accept invitation' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  setUserPermissions: async (request) => {
    try {
      const { data, error } = await supabase.functions.invoke('set-permissions', {
        body: request
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Update local collaborator list
        const collaborators = get().collaborators;
        const updatedCollaborators = collaborators.map(collab => 
          collab.user_id === request.user_id 
            ? { ...collab, permission_level: request.permission_level }
            : collab
        );
        set({ collaborators: updatedCollaborators });
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update permissions' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  removeCollaborator: async (presentationId, userId) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('presentation_id', presentationId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Remove from local state
      const collaborators = get().collaborators;
      set({ 
        collaborators: collaborators.filter(collab => collab.user_id !== userId)
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Comments management
  loadComments: async (presentationId) => {
    set({ isLoadingComments: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .eq('presentation_id', presentationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Organize comments into threads
      const comments = data || [];
      const threaded = comments.reduce((acc, comment) => {
        if (!comment.parent_comment_id) {
          // Top-level comment
          acc.push({
            ...comment,
            replies: comments.filter(c => c.parent_comment_id === comment.id)
          });
        }
        return acc;
      }, [] as Comment[]);
      
      set({ 
        comments: threaded,
        isLoadingComments: false 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoadingComments: false 
      });
    }
  },
  
  createComment: async (request) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          ...request,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      // Add to local state
      if (!request.parent_comment_id) {
        // Top-level comment
        set(state => ({
          comments: [...state.comments, { ...data, replies: [] }]
        }));
      } else {
        // Reply to existing comment
        set(state => ({
          comments: state.comments.map(comment => 
            comment.id === request.parent_comment_id
              ? { ...comment, replies: [...(comment.replies || []), data] }
              : comment
          )
        }));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  updateComment: async (request) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          ...(request.content && { content: request.content }),
          ...(request.is_resolved !== undefined && { is_resolved: request.is_resolved }),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.comment_id)
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        comments: state.comments.map(comment => {
          if (comment.id === request.comment_id) {
            return { ...comment, ...data };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === request.comment_id ? { ...reply, ...data } : reply
              )
            };
          }
          return comment;
        })
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  deleteComment: async (commentId) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Remove from local state
      set(state => ({
        comments: state.comments
          .filter(comment => comment.id !== commentId)
          .map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== commentId) || []
          }))
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  resolveComment: async (commentId) => {
    return get().updateComment({ comment_id: commentId, is_resolved: true });
  },
  
  // Invitations management
  loadInvitations: async (presentationId) => {
    set({ isLoadingInvitations: true, error: null });
    
    try {
      let query = supabase
        .from('presentation_invitations')
        .select(`
          *,
          inviter:users!presentation_invitations_inviter_id_fkey(id, email, full_name, avatar_url),
          presentation:presentations(id, title)
        `)
        .eq('status', 'pending');
      
      if (presentationId) {
        query = query.eq('presentation_id', presentationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        pendingInvitations: data || [],
        isLoadingInvitations: false 
      });
    } catch (error) {
      set({ 
        error: error.message,
        isLoadingInvitations: false 
      });
    }
  },
  
  cancelInvitation: async (invitationId) => {
    try {
      const { error } = await supabase
        .from('presentation_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Remove from local state
      set(state => ({
        pendingInvitations: state.pendingInvitations.filter(
          invitation => invitation.id !== invitationId
        )
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Real-time presence
  updateUserPresence: (presentationId, presence) => {
    set(state => ({
      userPresences: {
        ...state.userPresences,
        [presence.user_id || '']: {
          ...state.userPresences[presence.user_id || ''],
          ...presence,
          presentation_id: presentationId,
          last_activity: new Date().toISOString()
        }
      }
    }));
  },
  
  subscribeToPresence: (presentationId) => {
    const channel = supabase.channel(`presentation:${presentationId}`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState();
        const userPresences: Record<string, UserPresence> = {};
        
        Object.keys(presences).forEach(key => {
          const presenceArray = presences[key];
          if (presenceArray && presenceArray.length > 0) {
            const presence = presenceArray[0];
            if (presence && typeof presence === 'object' && 'user_id' in presence) {
              userPresences[presence.user_id as string] = presence as unknown as UserPresence;
            }
          }
        });
        
        set({ userPresences });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          const presence = newPresences[0];
          if (presence && typeof presence === 'object' && 'user_id' in presence) {
            const userPresence = presence as unknown as UserPresence;
            set(state => ({
              userPresences: {
                ...state.userPresences,
                [userPresence.user_id]: userPresence
              }
            }));
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (leftPresences && leftPresences.length > 0) {
          const presence = leftPresences[0];
          if (presence && typeof presence === 'object' && 'user_id' in presence) {
            const userPresence = presence as unknown as UserPresence;
            set(state => {
              const newPresences = { ...state.userPresences };
              delete newPresences[userPresence.user_id];
              return { userPresences: newPresences };
            });
          }
        }
      })
      .subscribe();
    
    set({ realtimeChannel: channel });
  },
  
  unsubscribeFromPresence: () => {
    const channel = get().realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ 
        realtimeChannel: null,
        userPresences: {}
      });
    }
  },
  
  // Activity log
  loadActivityLog: async (presentationId) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url)
        `)
        .eq('presentation_id', presentationId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      set({ activityLog: data || [] });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  // Utility
  clearError: () => set({ error: null }),
  
  reset: () => {
    get().unsubscribeFromPresence();
    set(initialState);
  },
}));
