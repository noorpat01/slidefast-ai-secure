// Export all collaboration components from a single entry point

// Main provider and integration components
export { 
  CollaborationProvider, 
  useCollaboration,
  CollaborativeSlide,
  CollaborationToolbar,
  CollaborationStatusBadge
} from './CollaborationProvider';

// Sidebar and main UI
export { default as CollaborationSidebar } from './CollaborationSidebar';

// Comment system
export { 
  AddCommentForm, 
  CommentItem, 
  CommentIndicator 
} from './CommentSystem';

// Invitation system
export {
  InviteUserDialog,
  UserPermissionsMenu,
  PendingInvitationItem,
  AcceptInvitationPage
} from './InvitationSystem';

// Presence system
export {
  PresenceIndicator,
  LiveCursors,
  useUserPresence
} from './PresenceSystem';

// Re-export types and store
export type {
  Collaborator,
  Comment,
  PresentationInvitation,
  UserPresence,
  PermissionLevel
} from '../../types/collaboration';

export { useCollaborationStore } from '../../store/collaborationStore';
