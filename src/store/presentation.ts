import { create } from 'zustand'
import { supabase, Presentation, Template } from '../lib/supabase'
import toast from 'react-hot-toast'

export interface PresentationSlide {
  id: number
  title: string
  content: string[]
  visual_suggestion: string
  speaker_notes: string
  layout: 'title_and_bullets' | 'title_only' | 'image_focus' | 'comparison' | 'conclusion'
  background_image?: string
  // Enhanced professional slide metadata
  slide_type?: string
  framework_applied?: string
  quality_indicators?: {
    depth_score: number
    evidence_quality: string
    professional_language: boolean
    strategic_value: string
  }
}

export interface GeneratedPresentation {
  title: string
  description: string
  slides: PresentationSlide[]
  metadata: {
    topic: string
    audience_level: string
    presentation_type: string
    tone: string
    generated_at: string
    tokens_used: number
    // Enhanced professional metadata
    quality_assessment?: {
      overall_score: number
      context_relevance: number
      credibility_evidence: number
      user_experience: number
      target_achieved: boolean
      professional_grade: boolean
    }
    framework_analysis?: {
      primary_framework: string
      domain_expertise: string
      complexity_level: string
      writing_standard: string
    }
    content_enhancement?: {
      constitutional_ai_applied: boolean
      chain_of_thought_reasoning: boolean
      domain_specific_prompting: boolean
      quality_validation_passed: boolean
      professional_frameworks_used: string[]
    }
    generation_stats?: {
      prompt_sophistication: string
      content_depth: string
      audience_optimization: string
      expected_impact: string
    }
  }
  // Enhanced quality metrics
  quality_score?: {
    context: number
    credibility: number
    user_experience: number
    total: number
    rationale: string
  }
  executive_summary?: {
    key_insights: string[]
    business_impact: string
    recommended_actions: string[]
  }
  appendix?: {
    frameworks_used: string[]
    data_sources: string[]
    industry_context: string
    implementation_roadmap: string[]
  }
  id?: string
  saved?: boolean
}

interface PresentationState {
  presentations: Presentation[]
  templates: Template[]
  currentPresentation: GeneratedPresentation | null
  loading: boolean
  generating: boolean
  saving: boolean
  
  // Enhanced generation feedback
  generationMetrics: {
    quality_score?: number
    quality_grade?: string
    content_sophistication?: string
    framework_applied?: string
    tokens_used?: number
    professional_standards_met?: boolean
    executive_ready?: boolean
  } | null
  
  qualityFeedback: {
    message?: string
    suggestions?: string[]
  } | null
  
  // Actions
  fetchPresentations: () => Promise<void>
  fetchTemplates: () => Promise<void>
  generatePresentation: (params: {
    topic: string
    audience_level: string
    presentation_type: string
    tone: string
    slide_count: number
  }) => Promise<any> // Return the full response for quality metrics
  savePresentation: (presentation: GeneratedPresentation, status?: 'draft' | 'published') => Promise<string>
  updatePresentation: (id: string, updates: {
    title?: string
    description?: string
    content?: any
    status?: 'draft' | 'published'
  }) => Promise<void>
  deletePresentation: (id: string) => Promise<void>
  generateImage: (prompt: string, style?: string) => Promise<string>
  clearGenerationMetrics: () => void
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentations: [],
  templates: [],
  currentPresentation: null,
  loading: false,
  generating: false,
  saving: false,
  
  // Enhanced generation feedback
  generationMetrics: null,
  qualityFeedback: null,

  fetchPresentations: async () => {
    console.log('🔄 Starting fetchPresentations...')
    set({ loading: true })
    try {
      // Get current user
      console.log('🔍 Checking user authentication for fetch...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ User auth error during fetch:', userError)
        throw new Error(`Authentication failed: ${userError.message}`)
      }
      
      if (!user) {
        console.error('❌ No user found during fetch')
        throw new Error('User not authenticated')
      }
      
      console.log('✅ User authenticated for fetch:', user.id, user.email)

      console.log('📜 Querying presentations from database...')
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('❌ Database fetch error:', error)
        throw new Error(`Failed to fetch from database: ${error.message}`)
      }
      
      console.log('✅ Presentations fetched:', data?.length || 0, 'presentations')
      if (data && data.length > 0) {
        data.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.title} (${p.status}) - ${p.created_at}`)
        })
      }
      
      set({ presentations: data || [] })
    } catch (error: any) {
      console.error('❌ fetchPresentations failed:', error)
      toast.error(`Failed to fetch presentations: ${error.message}`)
    } finally {
      set({ loading: false })
    }
  },

  fetchTemplates: async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ templates: data || [] })
    } catch (error: any) {
      console.error('Error fetching templates:', error)
    }
  },

  generatePresentation: async (params) => {
    set({ generating: true })
    
    // Create a timeout promise - extended for DeepSeek cost-effectiveness
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout - DeepSeek is taking longer than expected')), 75000) // 75 second timeout for DeepSeek
    })
    
    try {
      // Race between the API call and timeout
      const apiCall = supabase.functions.invoke('ai-presentation-generator', {
        body: {
          topic: params.topic,
          audience_level: params.audience_level,
          presentation_type: params.presentation_type,
          tone: params.tone,
          slide_count: params.slide_count
        }
      })
      
      const { data, error } = await Promise.race([apiCall, timeoutPromise]) as any

      if (error) {
        throw new Error(error.message || 'Failed to generate presentation')
      }
      
      if (!data || !data.data) {
        throw new Error('Invalid response from AI service')
      }
      
      console.log('✅ Presentation generated successfully:', data.data.title)
      
      // Store enhanced generation metrics and feedback
      if (data.generation_metrics) {
        set({ 
          generationMetrics: data.generation_metrics,
          qualityFeedback: data.quality_feedback || null
        })
        
        console.log(`🎯 Quality Score: ${data.generation_metrics.quality_score}/15 (${data.generation_metrics.quality_grade})`)
        console.log(`📊 Framework Applied: ${data.generation_metrics.framework_applied}`)
        console.log(`🎓 Sophistication: ${data.generation_metrics.content_sophistication}`)
      }
      
      // Check if the presentation was auto-saved
      if (data.saved_id) {
        console.log('✅ Presentation auto-saved with ID:', data.saved_id)
        
        // Add the saved ID to the presentation data
        data.data.id = data.saved_id
        data.data.saved = true
        
        // Update local presentations list
        const { presentations } = get()
        const newPresentation: Presentation = {
          id: data.saved_id,
          user_id: '', // Will be filled by fetchPresentations
          title: data.data.title,
          description: data.data.description,
          content: data.data,
          theme: 'professional',
          status: 'draft' as 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        set({ presentations: [newPresentation, ...presentations] })
        
        // Show enhanced success message
        if (data.quality_feedback?.message) {
          toast.success(data.quality_feedback.message)
        } else {
          toast.success('Professional presentation generated and saved successfully!')
        }
      } else {
        console.log('⚠️ Presentation generated but not auto-saved')
        if (data.quality_feedback?.message) {
          toast.success(data.quality_feedback.message)
        } else {
          toast.success('Professional presentation generated successfully!')
        }
      }
      
      set({ currentPresentation: data.data })
      
      // Return the full response for UI components to access metrics
      return {
        presentation: data.data,
        generation_metrics: data.generation_metrics,
        quality_feedback: data.quality_feedback
      }
    } catch (error: any) {
      console.error('Presentation generation error:', error)
      
      if (error.message.includes('timeout')) {
        toast.error('Generation is taking longer than expected. Please try again with a simpler topic.')
      } else if (error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error.message || 'Failed to generate presentation. Please try again.')
      }
    } finally {
      set({ generating: false })
    }
  },

  savePresentation: async (presentation, status = 'draft') => {
    console.log('🔄 Starting savePresentation...')
    
    // Prevent multiple simultaneous saves
    const { saving } = get()
    if (saving) {
      console.log('⚠️ Save already in progress, skipping...')
      return ''
    }
    
    set({ saving: true })
    
    try {
      // Get current user
      console.log('🔍 Checking user authentication for save...')
      
      // Add timeout to auth check
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 10000)
      })
      
      const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any
      
      if (userError) {
        console.error('❌ User auth error during save:', userError)
        throw new Error(`Authentication failed: ${userError.message}`)
      }
      
      if (!user) {
        console.error('❌ No user found during save')
        throw new Error('User not authenticated')
      }
      
      console.log('✅ User authenticated for save:', user.id, user.email)

      console.log('💾 Preparing presentation data for database insert...')
      const insertData = {
        user_id: user.id,
        title: presentation.title,
        description: presentation.description,
        content: presentation,
        theme: 'professional',
        status
      }
      
      console.log('📤 Insert data prepared:', {
        user_id: insertData.user_id,
        title: insertData.title,
        description: insertData.description,
        theme: insertData.theme,
        status: insertData.status,
        content_slide_count: insertData.content?.slides?.length || 0
      })

      console.log('🚀 Executing database insert...')
      const { data, error } = await supabase
        .from('presentations')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to save to database: ${error.message}`)
      }
      
      if (!data) {
        console.error('❌ No data returned from insert operation')
        throw new Error('Insert operation succeeded but no data was returned')
      }
      
      console.log('✅ Presentation saved successfully with ID:', data.id)
      console.log('✅ Saved presentation details:', {
        id: data.id,
        title: data.title,
        status: data.status,
        created_at: data.created_at
      })
      
      // Verify the save by trying to fetch it immediately
      console.log('🔍 Verifying save by fetching the presentation...')
      const { data: verifyData, error: verifyError } = await supabase
        .from('presentations')
        .select('*')
        .eq('id', data.id)
        .single()
        
      if (verifyError) {
        console.error('⚠️ Could not verify save:', verifyError)
      } else {
        console.log('✅ Save verified - presentation exists in database:', verifyData.title)
      }
      
      // Update local state
      const { presentations } = get()
      set({ presentations: [data, ...presentations] })
      console.log('✅ Local state updated with new presentation count:', presentations.length + 1)
      
      toast.success('Presentation saved successfully!')
      return data.id
    } catch (error: any) {
      console.error('❌ savePresentation failed with error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      toast.error(`Failed to save presentation: ${error.message}`)
      throw error
    } finally {
      set({ saving: false })
      console.log('🏁 savePresentation completed, saving flag reset')
    }
  },

  updatePresentation: async (id, updates) => {
    console.log('🔄 Starting updatePresentation for ID:', id)
    set({ saving: true })
    
    try {
      // Get current user
      console.log('🔍 Checking user authentication for update...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ User auth error during update:', userError)
        throw new Error(`Authentication failed: ${userError.message}`)
      }
      
      if (!user) {
        console.error('❌ No user found during update')
        throw new Error('User not authenticated')
      }
      
      console.log('✅ User authenticated for update:', user.id, user.email)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      console.log('📤 Update data prepared:', {
        id,
        title: updateData.title,
        hasContent: !!updateData.content,
        status: updateData.status
      })

      console.log('🚀 Executing database update...')
      const { data, error } = await supabase
        .from('presentations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Database update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to update presentation: ${error.message}`)
      }
      
      if (!data) {
        console.error('❌ No data returned from update operation')
        throw new Error('Update operation succeeded but no data was returned')
      }
      
      console.log('✅ Presentation updated successfully:', data.title)
      
      // Update local state
      const { presentations } = get()
      const updatedPresentations = presentations.map(p => 
        p.id === id ? data : p
      )
      set({ presentations: updatedPresentations })
      
      console.log('✅ Local state updated')
    } catch (error: any) {
      console.error('❌ updatePresentation failed with error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      toast.error(`Failed to update presentation: ${error.message}`)
      throw error
    } finally {
      set({ saving: false })
      console.log('🏁 updatePresentation completed, saving flag reset')
    }
  },

  deletePresentation: async (id) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      // Update local state
      const { presentations } = get()
      set({ presentations: presentations.filter(p => p.id !== id) })
      
      toast.success('Presentation deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete presentation')
      console.error('Error deleting presentation:', error)
    }
  },

  generateImage: async (prompt, style = 'professional') => {
    try {
      const { data, error } = await supabase.functions.invoke('image-generator', {
        body: { prompt, style, size: '1024x1024' }
      })

      if (error) throw error
      return data.data.image_url
    } catch (error: any) {
      toast.error('Failed to generate image')
      console.error('Image generation error:', error)
      throw error
    }
  },

  clearGenerationMetrics: () => {
    set({ 
      generationMetrics: null,
      qualityFeedback: null
    })
  }
}))