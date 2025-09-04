import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useUserPresence, PresenceIndicator, LiveCursors } from './PresenceSystem';
import { CommentIndicator } from './CommentSystem';
import type { PermissionLevel, Comment } from '../../types/collaboration';
import { useAuthStore } from '../../store/auth';

// Collaboration Context
interface CollaborationContextType {
  presentationId: string | null;
  currentUserPermission: PermissionLevel;
  isCollaborationEnabled: boolean;
  slideComments: Record<string, Comment[]>;
  addSlideComment: (slideId: string, x: number, y: number) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

// Collaboration Provider Component
interface CollaborationProviderProps {
  children: React.ReactNode;
  presentationId: string | null;
  userTier?: 'free' | 'team' | 'pro';
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  presentationId,
  userTier = 'free'
}) => {
  const {
    collaborators,
    comments,
    setCurrentPresentation,
    createComment
  } = useCollaborationStore();
  
  const { user } = useAuthStore();
  const [currentUserPermission, setCurrentUserPermission] = useState<PermissionLevel>('view');
  
  // Initialize presence tracking
  const { updateCurrentSlide } = useUserPresence(presentationId);
  
  // Collaboration is only enabled for team tier and above
  const isCollaborationEnabled = userTier !== 'free';
  
  // Set current presentation when presentationId changes
  useEffect(() => {
    if (isCollaborationEnabled && presentationId) {
      setCurrentPresentation(presentationId);
    }
  }, [presentationId, isCollaborationEnabled, setCurrentPresentation]);
  
  // Determine current user's permission level
  useEffect(() => {
    if (!user || !presentationId) return;
    
    const userCollaborator = collaborators.find(c => c.user_id === user.id);
    if (userCollaborator) {
      setCurrentUserPermission(userCollaborator.permission_level);
    } else {
      // If user is not a collaborator, check if they own the presentation
      // This would require additional logic to check presentation ownership
      setCurrentUserPermission('admin'); // Default for now
    }
  }, [collaborators, user, presentationId]);
  
  // Organize comments by slide
  const slideComments = comments.reduce((acc, comment) => {
    if (comment.slide_id) {
      if (!acc[comment.slide_id]) {
        acc[comment.slide_id] = [];
      }
      acc[comment.slide_id].push(comment);
    }
    return acc;
  }, {} as Record<string, Comment[]>);
  
  // Function to add a comment to a specific slide at a position
  const addSlideComment = async (slideId: string, x: number, y: number) => {
    if (!presentationId || currentUserPermission === 'view') return;
    
    // This would typically open a comment dialog
    const content = prompt('Enter your comment:');
    if (!content) return;
    
    await createComment({
      presentation_id: presentationId,
      slide_id: slideId,
      content,
      position: { x, y }
    });
  };
  
  const contextValue: CollaborationContextType = {
    presentationId,
    currentUserPermission,
    isCollaborationEnabled,
    slideComments,
    addSlideComment
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
      
      {/* Render live cursors if collaboration is enabled */}
      {isCollaborationEnabled && presentationId && (
        <LiveCursors presentationId={presentationId} />
      )}
    </CollaborationContext.Provider>
  );
};

// Slide with Collaboration Features
interface CollaborativeSlideProps {
  slideId: string;
  children: React.ReactNode;
  className?: string;
  onDoubleClick?: (x: number, y: number) => void;
}

export const CollaborativeSlide: React.FC<CollaborativeSlideProps> = ({
  slideId,
  children,
  className = '',
  onDoubleClick
}) => {
  const {
    presentationId,
    currentUserPermission,
    isCollaborationEnabled,
    slideComments,
    addSlideComment
  } = useCollaboration();
  
  const { updateCurrentSlide } = useUserPresence(presentationId);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  
  // Update current slide when this slide is focused
  useEffect(() => {
    updateCurrentSlide(slideId);
  }, [slideId, updateCurrentSlide]);
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isCollaborationEnabled || currentUserPermission === 'view') {
      if (onDoubleClick) {
        onDoubleClick(e.clientX, e.clientY);
      }
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addSlideComment(slideId, x, y);
  };
  
  const currentSlideComments = slideComments[slideId] || [];
  
  return (
    <div 
      className={`relative ${className}`}
      onDoubleClick={handleDoubleClick}
    >
      {children}
      
      {/* Render comment indicators */}
      {isCollaborationEnabled && currentSlideComments.map((comment) => (
        <CommentIndicator
          key={comment.id}
          comment={comment}
          onClick={() => setSelectedCommentId(comment.id)}
        />
      ))}
      
      {/* Live cursors for this specific slide */}
      {isCollaborationEnabled && presentationId && (
        <LiveCursors presentationId={presentationId} slideId={slideId} />
      )}
    </div>
  );
};

// Collaboration Toolbar Component
interface CollaborationToolbarProps {
  presentationId: string;
  onOpenSidebar: () => void;
  className?: string;
}

export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  presentationId,
  onOpenSidebar,
  className = ''
}) => {
  const { isCollaborationEnabled, currentUserPermission } = useCollaboration();
  
  if (!isCollaborationEnabled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Upgrade to Team tier for collaboration
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Presence Indicator */}
      <PresenceIndicator presentationId={presentationId} />
      
      {/* Collaboration Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
        >
          Collaborate
        </button>
        
        {currentUserPermission !== 'view' && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Double-click to comment
          </div>
        )}
      </div>
    </div>
  );
};

// Collaboration Status Badge
export const CollaborationStatusBadge: React.FC<{ presentationId: string }> = ({
  presentationId
}) => {
  const { isCollaborationEnabled } = useCollaboration();
  const { userPresences } = useCollaborationStore();
  
  if (!isCollaborationEnabled) return null;
  
  const onlineCount = Object.values(userPresences).filter(
    presence => presence.is_online && presence.presentation_id === presentationId
  ).length;
  
  if (onlineCount === 0) return null;
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      Live ({onlineCount})
    </div>
  );
};
