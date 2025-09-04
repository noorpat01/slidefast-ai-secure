// Collaboration types for real-time features

export type PermissionLevel = 'view' | 'edit' | 'admin';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type ActivityType = 
  | 'slide_created' 
  | 'slide_updated' 
  | 'slide_deleted'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'user_invited'
  | 'user_joined'
  | 'user_left'
  | 'permission_changed';

export interface Collaborator {
  id: string;
  presentation_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  joined_at: string;
  last_seen: string | null;
  is_online: boolean;
  cursor_position?: {
    x: number;
    y: number;
    slide_id?: string;
  };
  // User information (joined from users table)
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Comment {
  id: string;
  presentation_id: string;
  slide_id?: string; // null for presentation-level comments
  user_id: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  is_resolved: boolean;
  parent_comment_id?: string; // for threaded comments
  created_at: string;
  updated_at: string;
  // User information (joined from users table)
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  // Nested replies
  replies?: Comment[];
}

export interface PresentationInvitation {
  id: string;
  presentation_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string; // null until user accepts
  permission_level: PermissionLevel;
  status: InvitationStatus;
  token: string; // unique invitation token
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Inviter information
  inviter?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  // Presentation information
  presentation?: {
    id: string;
    title: string;
  };
}

export interface ActivityLogEntry {
  id: string;
  presentation_id: string;
  user_id: string;
  activity_type: ActivityType;
  details: Record<string, any>; // JSON field for activity-specific data
  created_at: string;
  // User information
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Real-time presence data
export interface UserPresence {
  user_id: string;
  presentation_id: string;
  is_online: boolean;
  cursor_position?: {
    x: number;
    y: number;
    slide_id?: string;
  };
  current_slide_id?: string;
  last_activity: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Invitation request/response types
export interface InviteUserRequest {
  presentation_id: string;
  invitee_email: string;
  permission_level: PermissionLevel;
  message?: string;
}

export interface InviteUserResponse {
  success: boolean;
  invitation?: PresentationInvitation;
  error?: string;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  collaborator?: Collaborator;
  presentation_id?: string;
  error?: string;
}

export interface SetPermissionsRequest {
  presentation_id: string;
  user_id: string;
  permission_level: PermissionLevel;
}

export interface SetPermissionsResponse {
  success: boolean;
  collaborator?: Collaborator;
  error?: string;
}

// Comment creation/update types
export interface CreateCommentRequest {
  presentation_id: string;
  slide_id?: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  parent_comment_id?: string;
}

export interface UpdateCommentRequest {
  comment_id: string;
  content?: string;
  is_resolved?: boolean;
}

// Real-time event types
export interface RealtimeEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface CollaboratorJoinedEvent {
  collaborator: Collaborator;
}

export interface CollaboratorLeftEvent {
  user_id: string;
  presentation_id: string;
}

export interface CommentAddedEvent {
  comment: Comment;
}

export interface CommentUpdatedEvent {
  comment: Comment;
}

export interface CommentDeletedEvent {
  comment_id: string;
  presentation_id: string;
}

export interface PresenceUpdateEvent {
  user_presence: UserPresence;
}

export interface SlideUpdateEvent {
  slide_id: string;
  presentation_id: string;
  user_id: string;
  changes: Record<string, any>;
}

// Legacy compatibility types (kept for backward compatibility)
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  company?: string;
  role?: string;
  bio?: string;
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
    };
    theme: 'light' | 'dark' | 'system';
  };
  created_at: string;
  updated_at: string;
}

// Legacy types (for backward compatibility)
export interface PresentationActivity {
  id: string;
  presentation_id: string;
  user_id: string;
  action_type: 'create' | 'edit' | 'comment' | 'invite' | 'share' | 'export';
  action_details: Record<string, any>;
  slide_id?: string;
  previous_content?: Record<string, any>;
  new_content?: Record<string, any>;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  presentation_id: string;
  user_id: string;
  session_id: string;
  slide_id?: string;
  cursor_position?: {
    x: number;
    y: number;
    element?: string;
  };
  last_activity: string;
  status: 'active' | 'idle' | 'disconnected';
  created_at: string;
  updated_at: string;
  user_profiles?: UserProfile;
}

export interface TeamInvitation {
  id: string;
  presentation_id: string;
  invited_by: string;
  invited_email: string;
  invited_user_id?: string;
  permission: 'view' | 'edit' | 'admin';
  invitation_token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CollaborationState {
  // Collaborators
  collaborators: Collaborator[];
  loadingCollaborators: boolean;
  
  // Comments
  comments: Comment[];
  loadingComments: boolean;
  
  // Active sessions and presence
  activeSessions: ActiveSession[];
  currentUserSession?: ActiveSession;
  
  // Activity tracking
  activities: PresentationActivity[];
  
  // Invitations
  invitations: TeamInvitation[];
  
  // Sharing
  shareLink?: string;
  sharingEnabled: boolean;
}

export interface CollaborationActions {
  // Collaborator management
  fetchCollaborators: (presentationId: string) => Promise<void>;
  inviteCollaborator: (presentationId: string, email: string, permission: 'view' | 'edit' | 'admin', message?: string) => Promise<void>;
  updateCollaboratorPermission: (presentationId: string, userId: string, permission: 'view' | 'edit' | 'admin') => Promise<void>;
  removeCollaborator: (presentationId: string, userId: string) => Promise<void>;
  
  // Comments
  fetchComments: (presentationId: string, slideId?: string) => Promise<void>;
  createComment: (presentationId: string, slideId: string, content: string, parentId?: string, position?: { x: number; y: number }) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  
  // Presence and sessions
  joinSession: (presentationId: string, slideId?: string) => Promise<void>;
  updatePresence: (presentationId: string, slideId?: string, status?: 'active' | 'idle') => Promise<void>;
  updateCursor: (presentationId: string, position: { x: number; y: number; element?: string }) => Promise<void>;
  leaveSession: (presentationId: string) => Promise<void>;
  fetchActiveSessions: (presentationId: string) => Promise<void>;
  
  // Sharing
  toggleSharing: (presentationId: string, enabled: boolean) => Promise<void>;
  
  // Invitations
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  
  // Activity
  fetchActivity: (presentationId: string) => Promise<void>;
}

export interface CollaborationStore extends CollaborationState, CollaborationActions {}
