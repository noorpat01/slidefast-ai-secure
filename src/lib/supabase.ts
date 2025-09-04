import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xhlpnnoskmewqkjriqxq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobHBubm9za21ld3FranJpcXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTUwMTUsImV4cCI6MjA3MTM3MTAxNX0.p2nCOu1Bs63aVeKt0_Z5u7h28kMmCO_HSXkNiXfeMKQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Presentation {
  id: string
  user_id: string
  title: string
  description?: string
  content: any
  theme: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  category: string
  template_data: any
  preview_image_url?: string
  is_premium: boolean
  created_at: string
}

export interface UsageStats {
  current_month: string
  presentations_created: number
  images_generated: number
  total_tokens_used: number
  monthly_limit: number
  remaining_presentations: number
  subscription_type: string
  usage_percentage: number
}

export interface Plan {
  id: number
  price_id: string
  plan_type: string
  price: number
  monthly_limit: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: number
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  price_id: string
  status: string
  created_at: string
  updated_at: string
  ai_present_plans?: Plan
}