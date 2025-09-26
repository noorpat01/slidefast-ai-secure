import React, { useState } from 'react'
import { useAIStore } from '../../store/ai'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Slider } from '../ui/slider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2,
  Settings,
  Target,
  Users,
  BookOpen,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Copy,
  Download,
  Star,
  BarChart3,
  Clock,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContentGeneratorProps {
  onContentGenerated?: (content: any) => void
  className?: string
}

type ResearchDepth = 'basic' | 'standard' | 'comprehensive' | 'expert'
type Audience = 'beginner' | 'intermediate' | 'expert' | 'phd'
type Tone = 'professional' | 'casual' | 'academic' | 'creative'
type ContentType = 'slide' | 'section' | 'introduction' | 'conclusion' | 'executive_summary'
type Style = 'professional' | 'creative' | 'technical' | 'storytelling'
type Length = 'short' | 'medium' | 'long' | 'detailed'

export function ContentGenerator({ onContentGenerated, className }: ContentGeneratorProps) {
  const {
    generatedContent,
    contentGenerating,
    generateContent,
    settings,
    updateSettings,
    clearGeneratedContent
  } = useAIStore()

  const [formData, setFormData] = useState({
    topic: '',
    contentType: 'slide' as ContentType,
    style: 'professional' as Style,
    audience: settings.audience,
    length: 'medium' as Length,
    researchDepth: settings.researchDepth,
    includeData: true,
    tone: settings.tone,
    industry: ''
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic to generate content')
      return
    }

    const result = await generateContent(formData)
    if (result && onContentGenerated) {
      onContentGenerated(result)
    }
  }

  const handleCopyContent = () => {
    if (generatedContent?.content?.main_content) {
      navigator.clipboard.writeText(generatedContent.content.main_content)
      toast.success('Content copied to clipboard')
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600'
    if (score >= 7.0) return 'text-blue-600'
    if (score >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">AI Content Generator</h2>
        <p className="text-muted-foreground">
          Research-enhanced content creation with industry insights
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Content Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Digital Transformation in Healthcare"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select
                value={formData.contentType}
                onValueChange={(value: ContentType) => setFormData({ ...formData, contentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Presentation Slide</SelectItem>
                  <SelectItem value="section">Section Content</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="conclusion">Conclusion</SelectItem>
                  <SelectItem value="executive_summary">Executive Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={formData.audience}
                onValueChange={(value: Audience) => setFormData({ ...formData, audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="phd">PhD/Academic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={formData.tone}
                onValueChange={(value: Tone) => setFormData({ ...formData, tone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 border-t pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Research Depth</Label>
                    <Select
                      value={formData.researchDepth}
                      onValueChange={(value: ResearchDepth) => setFormData({ ...formData, researchDepth: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (1-2 data points)</SelectItem>
                        <SelectItem value="standard">Standard (3-5 insights)</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive (Extensive research)</SelectItem>
                        <SelectItem value="expert">Expert (Academic depth)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Content Length</Label>
                    <Select
                      value={formData.length}
                      onValueChange={(value: Length) => setFormData({ ...formData, length: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (150-250 words)</SelectItem>
                        <SelectItem value="medium">Medium (300-500 words)</SelectItem>
                        <SelectItem value="long">Long (600-1000 words)</SelectItem>
                        <SelectItem value="detailed">Detailed (1000+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry Focus (Optional)</Label>
                    <Input
                      placeholder="e.g., Healthcare, Finance, Technology"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Style</Label>
                    <Select
                      value={formData.style}
                      onValueChange={(value: Style) => setFormData({ ...formData, style: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeData"
                    checked={formData.includeData}
                    onChange={(e) => setFormData({ ...formData, includeData: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="includeData">Include supporting data and statistics</Label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={contentGenerating || !formData.topic.trim()}
            className="w-full"
            size="lg"
          >
            {contentGenerating ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5 mr-2" />
            )}
            {contentGenerating ? 'Generating Content...' : 'Generate Content'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content Results */}
      <AnimatePresence>
        {generatedContent && !contentGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Content Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Generated Content
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyContent}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearGeneratedContent}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{generatedContent.content.title}</h3>
                    <div className="prose max-w-none text-sm">
                      {generatedContent.content.main_content}
                    </div>
                  </div>

                  {generatedContent.content.key_points && generatedContent.content.key_points.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Key Points
                      </h4>
                      <ul className="space-y-1">
                        {generatedContent.content.key_points.map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedContent.content.call_to_action && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold mb-1 text-blue-900">Call to Action</h4>
                      <p className="text-sm text-blue-800">{generatedContent.content.call_to_action}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quality Indicators */}
            {generatedContent.quality_indicators && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Quality Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center space-y-1">
                      <div className={`text-2xl font-bold ${getQualityColor(generatedContent.quality_indicators.research_depth_score)}`}>
                        {generatedContent.quality_indicators.research_depth_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Research Depth</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className={`text-2xl font-bold ${getQualityColor(generatedContent.quality_indicators.factual_accuracy_confidence * 10)}`}>
                        {(generatedContent.quality_indicators.factual_accuracy_confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className={`text-2xl font-bold ${getQualityColor(generatedContent.quality_indicators.audience_alignment_score)}`}>
                        {generatedContent.quality_indicators.audience_alignment_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Audience Fit</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className={`text-2xl font-bold ${getQualityColor(generatedContent.quality_indicators.actionability_score)}`}>
                        {generatedContent.quality_indicators.actionability_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Actionability</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supporting Data */}
            {generatedContent.content.supporting_data && generatedContent.content.supporting_data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Supporting Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedContent.content.supporting_data.map((data, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="font-medium text-sm">{data.statistic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Source: {data.source} • {data.relevance}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {generatedContent.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    Content Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Word Count</div>
                      <div className="text-muted-foreground">{generatedContent.metadata.word_count}</div>
                    </div>
                    <div>
                      <div className="font-medium">Reading Time</div>
                      <div className="text-muted-foreground">{generatedContent.metadata.reading_time_minutes} min</div>
                    </div>
                    <div>
                      <div className="font-medium">Complexity</div>
                      <div className="text-muted-foreground capitalize">{generatedContent.metadata.complexity_level}</div>
                    </div>
                    <div>
                      <div className="font-medium">Sources</div>
                      <div className="text-muted-foreground">{generatedContent.metadata.sources_referenced}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}