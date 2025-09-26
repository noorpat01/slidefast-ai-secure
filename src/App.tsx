import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/auth'
import { AIEnhancedEditor } from './pages/AIEnhancedEditor'
import { LoginPage } from './pages/LoginPage'
import { motion } from 'framer-motion'
import { Brain, Loader2 } from 'lucide-react'

function App() {
  const { user, loading, setUser, setLoading, fetchUsageStats, fetchSubscription } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // Load initial user
    const loadUser = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Fetch user data in parallel
          await Promise.allSettled([
            fetchUsageStats(),
            fetchSubscription()
          ])
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
        setInitializing(false)
      }
    }

    loadUser()

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, fetchUsageStats, fetchSubscription])

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-12 w-12 text-blue-600" />
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Presentation Studio</h1>
            <p className="text-gray-600">Initializing advanced AI capabilities...</p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={user ? <AIEnhancedEditor /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/editor" 
            element={user ? <AIEnhancedEditor /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/login" 
            element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App