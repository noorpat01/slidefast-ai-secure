import React, { useState, useEffect } from 'react';
import { X, Users, MessageSquare, Clock, Settings, UserPlus, Eye, Edit, Crown } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import type { PermissionLevel } from '../../types/collaboration';
import { InviteUserDialog, UserPermissionsMenu, PendingInvitationItem } from './InvitationSystem';
import { AddCommentForm, CommentItem } from './CommentSystem';

// Helper functions
const getPermissionIcon = (permission: PermissionLevel) => {
  switch (permission) {
    case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'edit': return <Edit className="w-4 h-4 text-blue-500" />;
    case 'view': return <Eye className="w-4 h-4 text-gray-500" />;
  }
};

const getPermissionLabel = (permission: PermissionLevel) => {
  switch (permission) {
    case 'admin': return 'Admin';
    case 'edit': return 'Editor';
    case 'view': return 'Viewer';
  }
};

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'slide_created':
    case 'slide_updated':
    case 'slide_deleted':
      return '📄';
    case 'comment_added':
    case 'comment_updated':
    case 'comment_deleted':
      return '💬';
    case 'user_invited':
    case 'user_joined':
    case 'user_left':
      return '👤';
    case 'permission_changed':
      return '🔐';
    default:
      return '📝';
  }
};

const formatActivityMessage = (activity: any) => {
  const userName = activity.user?.full_name || activity.user?.email || 'Someone';
  
  switch (activity.activity_type) {
    case 'slide_created':
      return `${userName} created a new slide`;
    case 'slide_updated':
      return `${userName} updated a slide`;
    case 'slide_deleted':
      return `${userName} deleted a slide`;
    case 'comment_added':
      return `${userName} added a comment`;
    case 'comment_updated':
      return `${userName} updated a comment`;
    case 'comment_deleted':
      return `${userName} deleted a comment`;
    case 'user_invited':
      return `${userName} invited a new collaborator`;
    case 'user_joined':
      return `${userName} joined the presentation`;
    case 'user_left':
      return `${userName} left the presentation`;
    case 'permission_changed':
      return `${userName} changed user permissions`;
    default:
      return `${userName} performed an action`;
  }
};

interface CollaborationSidebarProps {
  presentationId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserPermission?: PermissionLevel;
}

const CollaborationSidebar: React.FC<CollaborationSidebarProps> = ({
  presentationId,
  isOpen,
  onClose,
  currentUserPermission = 'view'
}) => {
  const {
    collaborators,
    comments,
    pendingInvitations,
    userPresences,
    activityLog,
    isLoadingCollaborators,
    isLoadingComments,
    error,
    setCurrentPresentation,
    loadInvitations,
    loadActivityLog,
    clearError
  } = useCollaborationStore();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments' | 'activity'>('collaborators');
  
  useEffect(() => {
    if (isOpen && presentationId) {
      setCurrentPresentation(presentationId);
      loadInvitations(presentationId);
      loadActivityLog(presentationId);
    }
  }, [isOpen, presentationId, setCurrentPresentation, loadInvitations, loadActivityLog]);
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Collaboration Error",
        description: error,
        variant: "destructive"
      });
      clearError();
    }
  }, [error, toast, clearError]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Collaboration
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="collaborators" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments
              {comments.filter(c => !c.is_resolved).length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs px-1">
                  {comments.filter(c => !c.is_resolved).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="collaborators" className="flex-1 px-4 pb-4">
            <CollaboratorsTab 
              collaborators={collaborators}
              userPresences={userPresences}
              pendingInvitations={pendingInvitations}
              presentationId={presentationId}
              currentUserPermission={currentUserPermission}
              isLoading={isLoadingCollaborators}
            />
          </TabsContent>
          
          <TabsContent value="comments" className="flex-1 px-4 pb-4">
            <CommentsTab 
              comments={comments}
              presentationId={presentationId}
              currentUserPermission={currentUserPermission}
              isLoading={isLoadingComments}
            />
          </TabsContent>
          
          <TabsContent value="activity" className="flex-1 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {activityLog.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity yet</p>
                  </div>
                ) : (
                  activityLog.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="text-lg">{getActivityIcon(activity.activity_type)}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {formatActivityMessage(activity)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleDateString()} at{' '}
                          {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Collaborators Tab Component
interface CollaboratorsTabProps {
  collaborators: any[];
  userPresences: Record<string, any>;
  pendingInvitations: any[];
  presentationId: string;
  currentUserPermission: PermissionLevel;
  isLoading: boolean;
}

const CollaboratorsTab: React.FC<CollaboratorsTabProps> = ({
  collaborators,
  userPresences,
  pendingInvitations,
  presentationId,
  currentUserPermission,
  isLoading
}) => {
  const canManageUsers = currentUserPermission === 'admin';
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {/* Invite Button */}
        {canManageUsers && (
          <InviteUserDialog presentationId={presentationId}>
            <Button className="w-full" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Collaborator
            </Button>
          </InviteUserDialog>
        )}
        
        {/* Active Collaborators */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Team Members ({collaborators.length})
          </h3>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No collaborators yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator) => {
                const presence = userPresences[collaborator.user_id];
                const isOnline = presence?.is_online;
                
                return (
                  <div key={collaborator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={collaborator.user?.avatar_url} />
                        <AvatarFallback>
                          {collaborator.user?.full_name?.[0] || collaborator.user?.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {collaborator.user?.full_name || collaborator.user?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPermissionIcon(collaborator.permission_level)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getPermissionLabel(collaborator.permission_level)}
                        </span>
                      </div>
                    </div>
                    
                    {canManageUsers && collaborator.permission_level !== 'admin' && (
                      <UserPermissionsMenu 
                        collaborator={collaborator}
                        presentationId={presentationId}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <PendingInvitationItem 
                  key={invitation.id}
                  invitation={invitation}
                  canManage={canManageUsers}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// Comments Tab Component
interface CommentsTabProps {
  comments: any[];
  presentationId: string;
  currentUserPermission: PermissionLevel;
  isLoading: boolean;
}

const CommentsTab: React.FC<CommentsTabProps> = ({
  comments,
  presentationId,
  currentUserPermission,
  isLoading
}) => {
  const canComment = currentUserPermission !== 'view';
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        {/* Add Comment */}
        {canComment && (
          <AddCommentForm presentationId={presentationId} />
        )}
        
        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
            {!canComment && (
              <p className="text-xs mt-1">You need edit permissions to add comments</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem 
                key={comment.id}
                comment={comment}
                currentUserPermission={currentUserPermission}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

// Additional helper components would go here...
// InviteUserDialog, UserPermissionsMenu, PendingInvitationItem, AddCommentForm, CommentItem

export default CollaborationSidebar;
