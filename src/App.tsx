import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/auth'
import { AIEnhancementProvider } from './contexts/AIEnhancementContext'

// Components
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignUpPage } from './pages/SignUpPage'
import { DashboardPage } from './pages/DashboardPage'
import { GeneratorPage } from './pages/GeneratorPage'
import { PresentationsPage } from './pages/PresentationsPage'
import PresentationViewerPage from './pages/PresentationViewerPage'
import { PresentationEditPage } from './pages/PresentationEditPage'
import { SubscriptionPage } from './pages/SubscriptionPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ProfilePage } from './pages/ProfilePage'
import { Layout } from './components/layout/Layout'

// Component to debug navigation
const NavigationLogger: React.FC = () => {
  const location = useLocation()
  
  useEffect(() => {
    console.log('🗺️ Route changed to:', location.pathname, location.search, location.hash)
  }, [location])
  
  return null
}

function App() {
  const { user, loading, setUser, setLoading, fetchUsageStats, fetchSubscription, fetchPlans } = useAuthStore()
  const [initializing, setInitializing] = React.useState(true)

  useEffect(() => {
    // Load initial user
    const loadUser = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Execute these in parallel but don't wait for all to complete
          // if some fail, the app should still load
          Promise.allSettled([
            fetchUsageStats(),
            fetchSubscription(), 
            fetchPlans()
          ]).then((results) => {
            console.log('✅ Data fetching completed:', results.map((r, i) => `${['usage', 'subscription', 'plans'][i]}: ${r.status}`).join(', '))
          })
        }
      } catch (error) {
        console.error('❌ Failed to load user:', error)
      } finally {
        setLoading(false)
        setInitializing(false) // Auth initialization complete
      }
    }
    
    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user')
        setUser(session?.user || null)
        
        if (session?.user) {
          // Don't block UI for these background data fetches
          Promise.allSettled([
            fetchUsageStats(),
            fetchSubscription(),
            fetchPlans()
          ]).then((results) => {
            console.log('✅ Background data fetching completed:', results.map((r, i) => `${['usage', 'subscription', 'plans'][i]}: ${r.status}`).join(', '))
          })
        }
        
        // Ensure we're not stuck in initializing state
        if (initializing) {
          setInitializing(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Router>
      <NavigationLogger />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUpPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/google/callback" element={<AuthCallbackPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <DashboardPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/generate" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <GeneratorPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/presentations" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <PresentationsPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/presentations/:id/view" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <PresentationViewerPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/presentations/:id/edit" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <PresentationEditPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/subscription" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <SubscriptionPage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
          <Route path="/profile" element={
            user ? (
              <AIEnhancementProvider>
                <Layout>
                  <ProfilePage />
                </Layout>
              </AIEnhancementProvider>
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155'
            }
          }}
        />
      </div>
    </Router>
  )
}

export default App