import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, FileText, Users, Plus, Eye } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const recentPresentations = [
    { id: 1, title: 'Q4 Business Review', lastModified: '2 hours ago', views: 24 },
    { id: 2, title: 'Product Launch Strategy', lastModified: '1 day ago', views: 12 },
    { id: 3, title: 'Marketing Campaign Results', lastModified: '3 days ago', views: 18 }
  ]

  const stats = [
    { label: 'Total Presentations', value: '24', icon: FileText, color: 'cyan' },
    { label: 'This Month', value: '8', icon: TrendingUp, color: 'green' },
    { label: 'Total Views', value: '1,234', icon: Eye, color: 'purple' },
    { label: 'Templates Used', value: '12', icon: Users, color: 'orange' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
          <p className="text-slate-300">Here's what's happening with your presentations today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Presentations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Presentations</h2>
              <button className="text-cyan-400 hover:text-cyan-300 text-sm">View All</button>
            </div>
            
            <div className="space-y-4">
              {recentPresentations.map((presentation) => (
                <div key={presentation.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{presentation.title}</h3>
                      <p className="text-sm text-slate-300">{presentation.lastModified}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-300">
                    <Eye className="h-4 w-4" />
                    <span>{presentation.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Create New */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Presentation
                </button>
                <button className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                  Browse Templates
                </button>
                <button className="w-full bg-slate-700 text-white py-3 px-4 rounded-lg hover:bg-slate-600 transition-colors">
                  AI Assistant
                </button>
              </div>
            </div>

            {/* Usage Overview */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-cyan-400" />
                Usage Overview
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Presentations</span>
                    <span className="text-white">8/∞</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">AI Generations</span>
                    <span className="text-white">156/∞</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}