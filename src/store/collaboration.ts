import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { CollaborationStore, Collaborator, Comment, ActiveSession, PresentationActivity, TeamInvitation } from '../types/collaboration'
import toast from 'react-hot-toast'

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

let sessionId: string | null = null
let currentPresentationId: string | null = null

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  // State
  collaborators: [],
  loadingCollaborators: false,
  comments: [],
  loadingComments: false,
  activeSessions: [],
  currentUserSession: undefined,
  activities: [],
  invitations: [],
  shareLink: undefined,
  sharingEnabled: false,

  // Collaborator management
  fetchCollaborators: async (presentationId: string) => {
    set({ loadingCollaborators: true })
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error

      set({ collaborators: data.data || [] })
    } catch (error: any) {
      console.error('Failed to fetch collaborators:', error)
      toast.error(error.message || 'Failed to fetch collaborators')
    } finally {
      set({ loadingCollaborators: false })
    }
  },

  inviteCollaborator: async (presentationId: string, email: string, permission: 'view' | 'edit' | 'admin', message?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'POST',
        body: {
          presentationId,
          email,
          permission,
          message
        }
      })

      if (error) throw error

      toast.success(`Invitation sent to ${email}`)
      
      // Refresh collaborators
      get().fetchCollaborators(presentationId)
    } catch (error: any) {
      console.error('Failed to invite collaborator:', error)
      toast.error(error.message || 'Failed to send invitation')
      throw error
    }
  },

  updateCollaboratorPermission: async (presentationId: string, userId: string, permission: 'view' | 'edit' | 'admin') => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'PUT',
        body: {
          presentationId,
          collaboratorUserId: userId,
          permission
        }
      })

      if (error) throw error

      toast.success('Permission updated successfully')
      
      // Update local state
      set(state => ({
        collaborators: state.collaborators.map(collab => 
          collab.user_id === userId ? { ...collab, permission } : collab
        )
      }))
    } catch (error: any) {
      console.error('Failed to update permission:', error)
      toast.error(error.message || 'Failed to update permission')
      throw error
    }
  },

  removeCollaborator: async (presentationId: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'DELETE',
        body: {
          presentationId,
          collaboratorUserId: userId
        }
      })

      if (error) throw error

      toast.success('Collaborator removed successfully')
      
      // Update local state
      set(state => ({
        collaborators: state.collaborators.filter(collab => collab.user_id !== userId)
      }))
    } catch (error: any) {
      console.error('Failed to remove collaborator:', error)
      toast.error(error.message || 'Failed to remove collaborator')
      throw error
    }
  },

  // Comments management
  fetchComments: async (presentationId: string, slideId?: string) => {
    set({ loadingComments: true })
    try {
      const url = slideId ? `${presentationId}?slide_id=${slideId}` : presentationId
      const { data, error } = await supabase.functions.invoke('comments-manager', {
        method: 'GET'
      })

      if (error) throw error

      set({ comments: data.data || [] })
    } catch (error: any) {
      console.error('Failed to fetch comments:', error)
      toast.error(error.message || 'Failed to fetch comments')
    } finally {
      set({ loadingComments: false })
    }
  },

  createComment: async (presentationId: string, slideId: string, content: string, parentId?: string, position?: { x: number; y: number }) => {
    try {
      const { data, error } = await supabase.functions.invoke('comments-manager', {
        method: 'POST',
        body: {
          slideId,
          content,
          parentId,
          positionX: position?.x,
          positionY: position?.y
        }
      })

      if (error) throw error

      toast.success('Comment added successfully')
      
      // Refresh comments
      get().fetchComments(presentationId, slideId)
    } catch (error: any) {
      console.error('Failed to create comment:', error)
      toast.error(error.message || 'Failed to add comment')
      throw error
    }
  },

  updateComment: async (commentId: string, content: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('comments-manager', {
        method: 'PUT',
        body: { content }
      })

      if (error) throw error

      toast.success('Comment updated successfully')
      
      // Update local state
      set(state => ({
        comments: updateCommentInTree(state.comments, commentId, { content, updated_at: new Date().toISOString() })
      }))
    } catch (error: any) {
      console.error('Failed to update comment:', error)
      toast.error(error.message || 'Failed to update comment')
      throw error
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('comments-manager', {
        method: 'DELETE'
      })

      if (error) throw error

      toast.success('Comment deleted successfully')
      
      // Update local state by removing deleted comment
      set(state => ({
        comments: removeCommentFromTree(state.comments, commentId)
      }))
    } catch (error: any) {
      console.error('Failed to delete comment:', error)
      toast.error(error.message || 'Failed to delete comment')
      throw error
    }
  },

  resolveComment: async (commentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('comments-manager', {
        method: 'PATCH',
        body: {}
      })

      if (error) throw error

      toast.success('Comment resolved successfully')
      
      // Update local state
      set(state => ({
        comments: updateCommentInTree(state.comments, commentId, { is_resolved: true })
      }))
    } catch (error: any) {
      console.error('Failed to resolve comment:', error)
      toast.error(error.message || 'Failed to resolve comment')
      throw error
    }
  },

  // Presence and sessions
  joinSession: async (presentationId: string, slideId?: string) => {
    try {
      if (!sessionId) {
        sessionId = generateSessionId()
      }
      
      currentPresentationId = presentationId

      const { data, error } = await supabase.functions.invoke('presence-tracker', {
        method: 'POST',
        body: {
          presentationId,
          sessionId,
          slideId
        }
      })

      if (error) throw error

      set({ currentUserSession: data.data[0] })
      
      // Start periodic presence updates
      startPresenceHeartbeat(presentationId)
    } catch (error: any) {
      console.error('Failed to join session:', error)
      toast.error(error.message || 'Failed to join collaboration session')
    }
  },

  updatePresence: async (presentationId: string, slideId?: string, status: 'active' | 'idle' = 'active') => {
    try {
      if (!sessionId) return

      const { data, error } = await supabase.functions.invoke('presence-tracker', {
        method: 'POST',
        body: {
          presentationId,
          sessionId,
          slideId,
          status
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Failed to update presence:', error)
    }
  },

  updateCursor: async (presentationId: string, position: { x: number; y: number; element?: string }) => {
    try {
      if (!sessionId) return

      const { data, error } = await supabase.functions.invoke('presence-tracker', {
        method: 'POST',
        body: {
          presentationId,
          sessionId,
          cursorPosition: position
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('Failed to update cursor:', error)
    }
  },

  leaveSession: async (presentationId: string) => {
    try {
      if (!sessionId) return

      const { data, error } = await supabase.functions.invoke('presence-tracker', {
        method: 'POST',
        body: {
          presentationId,
          sessionId
        }
      })

      if (error) throw error

      set({ currentUserSession: undefined, activeSessions: [] })
      
      // Clear session data
      sessionId = null
      currentPresentationId = null
      
      // Stop heartbeat
      stopPresenceHeartbeat()
    } catch (error: any) {
      console.error('Failed to leave session:', error)
    }
  },

  fetchActiveSessions: async (presentationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('presence-tracker', {
        method: 'GET'
      })

      if (error) throw error

      set({ activeSessions: data.data.allUsers || [] })
    } catch (error: any) {
      console.error('Failed to fetch active sessions:', error)
    }
  },

  // Sharing
  toggleSharing: async (presentationId: string, enabled: boolean) => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'POST',
        body: {
          presentationId,
          enabled
        }
      })

      if (error) throw error

      set({ 
        sharingEnabled: enabled,
        shareLink: data.shareLink
      })
      
      if (enabled) {
        toast.success('Sharing enabled! Link copied to clipboard.')
        navigator.clipboard.writeText(data.shareLink)
      } else {
        toast.success('Sharing disabled')
      }
    } catch (error: any) {
      console.error('Failed to toggle sharing:', error)
      toast.error(error.message || 'Failed to update sharing settings')
      throw error
    }
  },

  // Invitations
  acceptInvitation: async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'POST',
        body: { invitationToken: token }
      })

      if (error) throw error

      toast.success('Invitation accepted successfully!')
    } catch (error: any) {
      console.error('Failed to accept invitation:', error)
      toast.error(error.message || 'Failed to accept invitation')
      throw error
    }
  },

  declineInvitation: async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('collaboration-manager', {
        method: 'POST',
        body: { invitationToken: token }
      })

      if (error) throw error

      toast.success('Invitation declined')
    } catch (error: any) {
      console.error('Failed to decline invitation:', error)
      toast.error(error.message || 'Failed to decline invitation')
      throw error
    }
  },

  // Activity
  fetchActivity: async (presentationId: string) => {
    try {
      const { data, error } = await supabase
        .from('presentation_activity')
        .select('*, user_profiles(full_name, email, avatar_url)')
        .eq('presentation_id', presentationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      set({ activities: data || [] })
    } catch (error: any) {
      console.error('Failed to fetch activity:', error)
      toast.error(error.message || 'Failed to fetch activity history')
    }
  }
}))

// Helper function to update comments in nested tree structure
function updateCommentInTree(comments: Comment[], commentId: string, updates: Partial<Comment>): Comment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return { ...comment, ...updates }
    }
    if (comment.replies) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updates)
      }
    }
    return comment
  })
}

// Helper function to remove comments from nested tree structure
function removeCommentFromTree(comments: Comment[], commentId: string): Comment[] {
  return comments
    .filter(comment => comment.id !== commentId)
    .map(comment => {
      if (comment.replies) {
        return {
          ...comment,
          replies: removeCommentFromTree(comment.replies, commentId)
        }
      }
      return comment
    })
}

// Presence heartbeat management
let presenceInterval: NodeJS.Timeout | null = null

function startPresenceHeartbeat(presentationId: string) {
  stopPresenceHeartbeat() // Clear any existing interval
  
  presenceInterval = setInterval(() => {
    const store = useCollaborationStore.getState()
    if (sessionId && currentPresentationId) {
      store.updatePresence(currentPresentationId, undefined, 'active')
      store.fetchActiveSessions(currentPresentationId)
    }
  }, 30000) // Update every 30 seconds
}

function stopPresenceHeartbeat() {
  if (presenceInterval) {
    clearInterval(presenceInterval)
    presenceInterval = null
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const store = useCollaborationStore.getState()
    if (currentPresentationId) {
      store.leaveSession(currentPresentationId)
    }
  })
}