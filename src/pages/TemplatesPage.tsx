import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Eye, Star } from 'lucide-react'

export const TemplatesPage: React.FC = () => {
  const templates = [
    { id: 1, name: 'Business Pitch', category: 'Business', rating: 4.8, downloads: 1234 },
    { id: 2, name: 'Educational Slides', category: 'Education', rating: 4.9, downloads: 2341 },
    { id: 3, name: 'Project Report', category: 'Professional', rating: 4.7, downloads: 987 },
    { id: 4, name: 'Marketing Plan', category: 'Marketing', rating: 4.8, downloads: 1567 },
    { id: 5, name: 'Research Findings', category: 'Academic', rating: 4.6, downloads: 756 },
    { id: 6, name: 'Product Launch', category: 'Business', rating: 4.9, downloads: 2103 }
  ]

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
            <FileText className="mr-3 h-8 w-8 text-cyan-400" />
            Presentation Templates
          </h1>
          <p className="text-slate-300">Choose from professionally designed templates to jumpstart your presentation</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
            All Categories
          </button>
          <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            Business
          </button>
          <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            Education
          </button>
          <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            Marketing
          </button>
          <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
            Academic
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              {/* Template Preview */}
              <div className="h-40 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <FileText className="h-16 w-16 text-cyan-400" />
              </div>
              
              {/* Template Info */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-300 mb-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    {template.rating}
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {template.downloads}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-2 px-3 rounded-lg hover:opacity-90 transition-opacity text-sm">
                    Use Template
                  </button>
                  <button className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}