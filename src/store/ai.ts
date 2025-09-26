import { create } from 'zustand'
import { supabase, QualityScore, GeneratedContent } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AIState {
  // Quality Assessment
  qualityScore: QualityScore | null
  qualityLoading: boolean
  
  // Content Generation
  generatedContent: GeneratedContent | null
  contentGenerating: boolean
  
  // Real-time Analysis
  liveAnalysis: boolean
  analysisHistory: Array<{
    timestamp: Date
    content: string
    score: number
  }>
  
  // AI Settings
  settings: {
    researchDepth: 'basic' | 'standard' | 'comprehensive' | 'expert'
    tone: 'professional' | 'casual' | 'academic' | 'creative'
    audience: 'beginner' | 'intermediate' | 'expert' | 'phd'
    autoSuggestions: boolean
    qualityThreshold: number
  }
  
  // Actions
  analyzeContent: (content: string, contentType?: string) => Promise<QualityScore | null>
  generateContent: (params: {
    topic: string
    contentType?: string
    style?: string
    audience?: string
    length?: string
    researchDepth?: string
    includeData?: boolean
    tone?: string
    industry?: string
  }) => Promise<GeneratedContent | null>
  setLiveAnalysis: (enabled: boolean) => void
  updateSettings: (settings: Partial<AIState['settings']>) => void
  clearQualityScore: () => void
  clearGeneratedContent: () => void
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  qualityScore: null,
  qualityLoading: false,
  generatedContent: null,
  contentGenerating: false,
  liveAnalysis: false,
  analysisHistory: [],
  
  settings: {
    researchDepth: 'standard',
    tone: 'professional',
    audience: 'intermediate',
    autoSuggestions: true,
    qualityThreshold: 7.0
  },
  
  // Actions
  analyzeContent: async (content: string, contentType = 'presentation') => {
    try {
      set({ qualityLoading: true })
      
      const { data, error } = await supabase.functions.invoke('quality-validator', {
        body: {
          content,
          contentType,
          context: `Analyzing ${contentType} content for quality assessment`
        }
      })
      
      if (error) {
        console.error('Quality analysis error:', error)
        toast.error('Failed to analyze content quality')
        return null
      }
      
      const qualityData = data?.data || data
      
      if (!qualityData) {
        toast.error('No quality data received')
        return null
      }
      
      set({ qualityScore: qualityData })
      
      // Add to analysis history
      const { analysisHistory } = get()
      const newHistoryEntry = {
        timestamp: new Date(),
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        score: qualityData.overall_score || 0
      }
      
      set({
        analysisHistory: [newHistoryEntry, ...analysisHistory.slice(0, 9)] // Keep last 10
      })
      
      return qualityData
    } catch (error: any) {
      console.error('Content analysis error:', error)
      toast.error('Analysis failed: ' + (error.message || 'Unknown error'))
      return null
    } finally {
      set({ qualityLoading: false })
    }
  },
  
  generateContent: async (params) => {
    try {
      set({ contentGenerating: true })
      
      const { settings } = get()
      
      const requestParams = {
        topic: params.topic,
        contentType: params.contentType || 'slide',
        style: params.style || 'professional',
        audience: params.audience || settings.audience,
        length: params.length || 'medium',
        researchDepth: params.researchDepth || settings.researchDepth,
        includeData: params.includeData !== false,
        tone: params.tone || settings.tone,
        industry: params.industry
      }
      
      console.log('Generating content with params:', requestParams)
      
      const { data, error } = await supabase.functions.invoke('content-generator', {
        body: requestParams
      })
      
      if (error) {
        console.error('Content generation error:', error)
        toast.error('Failed to generate content')
        return null
      }
      
      const contentData = data?.data || data
      
      if (!contentData) {
        toast.error('No content generated')
        return null
      }
      
      set({ generatedContent: contentData })
      toast.success('Content generated successfully!')
      
      return contentData
    } catch (error: any) {
      console.error('Content generation error:', error)
      toast.error('Generation failed: ' + (error.message || 'Unknown error'))
      return null
    } finally {
      set({ contentGenerating: false })
    }
  },
  
  setLiveAnalysis: (enabled: boolean) => {
    set({ liveAnalysis: enabled })
    if (enabled) {
      toast.success('Live AI analysis enabled')
    } else {
      toast.success('Live AI analysis disabled')
    }
  },
  
  updateSettings: (newSettings) => {
    const { settings } = get()
    set({ settings: { ...settings, ...newSettings } })
    toast.success('AI settings updated')
  },
  
  clearQualityScore: () => set({ qualityScore: null }),
  clearGeneratedContent: () => set({ generatedContent: null })
}))