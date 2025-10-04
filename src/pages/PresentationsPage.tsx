import React from 'react'
import { motion } from 'framer-motion'
import { Presentation, MoreVertical, Share, Edit, Trash2, Calendar } from 'lucide-react'

export const PresentationsPage: React.FC = () => {
  const presentations = [
    { id: 1, title: 'Q4 Business Review', lastModified: '2 days ago', status: 'Published' },
    { id: 2, title: 'Product Launch Strategy', lastModified: '1 week ago', status: 'Draft' },
    { id: 3, title: 'Marketing Campaign Results', lastModified: '2 weeks ago', status: 'Published' },
    { id: 4, title: 'Team Training Materials', lastModified: '3 weeks ago', status: 'Draft' },
    { id: 5, title: 'Annual Company Meeting', lastModified: '1 month ago', status: 'Published' }
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Presentation className="mr-3 h-8 w-8 text-cyan-400" />
              My Presentations
            </h1>
            <p className="text-slate-300">Manage and organize all your presentations</p>
          </div>
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            New Presentation
          </button>
        </div>

        {/* Filter and Sort */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <select className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500">
            <option>All Presentations</option>
            <option>Published</option>
            <option>Drafts</option>
          </select>
          <select className="bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-500">
            <option>Sort by: Last Modified</option>
            <option>Sort by: Name</option>
            <option>Sort by: Created Date</option>
          </select>
        </div>

        {/* Presentations List */}
        <div className="space-y-4">
          {presentations.map((presentation) => (
            <motion.div
              key={presentation.id}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <Presentation className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{presentation.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-300">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {presentation.lastModified}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        presentation.status === 'Published' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {presentation.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                    <Share className="h-4 w-4" />
                  </button>
                  <button className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
                    <MoreVertical className="h-4 w-4" />
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