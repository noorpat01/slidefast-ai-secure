import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { usePresentationStore } from '../../store/presentation'
import { AISupportProvider } from '../ai-support/AISupportProvider'
import { AISupportChat } from '../ai-support/AISupportChat'
import { AIEnhancementProvider } from '../../contexts/AIEnhancementContext'
import { 
  LayoutDashboard, 
  Presentation, 
  Plus, 
  CreditCard, 
  LogOut, 
  User,
  Sparkles,
  BarChart3
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { user, usageStats, subscription, signOut } = useAuthStore()
  const { currentPresentation } = usePresentationStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Generate', href: '/generate', icon: Plus },
    { name: 'Presentations', href: '/presentations', icon: Presentation },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Subscription', href: '/subscription', icon: CreditCard }
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <AISupportProvider>
      <AIEnhancementProvider>
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Slidefast</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => console.log('🗺️ Navigating to:', item.href)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Usage Stats */}
            {usageStats && (
              <div className="p-4 mx-4 mb-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">This Month</span>
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Presentations:</span>
                    <span>{usageStats.presentations_created}/{usageStats.monthly_limit === -1 ? '∞' : usageStats.monthly_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <span>{usageStats.images_generated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="capitalize">{usageStats.subscription_type}</span>
                  </div>
                </div>
                {usageStats.monthly_limit !== -1 && (
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(usageStats.usage_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <Link 
                  to="/profile"
                  className="flex items-center space-x-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      {subscription?.ai_present_plans?.plan_type || 'Free'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        
        {/* AI Support Chat */}
        <AISupportChat />
      </div>
      </AIEnhancementProvider>
    </AISupportProvider>
  )
}