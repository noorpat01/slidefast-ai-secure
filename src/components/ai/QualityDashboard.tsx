import React, { useState, useEffect } from 'react'
import { useAIStore } from '../../store/ai'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  TrendingUp,
  Users,
  FileText,
  Lightbulb,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap
} from 'lucide-react'

interface QualityDashboardProps {
  content?: string
  autoAnalyze?: boolean
  className?: string
}

export function QualityDashboard({ content, autoAnalyze = false, className }: QualityDashboardProps) {
  const {
    qualityScore,
    qualityLoading,
    analyzeContent,
    liveAnalysis,
    setLiveAnalysis,
    settings,
    analysisHistory
  } = useAIStore()

  const [localContent, setLocalContent] = useState(content || '')

  // Auto-analyze when content changes (if live analysis is enabled)
  useEffect(() => {
    if (liveAnalysis && localContent && localContent.length > 50) {
      const debounceTimer = setTimeout(() => {
        analyzeContent(localContent)
      }, 1000) // 1 second debounce

      return () => clearTimeout(debounceTimer)
    }
  }, [localContent, liveAnalysis, analyzeContent])

  const handleAnalyze = async () => {
    if (!localContent.trim()) {
      return
    }
    await analyzeContent(localContent)
  }

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600'
    if (score >= 7.0) return 'text-blue-600'
    if (score >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8.5) return 'success'
    if (score >= 7.0) return 'default'
    if (score >= 5.0) return 'warning'
    return 'destructive'
  }

  const dimensionIcons = {
    accuracy: Target,
    readability: FileText,
    engagement: Users,
    structure: FileText,
    originality: Lightbulb,
    professional_impact: TrendingUp
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">AI Quality Assessment</h2>
          <p className="text-muted-foreground">
            Real-time content analysis with 6-dimensional scoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant={liveAnalysis ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLiveAnalysis(!liveAnalysis)}
            className="relative"
          >
            <Zap className="h-4 w-4 mr-2" />
            Live Analysis
            {liveAnalysis && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </Button>
          
          <Button
            onClick={handleAnalyze}
            disabled={qualityLoading || !localContent.trim()}
            size="sm"
          >
            {qualityLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Analyze Now
          </Button>
        </div>
      </div>

      {/* Content Input */}
      <Card>
        <CardHeader>
          <CardTitle>Content to Analyze</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            placeholder="Paste your presentation content here for AI quality analysis..."
            className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
            <span>{localContent.length} characters</span>
            {liveAnalysis && (
              <Badge variant="outline" className="text-xs">
                Live analysis enabled
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {qualityLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium">Analyzing content quality...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Score Results */}
      <AnimatePresence>
        {qualityScore && !qualityLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Overall Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className={`text-4xl font-bold ${getScoreColor(qualityScore.overall_score)}`}>
                      {qualityScore.overall_score.toFixed(1)}/10
                    </div>
                    <Badge variant={getScoreBadgeVariant(qualityScore.overall_score)}>
                      {qualityScore.overall_score >= 8.5 ? 'Excellent' :
                       qualityScore.overall_score >= 7.0 ? 'Good' :
                       qualityScore.overall_score >= 5.0 ? 'Fair' : 'Needs Improvement'}
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">Confidence</div>
                    <div className="text-lg font-semibold">
                      {((qualityScore.confidence_score || 0.8) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <Progress value={qualityScore.overall_score * 10} className="h-2" />
              </CardContent>
            </Card>

            {/* Dimension Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(qualityScore.dimensions).map(([key, dimension]) => {
                const Icon = dimensionIcons[key as keyof typeof dimensionIcons] || FileText
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * Object.keys(qualityScore.dimensions).indexOf(key) }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4" />
                          {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                            {dimension.score.toFixed(1)}
                          </span>
                          <Badge variant={getScoreBadgeVariant(dimension.score)} className="text-xs">
                            {dimension.score >= 8.5 ? 'Excellent' :
                             dimension.score >= 7.0 ? 'Good' :
                             dimension.score >= 5.0 ? 'Fair' : 'Poor'}
                          </Badge>
                        </div>
                        <Progress value={dimension.score * 10} className="h-1.5" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {dimension.feedback}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            {/* Recommendations */}
            {qualityScore.priority_recommendations && qualityScore.priority_recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Priority Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qualityScore.priority_recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="border-l-4 border-blue-500 pl-4 py-2"
                      >
                        <div className="flex items-start gap-3">
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 
                                   rec.priority === 'medium' ? 'warning' : 'secondary'}
                            className="mt-0.5"
                          >
                            {rec.priority}
                          </Badge>
                          <div className="space-y-1 flex-1">
                            <p className="font-medium">{rec.recommendation}</p>
                            <p className="text-sm text-muted-foreground">{rec.impact}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths and Areas for Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {qualityScore.strengths.map((strength, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {strength}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <TrendingUp className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {qualityScore.areas_for_improvement.map((area, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <TrendingUp className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {area}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisHistory.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={getScoreBadgeVariant(entry.score)}>
                    {entry.score.toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}