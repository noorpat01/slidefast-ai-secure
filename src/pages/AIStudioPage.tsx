import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { usePresentationStore } from '../store/presentation'
import { useIsMobile } from '../hooks/use-mobile'
import { supabase } from '../lib/supabase'
import { 
  Brain, 
  Wand2, 
  Mic,
  FileText,
  Image,
  Volume2,
  Sparkles,
  ArrowRight,
  Plus,
  Zap,
  Lightbulb,
  Target,
  Users,
  Briefcase,
  GraduationCap,
  Award,
  Download,
  Share,
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Shield,
  Cpu,
  BookOpen
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const AIStudioPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, usageStats } = useAuthStore()
  const { generating } = usePresentationStore()
  const isMobile = useIsMobile()
  
  // AI Content Generator state
  const [contentTopic, setContentTopic] = useState('')
  const [contentAudience, setContentAudience] = useState('professional')
  const [contentType, setContentType] = useState('business')
  const [slideCount, setSlideCount] = useState(10)
  
  // AI Image Creator state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageStyle, setImageStyle] = useState('professional')
  const [imageSize, setImageSize] = useState('1024x1024')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageResult, setImageResult] = useState<any>(null)
  
  // Voice Narration state
  const [narrationText, setNarrationText] = useState('')
  const [voiceStyle, setVoiceStyle] = useState('professional')
  const [narrationSpeed, setNarrationSpeed] = useState('normal')
  const [generatingVoice, setGeneratingVoice] = useState(false)
  const [voiceResult, setVoiceResult] = useState<any>(null)
  
  // Enhanced AI state
  const [activeTab, setActiveTab] = useState('content')
  const [generatingContent, setGeneratingContent] = useState(false)
  const [complexityAnalysis, setComplexityAnalysis] = useState<any>(null)
  const [aiRoutingInfo, setAiRoutingInfo] = useState<any>(null)
  const [lastGenerationMetrics, setLastGenerationMetrics] = useState<any>(null)
  
  const canGenerate = usageStats && (usageStats.monthly_limit === -1 || usageStats.remaining_presentations > 0)
  
  const studioFeatures = [
    {
      id: 'content',
      title: 'Enhanced AI Content Generator',
      description: 'Dual-AI architecture with Premium AI Assistant for academic content and Advanced AI Engine for business efficiency',
      icon: Brain,
      gradient: 'from-cyan-500 to-blue-500',
      features: [
        'PhD-level academic content (Premium AI Assistant)',
        'Cost-efficient business content (Advanced AI Engine)',
        'Intelligent Content Optimization',
        'Real-time quality assessment'
      ]
    },
    {
      id: 'image',
      title: 'AI Image Creator', 
      description: 'Generate custom visuals, diagrams, and illustrations tailored to your presentation needs',
      icon: Image,
      gradient: 'from-purple-500 to-pink-500',
      features: ['Custom illustrations', 'Professional diagrams', 'Brand-consistent visuals', 'Multiple formats']
    },
    {
      id: 'voice',
      title: 'Voice Narration Studio',
      description: 'Transform your presentation text into natural-sounding voice narration with AI',
      icon: Mic,
      gradient: 'from-green-500 to-teal-500',
      features: ['Natural voice synthesis', 'Multiple voice styles', 'Emotion control', 'Export ready audio']
    }
  ]
  
  const audienceOptions = [
    { value: 'beginner', label: 'Beginner', icon: Users, aiModel: 'Advanced AI Engine' },
    { value: 'professional', label: 'Professional', icon: Briefcase, aiModel: 'Advanced AI Engine' },
    { value: 'expert', label: 'Expert', icon: Brain, aiModel: 'Premium AI Assistant' },
    { value: 'academic', label: 'Academic', icon: GraduationCap, aiModel: 'Premium AI Assistant' },
    { value: 'phd', label: 'PhD Level', icon: Award, aiModel: 'Premium AI Assistant' }
  ]
  
  const imageStyles = [
    { value: 'professional', label: 'Professional', description: 'Clean, business-ready visuals' },
    { value: 'creative', label: 'Creative', description: 'Artistic and expressive designs' },
    { value: 'minimalist', label: 'Minimalist', description: 'Simple, clean aesthetics' },
    { value: 'technical', label: 'Technical', description: 'Detailed diagrams and charts' }
  ]
  
  const voiceStyles = [
    { value: 'professional', label: 'Professional', description: 'Clear, authoritative tone' },
    { value: 'conversational', label: 'Conversational', description: 'Friendly, approachable style' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic, engaging delivery' },
    { value: 'calm', label: 'Calm', description: 'Soothing, measured pace' }
  ]
  
  // Analyze content complexity before generation
  const analyzeComplexity = async () => {
    if (!contentTopic.trim()) return
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-complexity-analyzer', {
        body: {
          topic: contentTopic,
          audience_level: contentAudience,
          presentation_type: contentType
        }
      })
      
      if (error) {
        console.error('Complexity analysis error:', error)
        return
      }
      
      setComplexityAnalysis(data?.data)
      console.log('🧠 Complexity Analysis:', data?.data)
    } catch (error) {
      console.error('Failed to analyze complexity:', error)
    }
  }
  
  // Run complexity analysis when inputs change
  React.useEffect(() => {
    if (contentTopic.trim() && contentTopic.length > 10) {
      const timeoutId = setTimeout(analyzeComplexity, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [contentTopic, contentAudience, contentType])
  
  const handleGenerateContent = async () => {
    if (!contentTopic.trim()) return
    
    // Use the enhanced AI presentation generator
    setGeneratingContent(true)
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-ai-presentation-generator', {
        body: {
          topic: contentTopic,
          audience_level: contentAudience,
          presentation_type: contentType,
          tone: 'professional',
          slide_count: slideCount,
          user_id: user?.id
        }
      })
      
      if (error) {
        console.error('Enhanced content generation error:', error)
        // Fall back to navigation with pre-filled data
        navigate('/generate', { 
          state: { 
            topic: contentTopic,
            audienceLevel: contentAudience,
            presentationType: contentType,
            slideCount: slideCount
          }
        })
      } else if (data) {
        // Store AI routing info and metrics
        setAiRoutingInfo(data.ai_routing_info)
        setLastGenerationMetrics(data.generation_metrics)
        
        console.log('✅ Enhanced presentation generated:', {
          model: data.ai_routing_info?.selected_model,
          cost: data.ai_routing_info?.estimated_cost,
          quality: data.generation_metrics?.quality_grade
        })
        
        // Navigate to the generated presentation
        navigate('/generate', { 
          state: { 
            topic: contentTopic,
            audienceLevel: contentAudience,
            presentationType: contentType,
            slideCount: slideCount,
            generatedData: data.data,
            aiMetrics: data.generation_metrics,
            aiRouting: data.ai_routing_info
          }
        })
      }
    } catch (error) {
      console.error('Failed to generate enhanced content:', error)
      // Fall back to navigation
      navigate('/generate', { 
        state: { 
          topic: contentTopic,
          audienceLevel: contentAudience,
          presentationType: contentType,
          slideCount: slideCount
        }
      })
    } finally {
      setGeneratingContent(false)
    }
  }
  
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    
    setGeneratingImage(true)
    setImageResult(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: {
          prompt: imagePrompt,
          style: imageStyle,
          size: imageSize,
          userId: user?.id
        }
      })
      
      if (error) {
        setImageResult({ 
          error: true, 
          message: 'Image generation failed. Please try again.' 
        })
      } else {
        setImageResult(data?.data || { 
          ready: true, 
          message: 'Image generation infrastructure ready' 
        })
      }
    } catch (error) {
      setImageResult({ 
        error: true, 
        message: 'Failed to connect to image generation service.' 
      })
    } finally {
      setGeneratingImage(false)
    }
  }
  
  const handleGenerateVoice = async () => {
    if (!narrationText.trim()) return
    
    setGeneratingVoice(true)
    setVoiceResult(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-voice-generator', {
        body: {
          text: narrationText,
          voiceStyle: voiceStyle,
          speed: narrationSpeed,
          userId: user?.id
        }
      })
      
      if (error) {
        setVoiceResult({ 
          error: true, 
          message: 'Voice generation failed. Please try again.' 
        })
      } else {
        setVoiceResult(data?.data || { 
          ready: true, 
          message: 'Voice generation infrastructure ready' 
        })
      }
    } catch (error) {
      setVoiceResult({ 
        error: true, 
        message: 'Failed to connect to voice generation service.' 
      })
    } finally {
      setGeneratingVoice(false)
    }
  }
  
  // Get predicted AI model based on current selections
  const getPredictedModel = () => {
    if (contentAudience === 'phd' || contentAudience === 'academic' || contentType === 'academic') {
      return 'Premium AI Assistant'
    }
    if (complexityAnalysis?.complexity_analysis?.recommended_model === 'premium') {
      return 'Premium AI Assistant'
    }
    return 'Advanced AI Engine'
  }
  
  const getModelIcon = (model: string) => {
    return model === 'Premium AI Assistant' ? Award : Cpu
  }
  
  const getModelColor = (model: string) => {
    return model === 'Premium AI Assistant' ? 'text-purple-400' : 'text-cyan-400'
  }
  
  return (
    <div className="p-safe space-y-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Enhanced AI Presentation Studio
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-400">Powered by</span>
              <span className="text-sm font-medium text-cyan-400">Advanced AI Engine</span>
              <span className="text-slate-400">+</span>
              <span className="text-sm font-medium text-purple-400">Premium AI Assistant</span>
              <Shield className="h-4 w-4 text-green-400" />
            </div>
          </div>
        </div>
        <p className="text-slate-300 max-w-3xl">
          Intelligent dual-AI architecture that automatically selects the optimal model for your content. 
          PhD-level academic presentations use Premium AI Assistant, while business content leverages cost-effective Advanced AI Engine.
        </p>
      </div>
      
      {/* Enhanced Feature Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {studioFeatures.map((feature) => {
          const Icon = feature.icon
          const isActive = activeTab === feature.id
          
          return (
            <button
              key={feature.id}
              onClick={() => setActiveTab(feature.id)}
              className={`group p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 text-left ${
                isActive 
                  ? 'border-cyan-500/50 bg-slate-800/80 scale-105' 
                  : 'border-slate-700/50 hover:border-cyan-500/30 hover:scale-102'
              }`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
              <div className="space-y-1">
                {feature.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center text-xs text-slate-500">
                    <CheckCircle className="h-3 w-3 mr-2 text-cyan-400" />
                    {feat}
                  </div>
                ))}
              </div>
              {feature.id === 'content' && (
                <div className="mt-3 p-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
                  <div className="text-xs text-cyan-300 font-medium">Intelligent Content Optimization Active</div>
                  <div className="text-xs text-slate-400">85% cost savings + PhD-level quality</div>
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Active Studio Interface */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 sm:p-8">
        {/* Enhanced AI Content Generator */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">Enhanced AI Content Generator</h2>
              </div>
              
              {/* AI Model Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900/50 rounded-lg border border-slate-600">
                {React.createElement(getModelIcon(getPredictedModel()), {
                  className: `h-4 w-4 ${getModelColor(getPredictedModel())}`
                })}
                <span className={`text-sm font-medium ${getModelColor(getPredictedModel())}`}>
                  {getPredictedModel()}
                </span>
                <span className="text-xs text-slate-400">Predicted</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Presentation Topic
                  </label>
                  <textarea
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    placeholder="Describe your presentation topic in detail..."
                    rows={4}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      value={contentAudience}
                      onChange={(e) => setContentAudience(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    >
                      {audienceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.aiModel})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Slide Count
                    </label>
                    <input
                      type="number"
                      value={slideCount}
                      onChange={(e) => setSlideCount(parseInt(e.target.value) || 10)}
                      min="5"
                      max="30"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Intelligent Content Optimization Info */}
                <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                    Intelligent Content Optimization
                  </h3>
                  
                  {complexityAnalysis ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Complexity Score:</span>
                        <span className="text-white font-medium">
                          {complexityAnalysis.complexity_analysis.complexity_score}/30
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Recommended Model:</span>
                        <span className={getModelColor(complexityAnalysis.complexity_analysis.recommended_model === 'premium' ? 'Premium AI Assistant' : 'Advanced AI Engine')}>
                          {complexityAnalysis.complexity_analysis.recommended_model === 'premium' ? 'Premium AI Assistant' : 'Advanced AI Engine'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        {complexityAnalysis.complexity_analysis.reasoning}
                      </div>
                      
                      {complexityAnalysis.complexity_analysis.domain_analysis.complexity_factors.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-400 mb-1">Complexity Factors:</div>
                          {complexityAnalysis.complexity_analysis.domain_analysis.complexity_factors.slice(0, 2).map((factor: string, idx: number) => (
                            <div key={idx} className="text-xs text-slate-500">• {factor}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center">
                        <Target className="h-3 w-3 mr-2 text-cyan-400" />
                        Real-time content analysis
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-2 text-green-400" />
                        Cost optimization (up to 85% savings)
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-3 w-3 mr-2 text-purple-400" />
                        PhD-level quality when needed
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Cost & Quality Indicators */}
                <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                    Quality & Cost Efficiency
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expected Quality:</span>
                      <span className="text-green-400 font-medium">
                        {getPredictedModel() === 'Premium AI Assistant' ? 'PhD-Level' : 'Professional'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cost Efficiency:</span>
                      <span className="text-cyan-400 font-medium">
                        {getPredictedModel() === 'Premium AI Assistant' ? '15%' : '95%'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Est. Cost:</span>
                      <span className="text-white font-medium">
                        {getPredictedModel() === 'Premium AI Assistant' ? '$0.01-0.02' : '$0.0002-0.001'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {!canGenerate && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-orange-400 text-sm">
                      You've reached your monthly presentation limit. Upgrade to continue generating.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
              <div className="text-sm text-slate-400">
                <Clock className="h-4 w-4 inline mr-1" />
                Estimated time: {getPredictedModel() === 'Premium AI Assistant' ? '45-75 seconds' : '30-60 seconds'}
              </div>
              <button
                onClick={handleGenerateContent}
                disabled={!contentTopic.trim() || generatingContent || !canGenerate}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingContent ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating with {getPredictedModel()}...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate with {getPredictedModel()}
                  </>
                )}
              </button>
            </div>
            
            {/* Last Generation Metrics */}
            {lastGenerationMetrics && (
              <div className="mt-6 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-600/50">
                <h3 className="text-white font-medium mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  Last Generation Results
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">AI Model Used:</span>
                    <span className={`ml-2 font-medium ${
                      lastGenerationMetrics.ai_model_used === 'premium' ? 'text-purple-400' : 'text-cyan-400'
                    }`}>
                      {lastGenerationMetrics.ai_model_used === 'premium' ? 'Premium AI Assistant' : 'Advanced AI Engine'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Quality Score:</span>
                    <span className="ml-2 font-medium text-green-400">
                      {lastGenerationMetrics.quality_score}/15
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Cost:</span>
                    <span className="ml-2 font-medium text-white">
                      ${(lastGenerationMetrics.estimated_cost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Efficiency:</span>
                    <span className="ml-2 font-medium text-cyan-400">
                      {(lastGenerationMetrics.cost_efficiency * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* AI Image Creator - Same as before */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Image className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">AI Image Creator</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Image Description
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to create in detail..."
                    rows={4}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Image Style
                    </label>
                    <select
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      {imageStyles.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Size
                    </label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="1024x1024">Square (1024x1024)</option>
                      <option value="1024x768">Landscape (1024x768)</option>
                      <option value="768x1024">Portrait (768x1024)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <h3 className="text-white font-medium mb-3">Style Guide</h3>
                  <div className="space-y-2 text-sm">
                    {imageStyles.map((style) => (
                      <div key={style.value} className={`p-2 rounded ${imageStyle === style.value ? 'bg-purple-500/20 border border-purple-500/30' : ''}`}>
                        <div className="text-white font-medium">{style.label}</div>
                        <div className="text-slate-400 text-xs">{style.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
              <div className="text-sm text-slate-400">
                <Clock className="h-4 w-4 inline mr-1" />
                Estimated generation time: 15-30 seconds
              </div>
              <button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || generatingImage}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingImage ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </button>
            </div>
            
            {/* Image Generation Result */}
            {imageResult && (
              <div className="mt-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                {imageResult.error ? (
                  <div className="flex items-center text-red-400">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{imageResult.message}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Image Generation Request Processed</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Voice Narration Studio - Same as before */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Mic className="h-6 w-6 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Voice Narration Studio</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Narration Text
                  </label>
                  <textarea
                    value={narrationText}
                    onChange={(e) => setNarrationText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={6}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Voice Style
                    </label>
                    <select
                      value={voiceStyle}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      {voiceStyles.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Speed
                    </label>
                    <select
                      value={narrationSpeed}
                      onChange={(e) => setNarrationSpeed(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <h3 className="text-white font-medium mb-3">Voice Preview</h3>
                  <div className="space-y-2 text-sm">
                    {voiceStyles.map((style) => (
                      <div key={style.value} className={`p-2 rounded ${voiceStyle === style.value ? 'bg-green-500/20 border border-green-500/30' : ''}`}>
                        <div className="text-white font-medium flex items-center">
                          <Volume2 className="h-3 w-3 mr-2" />
                          {style.label}
                        </div>
                        <div className="text-slate-400 text-xs">{style.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <h3 className="text-white font-medium mb-2">Audio Features</h3>
                  <div className="space-y-1 text-sm text-slate-400">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-400" />
                      High-quality audio output
                    </div>
                    <div className="flex items-center">
                      <Download className="h-3 w-3 mr-2 text-blue-400" />
                      Multiple export formats
                    </div>
                    <div className="flex items-center">
                      <Share className="h-3 w-3 mr-2 text-purple-400" />
                      Easy integration
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
              <div className="text-sm text-slate-400">
                <Clock className="h-4 w-4 inline mr-1" />
                Estimated generation time: 20-40 seconds
              </div>
              <button
                onClick={handleGenerateVoice}
                disabled={!narrationText.trim() || generatingVoice}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingVoice ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Voice
                  </>
                )}
              </button>
            </div>
            
            {/* Voice Generation Result */}
            {voiceResult && (
              <div className="mt-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                {voiceResult.error ? (
                  <div className="flex items-center text-red-400">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{voiceResult.message}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Voice Generation Request Processed</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}