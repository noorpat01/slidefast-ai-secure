import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { usePresentationStore } from '../store/presentation'
import { 
  Plus, 
  Presentation, 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  Image,
  Zap
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const DashboardPage: React.FC = () => {
  const { user, usageStats, subscription, fetchUsageStats } = useAuthStore()
  const { presentations, fetchPresentations, loading } = usePresentationStore()

  useEffect(() => {
    fetchPresentations()
    fetchUsageStats()
  }, [])

  const recentPresentations = presentations.slice(0, 3)
  const planName = subscription?.ai_present_plans?.plan_type || 'freemium'
  const isUnlimited = usageStats?.monthly_limit === -1

  const quickActions = [
    {
      title: 'Generate Presentation',
      description: 'Create a new AI-powered presentation',
      icon: Plus,
      href: '/generate',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Browse Templates',
      description: 'Explore professional templates',
      icon: FileText,
      href: '/presentations',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Generate Images',
      description: 'Create custom visuals with AI',
      icon: Image,
      href: '/generate',
      gradient: 'from-green-500 to-teal-500'
    }
  ]

  const stats = [
    {
      label: 'Presentations Created',
      value: usageStats?.presentations_created || 0,
      icon: Presentation,
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      label: 'Images Generated',
      value: usageStats?.images_generated || 0,
      icon: Image,
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      label: 'Total Tokens Used',
      value: usageStats?.total_tokens_used || 0,
      icon: Zap,
      change: '+15%',
      changeType: 'positive' as const
    },
    {
      label: 'Current Plan',
      value: planName.charAt(0).toUpperCase() + planName.slice(1),
      icon: BarChart3,
      change: isUnlimited ? 'Unlimited' : `${usageStats?.remaining_presentations || 0} left`,
      changeType: 'neutral' as const
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'there'}!
        </h1>
        <p className="text-slate-300">
          Ready to create amazing presentations? Let's get started.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Link
              key={index}
              to={action.href}
              className="group p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                {action.title}
              </h3>
              <p className="text-slate-400 text-sm mb-3">{action.description}</p>
              <div className="flex items-center text-cyan-400 text-sm font-medium">
                <span>Get started</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Presentations & Usage */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Presentations */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Presentations</h2>
              <Link 
                to="/presentations" 
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : recentPresentations.length > 0 ? (
              <div className="space-y-4">
                {recentPresentations.map((presentation) => (
                  <div key={presentation.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{presentation.title}</h3>
                        <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                          {presentation.description || 'No description available'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(presentation.updated_at).toLocaleDateString()}
                          </span>
                          <span className="capitalize px-2 py-1 bg-slate-700 rounded">
                            {presentation.status}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/presentations/${presentation.id}/view`}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Presentation className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No presentations yet</h3>
                <p className="text-slate-400 mb-4">Create your first AI-powered presentation to get started</p>
                <Link
                  to="/generate"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Presentation
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Usage Overview */}
        <div className="space-y-6">
          {/* Monthly Usage */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Usage</h3>
            
            {usageStats && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Presentations</span>
                    <span className="text-slate-300">
                      {usageStats.presentations_created}/{isUnlimited ? '∞' : usageStats.monthly_limit}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usageStats.usage_percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-slate-400">Images</p>
                    <p className="text-lg font-semibold text-white">{usageStats.images_generated}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Tokens</p>
                    <p className="text-lg font-semibold text-white">{usageStats.total_tokens_used}</p>
                  </div>
                </div>
              </div>
            )}
            
            {(!isUnlimited && usageStats && usageStats.usage_percentage > 80) && (
              <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                <p className="text-amber-300 text-xs font-medium mb-2">Usage Warning</p>
                <p className="text-amber-200 text-xs">You're approaching your monthly limit. Consider upgrading your plan.</p>
                <Link 
                  to="/subscription" 
                  className="text-amber-300 hover:text-amber-200 text-xs font-medium flex items-center mt-2"
                >
                  Upgrade plan
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}
          </div>

          {/* Upgrade CTA */}
          {planName === 'freemium' && (
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl p-6">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 text-cyan-400 mr-2" />
                <span className="text-sm font-medium text-cyan-300">Upgrade Available</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Unlock More Features</h3>
              <p className="text-slate-300 text-sm mb-4">
                Get unlimited presentations, advanced AI, and premium templates.
              </p>
              <Link
                to="/subscription"
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200"
              >
                Upgrade Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}