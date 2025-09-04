import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, Palette, FileText, Volume2, X, ChevronDown, ChevronUp, Check, AlertCircle, Sparkles, Wand2 } from 'lucide-react';
import { useAIEnhancement } from '../contexts/AIEnhancementContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  presentationId: string;
  currentSlideId?: string;
  currentContent?: string;
  onApplySuggestion?: (suggestionText: string, category: string) => void;
}

export function AIAssistantSidebar({ 
  isOpen, 
  onClose, 
  presentationId, 
  currentSlideId, 
  currentContent = '',
  onApplySuggestion 
}: AIAssistantSidebarProps) {
  const {
    suggestions,
    currentAnalysis,
    loadingAnalysis,
    templateRecommendations,
    loadingTemplates,
    analyzeContent,
    getTemplateRecommendations,
    applySuggestion,
    dismissSuggestion,
    refreshSuggestions
  } = useAIEnhancement();

  const [activeTab, setActiveTab] = useState<'suggestions' | 'analysis' | 'templates' | 'voice'>('suggestions');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content', 'design']));

  useEffect(() => {
    if (isOpen && presentationId) {
      refreshSuggestions(presentationId);
    }
  }, [isOpen, presentationId]);

  const handleAnalyzeContent = async (type: 'content' | 'design') => {
    if (currentContent && currentSlideId) {
      await analyzeContent(presentationId, currentSlideId, currentContent, type);
    }
  };

  const handleGetTemplates = async () => {
    if (currentContent) {
      await getTemplateRecommendations(presentationId, currentContent);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleApplySuggestion = async (suggestion: any) => {
    try {
      // First call the parent callback to actually update the content
      if (onApplySuggestion) {
        onApplySuggestion(suggestion.text, suggestion.category);
      }
      
      // Then mark the suggestion as applied in local state
      await applySuggestion(suggestion.id);
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  };

  const activeSuggestions = suggestions.filter(s => !s.dismissed && !s.applied);
  const contentSuggestions = activeSuggestions.filter(s => s.type === 'content');
  const designSuggestions = activeSuggestions.filter(s => s.type === 'design');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="fixed top-0 right-0 h-full w-96 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <h2 className="font-semibold text-lg">AI Assistant</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
              { id: 'analysis', label: 'Analysis', icon: FileText },
              { id: 'templates', label: 'Templates', icon: Palette },
              { id: 'voice', label: 'Voice', icon: Volume2 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-3 px-2 text-xs font-medium flex items-center justify-center space-x-1 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'suggestions' && (
              <div className="space-y-4">
                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Wand2 className="h-4 w-4 mr-2 text-purple-600" />
                    Quick Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAnalyzeContent('content')}
                      disabled={loadingAnalysis || !currentContent}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-white border border-purple-200 text-purple-700 rounded-md hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Analyze Content</span>
                    </button>
                    <button
                      onClick={() => handleAnalyzeContent('design')}
                      disabled={loadingAnalysis || !currentContent}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                    >
                      <Palette className="h-3 w-3" />
                      <span>Analyze Design</span>
                    </button>
                  </div>
                </div>

                {/* Content Suggestions */}
                {contentSuggestions.length > 0 && (
                  <div className="border border-green-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('content')}
                      className="w-full p-3 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-900">Content Suggestions</span>
                        <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                          {contentSuggestions.length}
                        </span>
                      </div>
                      {expandedSections.has('content') ? 
                        <ChevronUp className="h-4 w-4 text-green-600" /> : 
                        <ChevronDown className="h-4 w-4 text-green-600" />
                      }
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections.has('content') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 space-y-3">
                            {contentSuggestions.map(suggestion => (
                              <div key={suggestion.id} className="bg-white border border-gray-200 rounded-md p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                                    {suggestion.category}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <div className="flex items-center space-x-1">
                                      {Array.from({ length: suggestion.priority }).map((_, i) => (
                                        <div key={i} className="w-2 h-2 bg-green-400 rounded-full" />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-900 mb-2">{suggestion.text}</p>
                                <p className="text-xs text-gray-600 mb-3">{suggestion.reason}</p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApplySuggestion(suggestion)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Apply</span>
                                  </button>
                                  <button
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                    className="px-3 py-1.5 text-gray-600 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Design Suggestions */}
                {designSuggestions.length > 0 && (
                  <div className="border border-blue-200 rounded-lg">
                    <button
                      onClick={() => toggleSection('design')}
                      className="w-full p-3 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Palette className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Design Suggestions</span>
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {designSuggestions.length}
                        </span>
                      </div>
                      {expandedSections.has('design') ? 
                        <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                        <ChevronDown className="h-4 w-4 text-blue-600" />
                      }
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections.has('design') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 space-y-3">
                            {designSuggestions.map(suggestion => (
                              <div key={suggestion.id} className="bg-white border border-gray-200 rounded-md p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                    {suggestion.category}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    {Array.from({ length: suggestion.priority }).map((_, i) => (
                                      <div key={i} className="w-2 h-2 bg-blue-400 rounded-full" />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-900 mb-2">{suggestion.text}</p>
                                <p className="text-xs text-gray-600 mb-3">{suggestion.reason}</p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApplySuggestion(suggestion)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Apply</span>
                                  </button>
                                  <button
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                    className="px-3 py-1.5 text-gray-600 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* No Suggestions State */}
                {activeSuggestions.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-4">No AI suggestions available yet.</p>
                    <p className="text-gray-500 text-xs">Add content to your presentation and use the Quick Analysis buttons above to get AI-powered suggestions.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-4">
                {currentAnalysis ? (
                  <div className="space-y-4">
                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 text-sm mb-1">Clarity Score</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {currentAnalysis.clarity_score}/10
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 text-sm mb-1">Engagement Score</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {currentAnalysis.engagement_score}/10
                        </div>
                      </div>
                    </div>

                    {/* Strengths */}
                    {currentAnalysis.strengths && currentAnalysis.strengths.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-2 flex items-center">
                          <Check className="h-4 w-4 mr-2" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {currentAnalysis.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-green-800 flex items-start">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {currentAnalysis.improvements && currentAnalysis.improvements.length > 0 && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h4 className="font-medium text-amber-900 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {currentAnalysis.improvements.map((improvement, index) => (
                            <li key={index} className="text-sm text-amber-800 flex items-start">
                              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-4">No analysis available yet.</p>
                    <button
                      onClick={() => handleAnalyzeContent('content')}
                      disabled={loadingAnalysis || !currentContent}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Brain className="h-4 w-4" />
                      <span>Analyze Content</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-4">
                {templateRecommendations.length > 0 ? (
                  <div className="space-y-3">
                    {templateRecommendations.map((recommendation, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                            recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {recommendation.priority} priority
                          </span>
                          <div className="text-lg font-bold text-purple-600">
                            {recommendation.match_score}%
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">Why this template:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {recommendation.reasons.map((reason, idx) => (
                              <li key={idx} className="flex items-start">
                                <Sparkles className="h-3 w-3 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {recommendation.style_adjustments && recommendation.style_adjustments.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">Suggested adjustments:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {recommendation.style_adjustments.map((adjustment, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {adjustment}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <button className="w-full py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                          Apply Template
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Palette className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm mb-4">No template recommendations available.</p>
                    <button
                      onClick={handleGetTemplates}
                      disabled={loadingTemplates || !currentContent}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Palette className="h-4 w-4" />
                      <span>Get Recommendations</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                {/* Professional Coming Soon Section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <div className="text-center">
                    <Volume2 className="h-16 w-16 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      AI Voice Narration
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Transform your presentations with professional AI-generated voice narration.
                    </p>
                    
                    <div className="bg-white p-4 rounded-md border border-purple-100 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Coming Soon Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1 text-left">
                        <li className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                          Multiple professional voice options
                        </li>
                        <li className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                          Customizable speech speed and tone
                        </li>
                        <li className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                          Audio synchronization with slides
                        </li>
                        <li className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                          Download audio files for offline use
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-md text-sm font-medium">
                      Feature in development - Stay tuned for updates
                    </div>
                  </div>
                </div>
                
                {/* Notification Option */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">Get Notified</h4>
                      <p className="text-sm text-gray-600">
                        Be the first to know when voice narration becomes available.
                      </p>
                    </div>
                    <button 
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                      onClick={() => {
                        // For now, just show a toast message
                        // In the future, this could trigger an email signup
                        console.log('User interested in voice narration feature');
                      }}
                    >
                      Notify Me
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}