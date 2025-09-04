import React, { useState } from 'react';
import { Mail, Copy, Clock, X, Settings, MoreVertical } from 'lucide-react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/use-toast';
import type { PermissionLevel, PresentationInvitation, Collaborator } from '../../types/collaboration';

// Invite User Dialog
interface InviteUserDialogProps {
  presentationId: string;
  children: React.ReactNode;
}

export const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  presentationId,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteUser } = useCollaborationStore();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsSubmitting(true);
    
    const result = await inviteUser({
      presentation_id: presentationId,
      invitee_email: email.trim(),
      permission_level: permission,
      message: message.trim() || undefined
    });
    
    if (result.success) {
      setEmail('');
      setPermission('view');
      setMessage('');
      setOpen(false);
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}.`
      });
    } else {
      toast({
        title: "Failed to send invitation",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Collaborator
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address..."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select value={permission} onValueChange={(value: PermissionLevel) => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-gray-500">Can view presentations</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="edit">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-xs text-gray-500">Can edit and comment</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-medium">Admin</div>
                      <div className="text-xs text-gray-500">Full access and user management</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!email.trim() || isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// User Permissions Menu
interface UserPermissionsMenuProps {
  collaborator: Collaborator;
  presentationId: string;
}

export const UserPermissionsMenu: React.FC<UserPermissionsMenuProps> = ({
  collaborator,
  presentationId
}) => {
  const { setUserPermissions, removeCollaborator } = useCollaborationStore();
  const { toast } = useToast();
  
  const handlePermissionChange = async (newPermission: PermissionLevel) => {
    const result = await setUserPermissions({
      presentation_id: presentationId,
      user_id: collaborator.user_id,
      permission_level: newPermission
    });
    
    if (result.success) {
      toast({
        title: "Permissions updated",
        description: `${collaborator.user?.full_name || collaborator.user?.email} now has ${newPermission} access.`
      });
    } else {
      toast({
        title: "Failed to update permissions",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveUser = async () => {
    if (!confirm(`Are you sure you want to remove ${collaborator.user?.full_name || collaborator.user?.email} from this presentation?`)) {
      return;
    }
    
    const result = await removeCollaborator(presentationId, collaborator.user_id);
    
    if (result.success) {
      toast({
        title: "User removed",
        description: `${collaborator.user?.full_name || collaborator.user?.email} has been removed from the presentation.`
      });
    } else {
      toast({
        title: "Failed to remove user",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
          <MoreVertical className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePermissionChange('view')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            Make Viewer
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePermissionChange('edit')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Make Editor
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePermissionChange('admin')}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            Make Admin
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleRemoveUser}
          className="text-red-600 dark:text-red-400"
        >
          Remove User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Pending Invitation Item
interface PendingInvitationItemProps {
  invitation: PresentationInvitation;
  canManage: boolean;
}

export const PendingInvitationItem: React.FC<PendingInvitationItemProps> = ({
  invitation,
  canManage
}) => {
  const { cancelInvitation } = useCollaborationStore();
  const { toast } = useToast();
  
  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Invite link copied",
      description: "The invitation link has been copied to your clipboard."
    });
  };
  
  const handleCancelInvitation = async () => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${invitation.invitee_email}?`)) {
      return;
    }
    
    const result = await cancelInvitation(invitation.id);
    
    if (result.success) {
      toast({
        title: "Invitation cancelled",
        description: `The invitation for ${invitation.invitee_email} has been cancelled.`
      });
    } else {
      toast({
        title: "Failed to cancel invitation",
        description: result.error,
        variant: "destructive"
      });
    }
  };
  
  const isExpired = new Date(invitation.expires_at) < new Date();
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {invitation.invitee_email}
          </span>
          <Badge 
            variant="secondary" 
            className={`text-xs px-2 py-0 ${
              isExpired 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}
          >
            {isExpired ? 'Expired' : 'Pending'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {invitation.permission_level} access
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Expires {new Date(invitation.expires_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {canManage && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyInviteLink}
            className="p-1 h-6 w-6"
            title="Copy invite link"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelInvitation}
            className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
            title="Cancel invitation"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

// Accept Invitation Page Component (for when users click invite links)
interface AcceptInvitationPageProps {
  token: string;
}

export const AcceptInvitationPage: React.FC<AcceptInvitationPageProps> = ({ token }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const { acceptInvitation } = useCollaborationStore();
  
  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setError(null);
    
    const result = await acceptInvitation(token);
    
    if (result.success) {
      setAccepted(true);
      setPresentationId(result.presentation_id || null);
    } else {
      setError(result.error || 'Failed to accept invitation');
    }
    
    setIsAccepting(false);
  };
  
  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Welcome to the team!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've successfully joined the presentation. You can now collaborate with your team members.
            </p>
            {presentationId && (
              <Button 
                className="w-full"
                onClick={() => window.location.href = `/presentation/${presentationId}`}
              >
                Open Presentation
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            You've been invited to collaborate
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Accept this invitation to join the presentation and start collaborating with your team.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <Button 
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full"
          >
            {isAccepting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Accept Invitation
          </Button>
        </div>
      </div>
    </div>
  );
};
