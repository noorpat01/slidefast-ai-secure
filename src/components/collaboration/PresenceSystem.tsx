import React, { useEffect, useState } from 'react';
import { MousePointer2, Users } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import type { UserPresence } from '../../types/collaboration';

// Live Cursor Component
interface LiveCursorProps {
  presence: UserPresence;
  color: string;
}

const LiveCursor: React.FC<LiveCursorProps> = ({ presence, color }) => {
  if (!presence.cursor_position) return null;
  
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: presence.cursor_position.x,
        top: presence.cursor_position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      <div className="relative">
        <MousePointer2 
          className="w-5 h-5" 
          style={{ color }} 
          fill={color}
        />
        <div 
          className="absolute top-5 left-3 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
          style={{ backgroundColor: color }}
        >
          {presence.user?.full_name || presence.user?.email}
        </div>
      </div>
    </div>
  );
};

// Presence Indicator Bar (shows who's online)
interface PresenceIndicatorProps {
  presentationId: string;
  maxVisible?: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  presentationId,
  maxVisible = 5
}) => {
  const { userPresences, currentPresentationId } = useCollaborationStore();
  
  // Only show if we're viewing the correct presentation
  if (currentPresentationId !== presentationId) return null;
  
  const onlineUsers = Object.values(userPresences).filter(presence => 
    presence.is_online && presence.presentation_id === presentationId
  );
  
  if (onlineUsers.length === 0) return null;
  
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const hiddenCount = onlineUsers.length - maxVisible;
  
  // Generate consistent colors for users
  const getUserColor = (userId: string) => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <div className="flex items-center">
        <Users className="w-4 h-4 text-gray-500 mr-2" />
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
          {onlineUsers.length} online
        </span>
      </div>
      
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((presence) => (
          <div
            key={presence.user_id}
            className="relative group"
            title={presence.user?.full_name || presence.user?.email}
          >
            <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-800">
              <AvatarImage src={presence.user?.avatar_url} />
              <AvatarFallback 
                className="text-xs font-medium text-white"
                style={{ backgroundColor: getUserColor(presence.user_id) }}
              >
                {presence.user?.full_name?.[0] || presence.user?.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white dark:border-gray-800 rounded-full"></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {presence.user?.full_name || presence.user?.email}
              {presence.current_slide_id && (
                <div className="text-xs opacity-75">On slide</div>
              )}
            </div>
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="relative">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                +{hiddenCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Live Cursors Container (renders all cursors)
interface LiveCursorsProps {
  presentationId: string;
  slideId?: string; // If provided, only show cursors on this specific slide
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  presentationId,
  slideId
}) => {
  const { userPresences, currentPresentationId } = useCollaborationStore();
  
  // Only show if we're viewing the correct presentation
  if (currentPresentationId !== presentationId) return null;
  
  const relevantPresences = Object.values(userPresences).filter(presence => {
    if (!presence.is_online || presence.presentation_id !== presentationId) {
      return false;
    }
    
    // If slideId is specified, only show cursors on that slide
    if (slideId && presence.cursor_position?.slide_id !== slideId) {
      return false;
    }
    
    return presence.cursor_position;
  });
  
  const getUserColor = (userId: string) => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // emerald
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  return (
    <>
      {relevantPresences.map((presence) => (
        <LiveCursor
          key={presence.user_id}
          presence={presence}
          color={getUserColor(presence.user_id)}
        />
      ))}
    </>
  );
};

// Hook for updating user presence
export const useUserPresence = (presentationId: string | null) => {
  const { updateUserPresence, currentPresentationId } = useCollaborationStore();
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  
  // Update cursor position
  const updateCursorPosition = (x: number, y: number, slideId?: string) => {
    if (!presentationId || presentationId !== currentPresentationId) return;
    
    updateUserPresence(presentationId, {
      cursor_position: { x, y, slide_id: slideId },
      current_slide_id: slideId || currentSlideId,
      is_online: true
    });
  };
  
  // Update current slide
  const updateCurrentSlide = (slideId: string | null) => {
    setCurrentSlideId(slideId);
    
    if (!presentationId || presentationId !== currentPresentationId) return;
    
    updateUserPresence(presentationId, {
      current_slide_id: slideId,
      is_online: true
    });
  };
  
  // Set up mouse tracking
  useEffect(() => {
    if (!presentationId || presentationId !== currentPresentationId) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      updateCursorPosition(e.clientX, e.clientY, currentSlideId || undefined);
    };
    
    const handleMouseLeave = () => {
      if (!presentationId) return;
      updateUserPresence(presentationId, {
        cursor_position: undefined
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [presentationId, currentPresentationId, currentSlideId, updateUserPresence]);
  
  // Set online status on mount/unmount
  useEffect(() => {
    if (!presentationId || presentationId !== currentPresentationId) return;
    
    updateUserPresence(presentationId, {
      is_online: true
    });
    
    // Set offline on unmount
    return () => {
      updateUserPresence(presentationId, {
        is_online: false,
        cursor_position: undefined
      });
    };
  }, [presentationId, currentPresentationId, updateUserPresence]);
  
  return {
    updateCursorPosition,
    updateCurrentSlide,
    currentSlideId
  };
};
