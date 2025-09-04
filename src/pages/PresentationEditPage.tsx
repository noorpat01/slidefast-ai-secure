import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePresentationStore } from '../store/presentation'
import { useAIEnhancement } from '../contexts/AIEnhancementContext'
import { AIAssistantSidebar } from '../components/AIAssistantSidebar'
import { AIQuickActions } from '../components/AIQuickActions'
import SlideRenderer from '../components/SlideRenderer'
import RichTextEditor from '../components/ui/RichTextEditor'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  FileText,
  Calendar,
  ChevronUp,
  ChevronDown,
  Users,
  MessageCircle
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { 
  CollaborationProvider,
  CollaborationToolbar,
  CollaborativeSlide,
  CollaborationStatusBadge
} from '../components/collaboration/CollaborationProvider'
import CollaborationSidebar from '../components/collaboration/CollaborationSidebar'
import { PresenceIndicator } from '../components/collaboration/PresenceSystem'
import { useCollaborationStore } from '../store/collaborationStore'
import toast from 'react-hot-toast'

interface EditableSlide {
  id: number
  title: string
  content: string[]
  visual_suggestion: string
  speaker_notes: string
  layout: string
}

interface EditablePresentation {
  title: string
  description: string
  slides: EditableSlide[]
  metadata: any
}

export const PresentationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { presentations, loading, fetchPresentations, updatePresentation, saving } = usePresentationStore()
  
  const [editedPresentation, setEditedPresentation] = useState<EditablePresentation | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAISidebar, setShowAISidebar] = useState(false)
  const [showCollaborationSidebar, setShowCollaborationSidebar] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  
  // Collaboration store
  const {
    setCurrentPresentation,
    userPresences,
    comments,
    collaborators,
    isLoadingCollaborators
  } = useCollaborationStore()
  
  const { 
    analyzeContent, 
    getTemplateRecommendations, 
    loadingAnalysis, 
    loadingTemplates 
  } = useAIEnhancement()

  const presentation = presentations.find(p => p.id === id)

  useEffect(() => {
    if (presentations.length === 0) {
      fetchPresentations()
    }
  }, [presentations.length, fetchPresentations])

  useEffect(() => {
    if (presentation) {
      setEditedPresentation({
        title: presentation.title,
        description: presentation.description || '',
        slides: presentation.content?.slides || [],
        metadata: presentation.content?.metadata || {}
      })
      
      // Set up collaboration for this presentation
      setCurrentPresentation(presentation.id)
    }
  }, [presentation, setCurrentPresentation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!presentation || !editedPresentation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">Presentation Not Found</h2>
          <p className="text-slate-400 mb-6">The presentation you're trying to edit doesn't exist or has been deleted.</p>
          <Link
            to="/presentations"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Presentations
          </Link>
        </div>
      </div>
    )
  }

  const updateTitle = (title: string) => {
    setEditedPresentation(prev => prev ? { ...prev, title } : null)
    setHasChanges(true)
    
    // Real-time sync for collaborative editing
    if (presentation?.id) {
      syncTitleUpdate(title)
    }
  }
  
  const syncTitleUpdate = async (title: string) => {
    // This could be enhanced to broadcast title changes to collaborators in real-time
    // For now, we'll rely on the save mechanism
  }

  const updateDescription = (description: string) => {
    setEditedPresentation(prev => prev ? { ...prev, description } : null)
    setHasChanges(true)
  }

  const updateSlide = (slideIndex: number, updates: Partial<EditableSlide>) => {
    setEditedPresentation(prev => {
      if (!prev) return null
      const newSlides = [...prev.slides]
      newSlides[slideIndex] = { ...newSlides[slideIndex], ...updates }
      return { ...prev, slides: newSlides }
    })
    setHasChanges(true)
    
    // Real-time sync for collaborative editing
    if (presentation?.id && editedPresentation?.slides[slideIndex]) {
      syncSlideUpdate(editedPresentation.slides[slideIndex].id.toString(), updates)
    }
  }
  
  const syncSlideUpdate = async (slideId: string, updates: Partial<EditableSlide>) => {
    // This could broadcast slide changes to collaborators in real-time
    // For now, we'll rely on the save mechanism, but this is where you'd
    // implement operational transformation for real-time collaborative editing
  }

  const addSlide = () => {
    const newSlideId = editedPresentation.slides.length + 1
    
    // Create professional default content based on slide number
    const getDefaultSlideContent = (slideId: number) => {
      if (slideId === 1) {
        return {
          title: 'Presentation Title',
          content: [
            'Key objective and main message',
            'Target audience and expected outcomes',
            'Presentation structure overview'
          ],
          visual_suggestion: 'Professional title slide with company branding and key visual elements',
          speaker_notes: 'Welcome the audience and introduce yourself. State the main objective of the presentation and outline what will be covered.',
          layout: 'title_and_bullets'
        }
      } else if (slideId === 2) {
        return {
          title: 'Agenda & Overview',
          content: [
            'Current situation analysis',
            'Key challenges and opportunities', 
            'Proposed solutions and strategies',
            'Implementation roadmap',
            'Expected outcomes and next steps'
          ],
          visual_suggestion: 'Clean agenda layout with numbered sections and visual indicators',
          speaker_notes: 'Outline the presentation structure to give the audience a roadmap of what to expect.',
          layout: 'title_and_bullets'
        }
      } else {
        const slideTemplates = [
          {
            title: 'Key Benefits & Value Proposition',
            content: [
              'Increased efficiency and cost savings',
              'Improved customer satisfaction and retention',
              'Enhanced competitive advantage',
              'Streamlined processes and workflows'
            ],
            visual_suggestion: 'Benefits with icons and metrics to support each point',
            layout: 'title_and_bullets'
          },
          {
            title: 'Market Analysis & Insights', 
            content: [
              'Current market size and growth trends',
              'Competitor landscape and positioning',
              'Customer needs and pain points',
              'Market opportunities and threats'
            ],
            visual_suggestion: 'Charts, graphs, or infographics showing market data',
            layout: 'title_and_bullets'
          },
          {
            title: 'Implementation Strategy',
            content: [
              'Phase 1: Foundation and planning (Months 1-2)',
              'Phase 2: Core implementation (Months 3-5)', 
              'Phase 3: Testing and optimization (Months 6-7)',
              'Phase 4: Launch and scaling (Months 8-9)'
            ],
            visual_suggestion: 'Timeline or roadmap visualization with key milestones',
            layout: 'title_and_bullets'
          },
          {
            title: 'Results & Impact',
            content: [
              '25% increase in operational efficiency',
              '30% reduction in processing time',
              '95% customer satisfaction rating',
              '$2.5M in annual cost savings'
            ],
            visual_suggestion: 'Dashboard-style metrics with KPIs and performance indicators',
            layout: 'title_and_bullets'
          }
        ]
        
        const template = slideTemplates[(slideId - 3) % slideTemplates.length]
        return {
          ...template,
          speaker_notes: `Present the key points clearly and support with evidence. Allow time for questions and discussion.`
        }
      }
    }
    
    const defaultContent = getDefaultSlideContent(newSlideId)
    
    const newSlide: EditableSlide = {
      id: newSlideId,
      title: defaultContent.title,
      content: defaultContent.content,
      visual_suggestion: defaultContent.visual_suggestion,
      speaker_notes: defaultContent.speaker_notes,
      layout: defaultContent.layout as any
    }
    
    setEditedPresentation(prev => {
      if (!prev) return null
      return { ...prev, slides: [...prev.slides, newSlide] }
    })
    setHasChanges(true)
    toast.success('New slide added with professional content')
  }

  const deleteSlide = (slideIndex: number) => {
    if (editedPresentation.slides.length <= 1) {
      toast.error('Cannot delete the only slide in the presentation')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this slide?')) {
      setEditedPresentation(prev => {
        if (!prev) return null
        const newSlides = prev.slides.filter((_, index) => index !== slideIndex)
        // Renumber slides
        newSlides.forEach((slide, index) => {
          slide.id = index + 1
        })
        return { ...prev, slides: newSlides }
      })
      setHasChanges(true)
    }
  }

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= editedPresentation.slides.length) return
    
    setEditedPresentation(prev => {
      if (!prev) return null
      const newSlides = [...prev.slides]
      const [movedSlide] = newSlides.splice(fromIndex, 1)
      newSlides.splice(toIndex, 0, movedSlide)
      
      // Renumber slides
      newSlides.forEach((slide, index) => {
        slide.id = index + 1
      })
      
      return { ...prev, slides: newSlides }
    })
    setHasChanges(true)
  }

  const updateSlideContent = (slideIndex: number, contentIndex: number, value: string) => {
    setEditedPresentation(prev => {
      if (!prev) return null
      const newSlides = [...prev.slides]
      const newContent = [...newSlides[slideIndex].content]
      newContent[contentIndex] = value
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent }
      return { ...prev, slides: newSlides }
    })
    setHasChanges(true)
  }

  const addContentItem = (slideIndex: number) => {
    const currentSlide = editedPresentation.slides[slideIndex]
    
    // Generate contextual content suggestions based on slide title and existing content
    const generateContentSuggestion = (slide: EditableSlide) => {
      const title = slide.title.toLowerCase()
      const existingCount = slide.content.length
      
      // Content suggestions based on slide context
      if (title.includes('benefit') || title.includes('value')) {
        const suggestions = [
          'Measurable ROI within 6-12 months',
          'Reduced operational costs by 20-30%',
          'Enhanced user experience and satisfaction',
          'Scalable solution for future growth',
          'Competitive advantage in the market'
        ]
        return suggestions[existingCount % suggestions.length]
      }
      
      if (title.includes('strategy') || title.includes('plan')) {
        const suggestions = [
          'Comprehensive stakeholder alignment',
          'Risk assessment and mitigation plans', 
          'Resource allocation and timeline',
          'Success metrics and KPIs',
          'Change management approach'
        ]
        return suggestions[existingCount % suggestions.length]
      }
      
      if (title.includes('analysis') || title.includes('research')) {
        const suggestions = [
          'Data-driven insights and trends',
          'Comparative analysis and benchmarks',
          'Key findings and implications',
          'Recommendations for action',
          'Future outlook and projections'
        ]
        return suggestions[existingCount % suggestions.length]
      }
      
      if (title.includes('implementation') || title.includes('execution')) {
        const suggestions = [
          'Phase-based delivery approach',
          'Team structure and responsibilities',
          'Quality assurance checkpoints',
          'Communication and reporting protocols',
          'Success criteria and validation'
        ]
        return suggestions[existingCount % suggestions.length]
      }
      
      // Default professional suggestions
      const defaultSuggestions = [
        'Key strategic initiative and objectives',
        'Measurable outcomes and success metrics',
        'Stakeholder benefits and value creation',
        'Implementation timeline and milestones',
        'Next steps and action items'
      ]
      
      return defaultSuggestions[existingCount % defaultSuggestions.length]
    }
    
    const newContentSuggestion = generateContentSuggestion(currentSlide)
    
    setEditedPresentation(prev => {
      if (!prev) return null
      const newSlides = [...prev.slides]
      newSlides[slideIndex] = {
        ...newSlides[slideIndex],
        content: [...newSlides[slideIndex].content, newContentSuggestion]
      }
      return { ...prev, slides: newSlides }
    })
    setHasChanges(true)
    toast.success('Professional content point added')
  }

  const removeContentItem = (slideIndex: number, contentIndex: number) => {
    const currentSlide = editedPresentation.slides[slideIndex]
    
    if (currentSlide.content.length <= 1) {
      toast.error('Slide must have at least one content item')
      return
    }
    
    setEditedPresentation(prev => {
      if (!prev) return null
      const newSlides = [...prev.slides]
      const newContent = newSlides[slideIndex].content.filter((_, index) => index !== contentIndex)
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent }
      return { ...prev, slides: newSlides }
    })
    setHasChanges(true)
    toast.success('Content item removed')
  }

  const saveChanges = async () => {
    if (!editedPresentation || !presentation) return
    
    try {
      const updatedContent = {
        ...presentation.content,
        title: editedPresentation.title,
        description: editedPresentation.description,
        slides: editedPresentation.slides,
        metadata: {
          ...editedPresentation.metadata,
          updated_at: new Date().toISOString()
        }
      }
      
      await updatePresentation(presentation.id, {
        title: editedPresentation.title,
        description: editedPresentation.description,
        content: updatedContent
      })
      
      setHasChanges(false)
      toast.success('Presentation updated successfully!')
    } catch (error) {
      console.error('Failed to save changes:', error)
      toast.error('Failed to save changes. Please try again.')
    }
  }

  const handleBack = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave without saving?')) {
        navigate('/presentations')
      }
    } else {
      navigate('/presentations')
    }
  }

  // AI Enhancement Functions
  const getCurrentSlideContent = () => {
    if (!editedPresentation || currentSlideIndex >= editedPresentation.slides.length) {
      return ''
    }
    const slide = editedPresentation.slides[currentSlideIndex]
    return `Title: ${slide.title}\n\nContent:\n${slide.content.join('\n')}\n\nSpeaker Notes: ${slide.speaker_notes}`
  }

  const handleAnalyzeContent = async (type: 'content' | 'design') => {
    if (!presentation || !editedPresentation) return
    
    const slideId = editedPresentation.slides[currentSlideIndex]?.id.toString()
    const content = getCurrentSlideContent()
    
    if (content.trim()) {
      await analyzeContent(presentation.id, slideId, content, type)
    } else {
      toast.error('Please add content to the slide first')
    }
  }

  const handleGetTemplateRecommendations = async () => {
    if (!presentation || !editedPresentation) return
    
    const allContent = editedPresentation.slides.map(slide => 
      `${slide.title}\n${slide.content.join('\n')}`
    ).join('\n\n')
    
    if (allContent.trim()) {
      await getTemplateRecommendations(
        presentation.id, 
        allContent, 
        editedPresentation.title
      )
    } else {
      toast.error('Please add content to your presentation first')
    }
  }

  const extractCleanContent = (rawText: string, category: string): string => {
    // Extract clean content from AI responses that may contain explanatory text
    let cleanText = rawText.trim()
    
    if (category === 'headline' || category === 'title') {
      // Look for quoted text patterns
      const quotedMatch = cleanText.match(/['"](.*?)['"]/)
      if (quotedMatch && quotedMatch[1]) {
        return quotedMatch[1].trim()
      }
      
      // Remove common AI commentary phrases
      const commentaryPatterns = [
        /^(Keep the proposed title|Use the title|Consider the title|I suggest the title)\s*/i,
        /\s*as it (effectively|successfully|appropriately).*$/i,
        /\s*because it.*$/i,
        /\s*since it.*$/i,
        /\s*which (helps|ensures|provides).*$/i
      ]
      
      for (const pattern of commentaryPatterns) {
        cleanText = cleanText.replace(pattern, '')
      }
    }
    
    // Remove leading/trailing commentary for all categories
    cleanText = cleanText.replace(/^(I recommend|I suggest|Consider|Use|Apply)\s*/i, '')
    cleanText = cleanText.replace(/\s*\.$/, '') // Remove trailing period
    
    return cleanText.trim()
  }

  const handleApplySuggestion = (suggestionText: string, category: string) => {
    // Apply the suggestion to the current slide based on category
    if (!editedPresentation) {
      toast.error('No presentation loaded')
      return
    }
    
    const slideIndex = currentSlideIndex
    const currentSlide = editedPresentation.slides[slideIndex]
    
    if (!currentSlide) {
      toast.error('No slide selected')
      return
    }
    
    try {
      // Extract clean content from AI suggestion
      const cleanContent = extractCleanContent(suggestionText, category)
      
      if (category === 'headline' || category === 'title') {
        updateSlide(slideIndex, { title: cleanContent })
        toast.success('Title updated successfully')
      } else if (category === 'bullet_point' || category === 'content' || category === 'text') {
        // Add to content or replace first content item
        const newContent = [...currentSlide.content]
        if (newContent.length > 0 && (newContent[0] === 'Add your content here' || newContent[0] === 'New bullet point')) {
          newContent[0] = cleanContent
        } else {
          newContent.push(cleanContent)
        }
        updateSlide(slideIndex, { content: newContent })
        toast.success('Content updated successfully')
      } else if (category === 'speaker_notes' || category === 'notes') {
        updateSlide(slideIndex, { speaker_notes: cleanContent })
        toast.success('Speaker notes updated successfully')
      } else if (category === 'visual_suggestion' || category === 'visual') {
        updateSlide(slideIndex, { visual_suggestion: cleanContent })
        toast.success('Visual suggestion updated successfully')
      } else if (category === 'design' || category === 'layout') {
        // For design suggestions, we could update the layout or other design properties
        updateSlide(slideIndex, { layout: cleanContent as any })
        toast.success('Design updated successfully')
      } else {
        // Default: add as content
        const newContent = [...currentSlide.content, cleanContent]
        updateSlide(slideIndex, { content: newContent })
        toast.success('Suggestion applied successfully')
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
      toast.error('Failed to apply suggestion. Please try again.')
    }
  }

  return (
    <CollaborationProvider
      presentationId={presentation?.id || null}
      userTier="team" // This should come from user subscription data
    >
      <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Presentation</h1>
              <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Last modified: {new Date(presentation.updated_at).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {editedPresentation.slides.length} slides
                </span>
                {hasChanges && (
                  <span className="text-amber-400 font-medium">• Unsaved changes</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Collaboration Status and Presence */}
            <CollaborationStatusBadge presentationId={presentation.id} />
            <PresenceIndicator presentationId={presentation.id} />
            
            {/* Collaboration Toolbar */}
            <CollaborationToolbar 
              presentationId={presentation.id}
              onOpenSidebar={() => setShowCollaborationSidebar(true)}
              className=""
            />
            
            <AIQuickActions 
              presentationId={presentation.id}
              currentSlideId={editedPresentation.slides[currentSlideIndex]?.id.toString()}
              currentContent={getCurrentSlideContent()}
              onAnalyzeContent={handleAnalyzeContent}
              onGetTemplates={handleGetTemplateRecommendations}
              onOpenAssistant={() => setShowAISidebar(true)}
              loading={loadingAnalysis || loadingTemplates}
            />
            
            <button
              onClick={() => setShowCollaborationSidebar(true)}
              className="flex items-center px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors relative"
            >
              <Users className="h-4 w-4 mr-2" />
              Collaborate
              {comments.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {comments.filter(c => !c.is_resolved).length}
                </div>
              )}
            </button>
            
            <Link
              to={`/presentations/${presentation.id}/view`}
              className="flex items-center px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
            
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saving}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Presentation Details */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Presentation Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input
                type="text"
                value={editedPresentation.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Presentation title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={editedPresentation.description}
                onChange={(e) => updateDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                placeholder="Brief description of your presentation"
              />
            </div>
          </div>
        </div>

        {/* Slides */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Slides</h2>
            <button
              onClick={addSlide}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Professional Slide
            </button>
          </div>
          
          {editedPresentation.slides.map((slide, slideIndex) => (
            <div 
              key={slide.id} 
              className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border transition-all duration-200 overflow-hidden ${
                slideIndex === currentSlideIndex 
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : 'border-slate-700/50'
              }`}
              onClick={() => setCurrentSlideIndex(slideIndex)}
            >
              {/* Slide Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {slide.id}
                  </div>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => updateSlide(slideIndex, { title: e.target.value })}
                    className="text-xl font-semibold bg-slate-700/20 text-white border border-slate-600/50 hover:border-cyan-400/50 focus:border-cyan-400 rounded-lg px-3 py-2 min-w-0 flex-1 transition-colors duration-200"
                    placeholder="Slide title (Click to edit)"
                    title="Click to edit slide title"
                  />
                  <select
                    value={slide.layout}
                    onChange={(e) => updateSlide(slideIndex, { layout: e.target.value as any })}
                    className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="title_and_bullets">Title & Bullets</option>
                    <option value="title_only">Title Only</option>
                    <option value="image_focus">Image Focus</option>
                    <option value="comparison">Comparison</option>
                    <option value="conclusion">Conclusion</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveSlide(slideIndex, slideIndex - 1)}
                    disabled={slideIndex === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveSlide(slideIndex, slideIndex + 1)}
                    disabled={slideIndex === editedPresentation.slides.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSlide(slideIndex)}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Delete slide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Slide Content - Split View */}
              <div className="grid lg:grid-cols-2 gap-6 p-6">
                {/* Live Preview with Collaboration */}
                <CollaborativeSlide
                  slideId={slide.id.toString()}
                  className="bg-white rounded-lg shadow-sm border border-slate-300 aspect-video"
                >
                  <SlideRenderer
                    slide={slide}
                    className="w-full h-full rounded-lg"
                    renderMode="view"
                  />
                  
                  {/* Comment indicators for this slide */}
                  {comments
                    .filter(comment => comment.slide_id === slide.id.toString() && !comment.is_resolved)
                    .map(comment => (
                      <div
                        key={comment.id}
                        className="absolute bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-600 transition-colors"
                        style={{
                          left: comment.position?.x || 0,
                          top: comment.position?.y || 0,
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={`${comment.user?.full_name || comment.user?.email}: ${comment.content}`}
                        onClick={() => setShowCollaborationSidebar(true)}
                      >
                        <MessageCircle className="h-3 w-3" />
                      </div>
                    ))
                  }
                </CollaborativeSlide>
                
                {/* Edit Controls */}
                <div className="space-y-4">
                  {/* Content Points */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-300">Content Points</label>
                      <button
                        onClick={() => addContentItem(slideIndex)}
                        className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 bg-slate-700/50 px-2 py-1 rounded"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Point
                      </button>
                    </div>
                    <div className="space-y-2">
                      {slide.content.map((item, contentIndex) => (
                        <div key={contentIndex} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-3 flex-shrink-0" />
                          <div className="flex-1">
                            <RichTextEditor
                              value={item}
                              onChange={(value) => updateSlideContent(slideIndex, contentIndex, value)}
                              placeholder="Enter professional content point..."
                              maxHeight="120px"
                            />
                          </div>
                          <button
                            onClick={() => removeContentItem(slideIndex, contentIndex)}
                            className="p-1 text-red-400 hover:text-red-300 mt-1"
                            title="Remove point"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Visual Suggestion */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Visual Suggestion</label>
                    <RichTextEditor
                      value={slide.visual_suggestion}
                      onChange={(value) => updateSlide(slideIndex, { visual_suggestion: value })}
                      placeholder="Describe visual elements and design suggestions for this slide..."
                      maxHeight="100px"
                    />
                  </div>
                  
                  {/* Speaker Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Speaker Notes</label>
                    <RichTextEditor
                      value={slide.speaker_notes}
                      onChange={(value) => updateSlide(slideIndex, { speaker_notes: value })}
                      placeholder="Add detailed presenter notes, talking points, and delivery guidance..."
                      maxHeight="150px"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Assistant Sidebar */}
      <AIAssistantSidebar 
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        presentationId={presentation.id}
        currentSlideId={editedPresentation.slides[currentSlideIndex]?.id.toString()}
        currentContent={getCurrentSlideContent()}
        onApplySuggestion={handleApplySuggestion}
      />
      
      {/* Collaboration Sidebar */}
      <CollaborationSidebar 
        isOpen={showCollaborationSidebar}
        onClose={() => setShowCollaborationSidebar(false)}
        presentationId={presentation.id}
      />
    </div>
    </CollaborationProvider>
  )
}
