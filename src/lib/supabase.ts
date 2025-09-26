import { createClient } from '@supabase/supabase-js'

// Supabase configuration for the presentation platform
const supabaseUrl = 'https://xhlpnnoskmewqkjriqxq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobHBubm9za21ld3FranJpcXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTUwMTUsImV4cCI6MjA3MTM3MTAxNX0.p2nCOu1Bs63aVeKt0_Z5u7h28kMmCO_HSXkNiXfeMKQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types - simplified to match actual usage
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
  id: number
  name: string
  description: string
  category: string
  sub_category: string
  tags: string[]
  template_data: any
  preview_image_url?: string
  thumbnail_url?: string
  is_premium: boolean
  is_active: boolean
  usage_count: number
  rating: number
  color_scheme: string
  style: string
  layout_type: string
  difficulty_level: string
  estimated_slides: number
  is_favorited?: boolean
  created_at: string
  updated_at: string
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

// AI Integration Types
export interface QualityScore {
  overall_score: number
  dimensions: {
    accuracy: DimensionScore
    readability: DimensionScore
    engagement: DimensionScore
    structure: DimensionScore
    originality: DimensionScore
    professional_impact: DimensionScore
  }
  priority_recommendations: Recommendation[]
  strengths: string[]
  areas_for_improvement: string[]
  confidence_score: number
}

export interface DimensionScore {
  score: number
  feedback: string
  improvements: string[]
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: string
  recommendation: string
  impact: string
}

export interface GeneratedContent {
  content: {
    title: string
    main_content: string
    key_points: string[]
    supporting_data: SupportingData[]
    call_to_action: string
    visual_suggestions: VisualSuggestion[]
  }
  research_insights: {
    industry_trends: string[]
    expert_perspectives: string[]
    latest_developments: string[]
  }
  quality_indicators: {
    research_depth_score: number
    factual_accuracy_confidence: number
    audience_alignment_score: number
    actionability_score: number
  }
  metadata: {
    word_count: number
    reading_time_minutes: number
    complexity_level: string
    sources_referenced: number
  }
}

export interface SupportingData {
  statistic: string
  source: string
  relevance: string
}

export interface VisualSuggestion {
  type: string
  description: string
  data_points?: string[]
}