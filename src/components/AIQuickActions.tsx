import React, { useState } from 'react';
import { Wand2, Brain, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIQuickActionsProps {
  presentationId: string;
  currentSlideId?: string;
  currentContent?: string;
  onAnalyzeContent: (type: 'content' | 'design') => void;
  onGetTemplates: () => void;
  onOpenAssistant: () => void;
  loading?: boolean;
}

export function AIQuickActions({ 
  presentationId,
  currentSlideId,
  currentContent,
  onAnalyzeContent,
  onGetTemplates,
  onOpenAssistant,
  loading = false
}: AIQuickActionsProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const hasContent = currentContent && currentContent.trim().length > 0;

  return (
    <div className="relative">
      {/* Main AI Button */}
      <button
        onClick={() => setShowQuickMenu(!showQuickMenu)}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl group"
        title="AI Assistant"
      >
        <Brain className={`h-4 w-4 ${loading ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
        <span className="font-medium">AI Assistant</span>
        {loading && (
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
        )}
      </button>

      {/* Quick Actions Menu */}
      {showQuickMenu && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Wand2 className="h-4 w-4 mr-2 text-purple-600" />
                Quick AI Actions
              </h3>
              <button
                onClick={() => setShowQuickMenu(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onAnalyzeContent('content');
                  setShowQuickMenu(false);
                }}
                disabled={!hasContent || loading}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 border border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Sparkles className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">Improve Content</div>
                  <div className="text-xs text-gray-600">Get writing suggestions</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onAnalyzeContent('design');
                  setShowQuickMenu(false);
                }}
                disabled={!hasContent || loading}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Wand2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">Design Help</div>
                  <div className="text-xs text-gray-600">Optimize visual design</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onGetTemplates();
                  setShowQuickMenu(false);
                }}
                disabled={!hasContent || loading}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 border border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Brain className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 text-sm">Find Templates</div>
                  <div className="text-xs text-gray-600">Smart template matching</div>
                </div>
              </button>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => {
                    onOpenAssistant();
                    setShowQuickMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 text-sm">Full AI Assistant</div>
                    <div className="text-xs text-gray-600">Open complete AI panel</div>
                  </div>
                </button>
              </div>
            </div>

            {!hasContent && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  Add content to your slide to unlock AI features
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}