import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...')
        console.log('📍 Current URL:', window.location.href)
        
        const urlParams = new URLSearchParams(location.search)
        const hashParams = new URLSearchParams(location.hash.slice(1)) // Remove the # and parse
        const error = urlParams.get('error') || hashParams.get('error')
        const error_description = urlParams.get('error_description') || hashParams.get('error_description')
        const code = urlParams.get('code')
        const access_token = hashParams.get('access_token')
        
        console.log('🔍 OAuth parameters:', { error, code, access_token: access_token ? '***present***' : 'missing' })
        
        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, error_description)
          toast.error(`Authentication failed: ${error_description || error}`)
          navigate('/login?error=' + encodeURIComponent(error))
          return
        }

        // Handle implicit flow (access_token in hash)
        if (access_token) {
          console.log('📝 Processing implicit OAuth flow with access_token...')
          
          // For implicit flow, Supabase should automatically handle the session
          // Let's use the getSessionFromUrl method
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session creation error:', sessionError)
            
            // If getSession fails, try to manually refresh the session using the hash
            try {
              console.log('🔄 Attempting session refresh...')
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
              
              if (refreshError) {
                throw refreshError
              }
              
              if (refreshData.session) {
                console.log('✅ Session refreshed successfully:', refreshData.session.user.email)
                toast.success('Successfully signed in with Google!')
                navigate('/dashboard')
                return
              }
            } catch (refreshErr) {
              console.error('Session refresh failed:', refreshErr)
            }
            
            toast.error('Authentication failed: ' + sessionError.message)
            navigate('/login?error=' + encodeURIComponent(sessionError.message))
            return
          }

          if (data.session) {
            console.log('✅ Authentication successful:', data.session.user.email)
            const isGoogleAuth = data.session.user.app_metadata?.provider === 'google'
            
            if (isGoogleAuth) {
              toast.success('Successfully signed in with Google!')
            } else {
              toast.success('Successfully signed in!')
            }
            navigate('/dashboard')
            return
          }
        }

        // Handle code flow (authorization code)
        if (code) {
          console.log('📝 Processing authorization code flow...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            toast.error('Authentication failed: ' + exchangeError.message)
            navigate('/login?error=' + encodeURIComponent(exchangeError.message))
            return
          }

          if (data.session) {
            console.log('✅ Authentication successful:', data.session.user.email)
            toast.success('Successfully signed in!')
            navigate('/dashboard')
            return
          }
        }

        // Fallback: try to get any existing session
        console.log('🔍 Checking for existing session...')
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session check error:', sessionError)
          toast.error('Authentication failed: ' + sessionError.message)
          navigate('/login?error=' + encodeURIComponent(sessionError.message))
          return
        }

        if (sessionData.session) {
          console.log('✅ Found existing session:', sessionData.session.user.email)
          toast.success('Successfully signed in!')
          navigate('/dashboard')
        } else {
          console.log('❌ No session found, all methods failed')
          toast.error('Authentication failed: Unable to establish session')
          navigate('/login?error=Unable%20to%20establish%20session')
        }
      } catch (error: any) {
        console.error('❌ Unexpected callback error:', error)
        toast.error('Authentication failed: ' + (error.message || 'An unexpected error occurred'))
        navigate('/login?error=' + encodeURIComponent(error.message || 'An unexpected error occurred'))
      }
    }

    handleAuthCallback()
  }, [navigate, location])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Processing authentication...
        </h2>
        <p className="text-slate-300 mb-6">
          Please wait while we sign you in
        </p>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}