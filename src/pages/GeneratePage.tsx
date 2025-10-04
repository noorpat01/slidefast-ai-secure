import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles, FileText, Image, Wand2 } from 'lucide-react'

export const GeneratePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Plus className="mr-3 h-8 w-8 text-cyan-400" />
            Generate New Presentation
          </h1>
          <p className="text-slate-300">Create amazing presentations with AI-powered assistance</p>
        </div>

        {/* Generation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Text-based Generation */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-cyan-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">From Text</h3>
            </div>
            <p className="text-slate-300 mb-4">Describe your presentation topic and let AI create slides for you</p>
            <button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              Start with Text
            </button>
          </motion.div>

          {/* Image-based Generation */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center mb-4">
              <Image className="h-8 w-8 text-purple-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">From Images</h3>
            </div>
            <p className="text-slate-300 mb-4">Upload images and let AI generate presentation content around them</p>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              Upload Images
            </button>
          </motion.div>

          {/* AI Assistant */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center mb-4">
              <Wand2 className="h-8 w-8 text-yellow-400 mr-3" />
              <h3 className="text-xl font-semibold text-white">AI Assistant</h3>
            </div>
            <p className="text-slate-300 mb-4">Chat with AI to brainstorm and create your presentation interactively</p>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
              Start Chat
            </button>
          </motion.div>
        </div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
        >
          <div className="flex items-center mb-4">
            <Sparkles className="h-6 w-6 text-cyan-400 mr-2" />
            <h3 className="text-xl font-semibold text-white">Quick Start Ideas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Business Pitch</h4>
              <p className="text-sm text-slate-300">Create compelling business presentations</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Educational Content</h4>
              <p className="text-sm text-slate-300">Design engaging learning materials</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Project Reports</h4>
              <p className="text-sm text-slate-300">Professional project summaries</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}