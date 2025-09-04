import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePresentationStore } from '../store/presentation'
import { useAuthStore } from '../store/auth'
import { 
  Sparkles, 
  Wand2, 
  Brain,
  Users,
  Briefcase,
  GraduationCap,
  FileText,
  Image,
  Play,
  Save,
  ArrowRight,
  Lightbulb,
  Target,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Star,
  Shield,
  Zap
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const GeneratorPage: React.FC = () => {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [audienceLevel, setAudienceLevel] = useState('intermediate') // Changed default to intermediate
  const [presentationType, setPresentationType] = useState('business')
  const [tone, setTone] = useState('professional')
  const [slideCount, setSlideCount] = useState(10)
  const [showPreview, setShowPreview] = useState(false)
  const [showQualityMetrics, setShowQualityMetrics] = useState(false)
  
  const { currentPresentation, generating, generatePresentation, savePresentation, saving, generationMetrics, qualityFeedback, clearGenerationMetrics } = usePresentationStore()
  const { usageStats } = useAuthStore()
  
  const canGenerate = usageStats && (usageStats.monthly_limit === -1 || usageStats.remaining_presentations > 0)

  const audienceLevels = [
    {
      value: 'beginner',
      label: 'Beginner',
      description: 'Simple explanations, basic concepts',
      icon: Users
    },
    {
      value: 'intermediate',
      label: 'Professional',
      description: 'Business-focused, practical insights',
      icon: Briefcase
    },
    {
      value: 'expert',
      label: 'Expert',
      description: 'Advanced technical content',
      icon: Brain
    },
    {
      value: 'phd',
      label: 'PhD Level',
      description: 'Academic rigor, research-backed',
      icon: GraduationCap
    }
  ]

  const presentationTypes = [
    { value: 'business', label: 'Business Presentation' },
    { value: 'academic', label: 'Academic Research' },
    { value: 'sales', label: 'Sales Pitch' },
    { value: 'educational', label: 'Educational Content' },
    { value: 'conference', label: 'Conference Talk' },
    { value: 'workshop', label: 'Workshop/Training' }
  ]

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'academic', label: 'Academic' },
    { value: 'creative', label: 'Creative' }
  ]

  // Helper function to get quality grade styling
  const getQualityGradeStyle = (score: number) => {
    if (score >= 12) return 'text-green-400 bg-green-400/20 border-green-400/30'
    if (score >= 10) return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
    if (score >= 8) return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
  }

  // Helper function to get quality icon
  const getQualityIcon = (score: number) => {
    if (score >= 12) return <Award className="h-5 w-5" />
    if (score >= 10) return <Star className="h-5 w-5" />
    if (score >= 8) return <CheckCircle className="h-5 w-5" />
    return <AlertTriangle className="h-5 w-5" />
  }

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    const result = await generatePresentation({
      topic: topic.trim(),
      audience_level: audienceLevel,
      presentation_type: presentationType,
      tone,
      slide_count: slideCount
    })
    
    // Show quality metrics if available
    if (result && result.generation_metrics) {
      setShowQualityMetrics(true)
    }
    
    setShowPreview(true)
  }

  const handleSave = async () => {
    if (!currentPresentation) return
    
    try {
      await savePresentation(currentPresentation)
      // Reset form
      setTopic('')
      setSlideCount(10)
      setShowPreview(false)
      // Navigate to presentations page to see the saved presentation
      navigate('/presentations')
    } catch (error) {
      console.error('Failed to save presentation:', error)
    }
  }
  
  const handleViewPresentations = () => {
    // Reset form and navigate to presentations page
    setTopic('')
    setSlideCount(10)
    setShowPreview(false)
    navigate('/presentations')
  }

  if (showPreview && currentPresentation) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Preview Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{currentPresentation.title}</h1>
              <p className="text-slate-300">{currentPresentation.description}</p>
              {currentPresentation.saved && (
                <div className="flex items-center mt-2 text-green-400 text-sm">
                  <Save className="h-4 w-4 mr-1" />
                  Automatically saved
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-slate-500 hover:text-white transition-colors"
              >
                Edit
              </button>
              {currentPresentation.saved ? (
                <button
                  onClick={handleViewPresentations}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 flex items-center"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View All Presentations
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Presentation'}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Quality Assessment Display */}
          {generationMetrics && (
            <div className="mb-8 bg-gradient-to-r from-slate-800/80 to-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${getQualityGradeStyle(generationMetrics.quality_score || 0)}`}>
                    {getQualityIcon(generationMetrics.quality_score || 0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Content Quality Assessment</h3>
                    <p className="text-sm text-slate-300">
                      Score: {generationMetrics.quality_score}/15 ({generationMetrics.quality_grade})
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {generationMetrics.professional_standards_met && (
                    <div className="flex items-center text-green-400 text-sm bg-green-400/20 px-2 py-1 rounded">
                      <Shield className="h-3 w-3 mr-1" />
                      Professional Grade
                    </div>
                  )}
                  {generationMetrics.executive_ready && (
                    <div className="flex items-center text-blue-400 text-sm bg-blue-400/20 px-2 py-1 rounded">
                      <Zap className="h-3 w-3 mr-1" />
                      Executive Ready
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Metrics Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Framework Applied</div>
                  <div className="text-white font-medium">{generationMetrics.framework_applied}</div>
                </div>
                <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Sophistication</div>
                  <div className="text-white font-medium capitalize">{generationMetrics.content_sophistication}</div>
                </div>
                <div className="text-center p-3 bg-slate-900/40 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Tokens Used</div>
                  <div className="text-white font-medium">{generationMetrics.tokens_used}</div>
                </div>
              </div>

              {/* Quality Feedback */}
              {qualityFeedback && (
                <div className="border-t border-slate-700/50 pt-4">
                  <div className="mb-2">
                    <div className="text-white font-medium mb-1">{qualityFeedback.message}</div>
                  </div>
                  {qualityFeedback.suggestions && qualityFeedback.suggestions.length > 0 && (
                    <div>
                      <div className="text-slate-400 text-sm mb-2">Suggestions:</div>
                      <ul className="text-slate-300 text-sm space-y-1">
                        {qualityFeedback.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Slides Preview */}
          <div className="space-y-6">
            {currentPresentation.slides.map((slide, index) => (
              <div key={slide.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {slide.id}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{slide.title}</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded capitalize">
                    {slide.layout ? slide.layout.replace('_', ' ') : 'default'}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Content</h4>
                    <ul className="space-y-2">
                      {slide.content.map((item, idx) => (
                        <li key={idx} className="text-slate-300 flex items-start">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Visual Suggestion</h4>
                      <p className="text-slate-400 text-sm">{slide.visual_suggestion}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Speaker Notes</h4>
                      <p className="text-slate-400 text-sm">{slide.speaker_notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Metadata */}
          <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Generation Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Audience Level:</span>
                <p className="text-slate-300 capitalize">{currentPresentation.metadata.audience_level}</p>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>
                <p className="text-slate-300 capitalize">{currentPresentation.metadata.presentation_type}</p>
              </div>
              <div>
                <span className="text-slate-400">Tone:</span>
                <p className="text-slate-300 capitalize">{currentPresentation.metadata.tone}</p>
              </div>
              <div>
                <span className="text-slate-400">Tokens Used:</span>
                <p className="text-slate-300">{currentPresentation.metadata.tokens_used}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Slidefast Presentation Generator
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Create intelligent presentations that adapt to your audience. From beginner explanations to PhD-level analysis.
          </p>
        </div>

        {/* Usage Warning */}
        {!canGenerate && (
          <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-amber-400 mr-2" />
              <span className="text-amber-300 font-medium">Monthly Limit Reached</span>
            </div>
            <p className="text-amber-200 text-sm mt-1">
              You've used all {usageStats?.monthly_limit} presentations this month. Upgrade your plan to continue creating.
            </p>
          </div>
        )}

        {/* Generation Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
          {/* Topic Input */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-3">
              What's your presentation topic?
            </label>
            <div className="relative">
              <Lightbulb className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Artificial Intelligence in Healthcare, Climate Change Solutions, Digital Marketing Strategies..."
                className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Audience Level */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-white mb-4">
              Who's your audience?
            </label>
            <div className="grid md:grid-cols-4 gap-4">
              {audienceLevels.map((level) => {
                const Icon = level.icon
                return (
                  <button
                    key={level.value}
                    onClick={() => setAudienceLevel(level.value)}
                    className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                      audienceLevel === level.value
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-600 bg-slate-900/30 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Icon className="h-6 w-6 mb-3" />
                    <h3 className="font-medium mb-1">{level.label}</h3>
                    <p className="text-xs opacity-80">{level.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Presentation Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Presentation Type
              </label>
              <select
                value={presentationType}
                onChange={(e) => setPresentationType(e.target.value)}
                className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {presentationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Slide Count */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Number of Slides
              </label>
              <input
                type="number"
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value) || 10)}
                min={3}
                max={20}
                className="w-full p-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || generating || !canGenerate}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center mx-auto relative"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-3" />
                  Generating Your Presentation...
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-slate-400 text-xs whitespace-nowrap">
                    DeepSeek: 30-60 seconds (cost-effective)
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-3" />
                  Generate Presentation
                  <ArrowRight className="h-5 w-5 ml-3" />
                </>
              )}
            </button>
            
            {canGenerate && usageStats && (
              <p className="text-slate-400 text-sm mt-3">
                {usageStats.monthly_limit === -1 
                  ? 'Unlimited generations remaining'
                  : `${usageStats.remaining_presentations} generations remaining this month`
                }
              </p>
            )}
            
            {/* Generation Tips */}
            <div className="mt-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700/50 max-w-md mx-auto">
              <div className="flex items-center mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-slate-300 text-sm font-medium">Pro Tips for Faster Generation</span>
              </div>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>• Be specific but concise in your topic description</li>
                <li>• DeepSeek takes 30-60s but costs 90% less than competitors</li>
                <li>• Shorter presentations (5-8 slides) generate faster</li>
                <li>• Please be patient - DeepSeek delivers great quality at low cost</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Adaptive Intelligence</h3>
            <p className="text-slate-400 text-sm">
              AI automatically adjusts content complexity based on your selected audience level.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">
              Generate professional presentations in seconds with our cost-effective AI engine.
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Professional Quality</h3>
            <p className="text-slate-400 text-sm">
              Research-backed content with proper structure, citations, and speaker notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}