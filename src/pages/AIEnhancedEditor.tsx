import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAIStore } from '../store/ai'
import { useAuthStore } from '../store/auth'
import { QualityDashboard } from '../components/ai/QualityDashboard'
import { ContentGenerator } from '../components/ai/ContentGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  BookOpen,
  Star
} from 'lucide-react'
import { Toaster } from 'react-hot-toast'

export function AIEnhancedEditor() {
  const { user, usageStats, loading } = useAuthStore()
  const { settings, liveAnalysis, analysisHistory } = useAIStore()
  const [activeTab, setActiveTab] = useState<'quality' | 'generator' | 'insights'>('quality')
  const [editorContent, setEditorContent] = useState('')

  // Simulate real-time content analysis
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    readability: 7.8,
    engagement: 6.5,
    professionalism: 8.2,
    coherence: 7.1
  })

  useEffect(() => {
    // Simulate real-time metric updates
    const interval = setInterval(() => {
      if (liveAnalysis && editorContent.length > 50) {
        setRealtimeMetrics({
          readability: Math.max(5, Math.min(10, 7.8 + (Math.random() - 0.5) * 0.4)),
          engagement: Math.max(5, Math.min(10, 6.5 + (Math.random() - 0.5) * 0.6)),
          professionalism: Math.max(5, Math.min(10, 8.2 + (Math.random() - 0.5) * 0.3)),
          coherence: Math.max(5, Math.min(10, 7.1 + (Math.random() - 0.5) * 0.5))
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [liveAnalysis, editorContent])

  const getMetricColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 7) return 'text-blue-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium">Loading AI-Enhanced Editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AI Presentation Studio</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Enhanced AI Platform
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {usageStats && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">
                    {usageStats.presentations_created}/{usageStats.monthly_limit}
                  </span>
                  <span className="ml-1">presentations</span>
                </div>
              )}
              <Badge variant={user ? 'default' : 'outline'}>
                {user ? user.email : 'Guest'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - AI Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real-time Metrics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Live AI Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Readability</span>
                    <span className={`text-sm font-bold ${getMetricColor(realtimeMetrics.readability)}`}>
                      {realtimeMetrics.readability.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={realtimeMetrics.readability * 10} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className={`text-sm font-bold ${getMetricColor(realtimeMetrics.engagement)}`}>
                      {realtimeMetrics.engagement.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={realtimeMetrics.engagement * 10} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Professional</span>
                    <span className={`text-sm font-bold ${getMetricColor(realtimeMetrics.professionalism)}`}>
                      {realtimeMetrics.professionalism.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={realtimeMetrics.professionalism * 10} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Coherence</span>
                    <span className={`text-sm font-bold ${getMetricColor(realtimeMetrics.coherence)}`}>
                      {realtimeMetrics.coherence.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={realtimeMetrics.coherence * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* AI Settings Quick Access */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  AI Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Research Depth:</span>
                    <Badge variant="outline" className="text-xs">
                      {settings.researchDepth}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Audience:</span>
                    <Badge variant="outline" className="text-xs">
                      {settings.audience}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tone:</span>
                    <Badge variant="outline" className="text-xs">
                      {settings.tone}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto Suggestions:</span>
                    <Badge variant={settings.autoSuggestions ? 'success' : 'secondary'} className="text-xs">
                      {settings.autoSuggestions ? 'On' : 'Off'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analyses Run:</span>
                    <span className="font-medium">{analysisHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Content Length:</span>
                    <span className="font-medium">{editorContent.length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Live Analysis:</span>
                    <Badge variant={liveAnalysis ? 'success' : 'secondary'} className="text-xs">
                      {liveAnalysis ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('quality')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'quality'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="h-4 w-4" />
                <span>Quality Analysis</span>
              </button>
              
              <button
                onClick={() => setActiveTab('generator')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'generator'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Content Generator</span>
              </button>
              
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'insights'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                <span>AI Insights</span>
              </button>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'quality' && (
                <QualityDashboard 
                  content={editorContent}
                  autoAnalyze={true}
                  className="bg-white rounded-lg p-6 shadow-sm"
                />
              )}
              
              {activeTab === 'generator' && (
                <ContentGenerator 
                  onContentGenerated={(content) => {
                    if (content?.content?.main_content) {
                      setEditorContent(content.content.main_content)
                    }
                  }}
                  className="bg-white rounded-lg p-6 shadow-sm"
                />
              )}
              
              {activeTab === 'insights' && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <Lightbulb className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Insights Dashboard</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Advanced AI insights and recommendations will appear here as you work on your presentation.
                      </p>
                      <Button className="mt-4" variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}