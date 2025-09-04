import React, { useState } from 'react';
import { Plus, Send, MoreVertical, Check, X, Reply } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useToast } from '../../hooks/use-toast';
import type { Comment, PermissionLevel } from '../../types/collaboration';

// Add Comment Form
interface AddCommentFormProps {
  presentationId: string;
  slideId?: string;
  parentCommentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export const AddCommentForm: React.FC<AddCommentFormProps> = ({
  presentationId,
  slideId,
  parentCommentId,
  onCancel,
  placeholder = "Add a comment..."
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createComment } = useCollaborationStore();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    
    const result = await createComment({
      presentation_id: presentationId,
      slide_id: slideId,
      content: content.trim(),
      parent_comment_id: parentCommentId
    });
    
    if (result.success) {
      setContent('');
      if (onCancel) onCancel();
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully."
      });
    } else {
      toast({
        title: "Failed to add comment",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          size="sm" 
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          ) : (
            <Send className="w-3 h-3" />
          )}
          {parentCommentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </form>
  );
};

// Individual Comment Item
interface CommentItemProps {
  comment: Comment;
  currentUserPermission: PermissionLevel;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserPermission,
  depth = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { 
    updateComment, 
    deleteComment, 
    resolveComment,
    currentPresentationId 
  } = useCollaborationStore();
  const { toast } = useToast();
  
  const canEdit = currentUserPermission === 'admin' || currentUserPermission === 'edit';
  const canReply = currentUserPermission !== 'view' && depth < 3; // Limit nesting depth
  
  const handleResolve = async () => {
    const result = await resolveComment(comment.id);
    if (result.success) {
      toast({
        title: "Comment resolved",
        description: "The comment has been marked as resolved."
      });
    } else {
      toast({
        title: "Failed to resolve comment",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  const handleEdit = async () => {
    if (!editContent.trim()) return;
    
    const result = await updateComment({
      comment_id: comment.id,
      content: editContent.trim()
    });
    
    if (result.success) {
      setIsEditing(false);
      toast({
        title: "Comment updated",
        description: "Your comment has been updated."
      });
    } else {
      toast({
        title: "Failed to update comment",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    const result = await deleteComment(comment.id);
    if (result.success) {
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted."
      });
    } else {
      toast({
        title: "Failed to delete comment",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div className={`p-3 rounded-lg border ${comment.is_resolved ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <Avatar className="w-6 h-6">
              <AvatarImage src={comment.user?.avatar_url} />
              <AvatarFallback className="text-xs">
                {comment.user?.full_name?.[0] || comment.user?.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {comment.user?.full_name || comment.user?.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString()} at{' '}
                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {comment.is_resolved && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleEdit}>
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(comment.content);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    {canReply && !comment.is_resolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsReplying(!isReplying)}
                        className="text-xs h-6 px-2"
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                    )}
                    
                    {!comment.is_resolved && canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleResolve}
                        className="text-xs h-6 px-2 text-green-600 hover:text-green-700"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Comment Menu */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Reply Form */}
      {isReplying && currentPresentationId && (
        <div className="ml-8">
          <AddCommentForm
            presentationId={currentPresentationId}
            slideId={comment.slide_id}
            parentCommentId={comment.id}
            onCancel={() => setIsReplying(false)}
            placeholder="Write a reply..."
          />
        </div>
      )}
      
      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserPermission={currentUserPermission}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Floating Comment Indicator (for slide-specific comments)
interface CommentIndicatorProps {
  comment: Comment;
  onClick: () => void;
}

export const CommentIndicator: React.FC<CommentIndicatorProps> = ({
  comment,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-medium transform -translate-x-3 -translate-y-3 z-10 ${
        comment.is_resolved 
          ? 'bg-green-500 text-white' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
      style={{
        left: comment.position?.x || 0,
        top: comment.position?.y || 0
      }}
    >
      {comment.is_resolved ? (
        <Check className="w-3 h-3" />
      ) : (
        <span>{(comment.replies?.length || 0) + 1}</span>
      )}
    </button>
  );
};
