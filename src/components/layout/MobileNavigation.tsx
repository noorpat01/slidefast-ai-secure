import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { 
  LayoutDashboard, 
  Presentation, 
  Plus, 
  User,
  Menu,
  X,
  CreditCard,
  LogOut,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Brain
} from 'lucide-react'
import { useIsMobile } from '../../hooks/use-mobile'

interface MobileNavigationProps {
  className?: string
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ className = '' }) => {
  const location = useLocation()
  const { user, usageStats, subscription, signOut } = useAuthStore()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Bottom tab navigation items
  const bottomTabs = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Studio', href: '/ai-studio', icon: Brain },
    { name: 'Generate', href: '/generate', icon: Plus },
    { name: 'Library', href: '/presentations', icon: Presentation }
  ]

  // Drawer menu items
  const drawerItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Content Studio', href: '/ai-studio', icon: Brain },
    { name: 'Generate Presentation', href: '/generate', icon: Plus },
    { name: 'Browse Templates', href: '/templates', icon: FileText },
    { name: 'My Presentations', href: '/presentations', icon: Presentation },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Subscription', href: '/subscription', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help & Support', href: '/help', icon: HelpCircle }
  ]

  const isActive = (href: string) => location.pathname === href

  const handleTabClick = (href: string) => {
    setIsDrawerOpen(false)
  }

  if (!isMobile) return null

  return (
    <>
      {/* Top Mobile Header */}
      <div className={`fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 ${className}`}>
        <div className="flex items-center justify-between px-safe py-3">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Slidefast</span>
          </Link>

          {/* Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors min-w-touch min-h-touch flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
        <div className="grid grid-cols-4 px-2 py-2">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.name}
                to={tab.href}
                onClick={() => handleTabClick(tab.href)}
                className={`flex flex-col items-center py-2 px-1 min-h-touch transition-all duration-200 rounded-lg ${
                  active
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium truncate w-full text-center">{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Slide-out Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transform transition-transform duration-300 ease-out">
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Slidefast</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors min-w-touch min-h-touch flex items-center justify-center"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {drawerItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-h-touch ${
                        active
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
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center space-x-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-slate-800/50 transition-colors min-h-touch"
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
                    onClick={() => {
                      signOut()
                      setIsDrawerOpen(false)
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-w-touch min-h-touch flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// Floating Action Button for primary actions
interface FloatingActionButtonProps {
  onClick?: () => void
  className?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const isMobile = useIsMobile()
  
  if (!isMobile) return null

  return (
    <Link
      to="/generate"
      onClick={onClick}
      className={`fixed bottom-20 right-safe z-30 w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center text-white hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 active:scale-95 ${className}`}
      aria-label="Create new presentation"
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}