import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { UsageStats, Subscription } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { User as AuthUser } from '@supabase/supabase-js'

// Custom User interface that matches Supabase auth
interface User {
  id: string
  email?: string
  created_at?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  usageStats: UsageStats | null
  subscription: Subscription | null
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  fetchUsageStats: () => Promise<void>
  fetchSubscription: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  usageStats: null,
  subscription: null,
  
  setUser: (authUser) => {
    const user = authUser ? {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at
    } : null
    set({ user })
  },
  setLoading: (loading) => set({ loading }),
  
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true })
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      const user = data.user ? {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      } : null
      
      set({ user })
      
      // Fetch user data
      const { fetchUsageStats, fetchSubscription } = get()
      await Promise.allSettled([
        fetchUsageStats(),
        fetchSubscription()
      ])
      
      toast.success('Successfully signed in!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      set({ loading: false })
    }
  },
  
  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true })
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
        }
      })
      
      if (error) throw error
      
      toast.success('Please check your email to confirm your account')
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to sign up')
      throw error
    } finally {
      set({ loading: false })
    }
  },
  
  signOut: async () => {
    try {
      set({ loading: true })
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      set({ user: null, usageStats: null, subscription: null })
      toast.success('Successfully signed out')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
      throw error
    } finally {
      set({ loading: false })
    }
  },
  
  fetchUsageStats: async () => {
    try {
      const { user } = get()
      if (!user) return
      
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch usage stats:', error)
        return
      }
      
      set({ usageStats: data })
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    }
  },
  
  fetchSubscription: async () => {
    try {
      const { user } = get()
      if (!user) return
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          ai_present_plans (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Failed to fetch subscription:', error)
        return
      }
      
      set({ subscription: data })
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }
}))