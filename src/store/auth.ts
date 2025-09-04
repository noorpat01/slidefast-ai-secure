import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase, UsageStats, Subscription, Plan } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  loading: boolean
  usageStats: UsageStats | null
  subscription: Subscription | null
  plans: Plan[]
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  fetchUsageStats: () => Promise<void>
  fetchSubscription: () => Promise<void>
  fetchPlans: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  usageStats: null,
  subscription: null,
  plans: [],
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signUp: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
        }
      })

      if (error) throw error
      
      if (data.user && !data.session) {
        toast.success('Check your email for the confirmation link!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed')
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      if (data.user) {
        set({ user: data.user })
        toast.success('Signed in successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed')
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ user: null, usageStats: null, subscription: null })
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed')
    } finally {
      set({ loading: false })
    }
  },

  fetchUsageStats: async () => {
    const { user } = get()
    if (!user) return

    try {
      console.log('📋 Fetching usage stats...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Usage stats fetch timeout')), 10000)
      })
      
      const fetchPromise = supabase.functions.invoke('usage-tracker', {
        method: 'GET'
      })
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Usage stats fetch error:', error)
        throw error
      }
      
      console.log('✅ Usage stats fetched successfully')
      set({ usageStats: data.data })
    } catch (error: any) {
      console.error('❌ Failed to fetch usage stats:', error.message)
      // Set default usage stats to prevent blocking
      set({ 
        usageStats: {
          current_month: new Date().toISOString().substring(0, 7),
          presentations_created: 0,
          images_generated: 0,
          total_tokens_used: 0,
          monthly_limit: 5,
          remaining_presentations: 5,
          subscription_type: 'free',
          usage_percentage: 0
        }
      })
    }
  },

  fetchSubscription: async () => {
    const { user } = get()
    if (!user) return

    try {
      console.log('📋 Fetching subscription...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription fetch timeout')), 10000)
      })
      
      const fetchPromise = supabase
        .from('ai_present_subscriptions')
        .select(`
          *,
          ai_present_plans!price_id(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
        
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Subscription fetch error:', error)
        throw error
      }
      
      console.log('✅ Subscription fetched successfully')
      set({ subscription: data })
    } catch (error: any) {
      console.error('❌ Failed to fetch subscription:', error.message)
      // Set null subscription to prevent blocking
      set({ subscription: null })
    }
  },

  fetchPlans: async () => {
    try {
      console.log('📋 Fetching plans...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plans fetch timeout')), 10000)
      })
      
      const fetchPromise = supabase
        .from('ai_present_plans')
        .select('*')
        .order('price', { ascending: true })
        
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Plans fetch error:', error)
        throw error
      }
      
      console.log('✅ Plans fetched successfully')
      set({ plans: data || [] })
    } catch (error: any) {
      console.error('❌ Failed to fetch plans:', error.message)
      // Set empty plans array to prevent blocking
      set({ plans: [] })
    }
  }
}))