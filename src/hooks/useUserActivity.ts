import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';

export interface UserActivity {
  currentPage: string;
  timeOnPage: number;
  recentActions: string[];
  exportAttempts: number;
  presentationCount: number;
  lastError?: string;
  errorHistory: string[];
  sessionStart: Date;
  pageVisits: { [page: string]: number };
  totalSessionTime: number;
  lastSuccessfulAction?: string;
  failedActions: string[];
}

export function useUserActivity() {
  const { user } = useAuthStore();
  const [activity, setActivity] = useState<UserActivity>({
    currentPage: window.location.pathname,
    timeOnPage: 0,
    recentActions: [],
    exportAttempts: 0,
    presentationCount: 0,
    errorHistory: [],
    sessionStart: new Date(),
    pageVisits: { [window.location.pathname]: 1 },
    totalSessionTime: 0,
    failedActions: []
  });

  // Track page changes
  useEffect(() => {
    const updatePage = () => {
      const newPath = window.location.pathname;
      setActivity(prev => ({
        ...prev,
        currentPage: newPath,
        timeOnPage: 0,
        totalSessionTime: prev.totalSessionTime + prev.timeOnPage,
        pageVisits: {
          ...prev.pageVisits,
          [newPath]: (prev.pageVisits[newPath] || 0) + 1
        }
      }));
    };

    window.addEventListener('popstate', updatePage);
    
    // Track time on page
    const timeTracker = setInterval(() => {
      setActivity(prev => ({
        ...prev,
        timeOnPage: prev.timeOnPage + 1
      }));
    }, 1000);

    return () => {
      window.removeEventListener('popstate', updatePage);
      clearInterval(timeTracker);
    };
  }, []);

  // Load user statistics
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('presentations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      setActivity(prev => ({
        ...prev,
        presentationCount: count || 0
      }));
    } catch (error) {
      console.log('Failed to load user stats:', error);
    }
  };

  const trackAction = useCallback((action: string) => {
    setActivity(prev => ({
      ...prev,
      recentActions: [action, ...prev.recentActions.slice(0, 4)] // Keep last 5 actions
    }));
  }, []);

  const trackExportAttempt = useCallback(() => {
    setActivity(prev => ({
      ...prev,
      exportAttempts: prev.exportAttempts + 1
    }));
  }, []);

  const trackError = useCallback((error: string) => {
    const timestamp = new Date().toISOString();
    const errorWithTimestamp = `${timestamp}: ${error}`;
    
    setActivity(prev => ({
      ...prev,
      lastError: error,
      errorHistory: [errorWithTimestamp, ...prev.errorHistory.slice(0, 9)], // Keep last 10 errors
      failedActions: [error, ...prev.failedActions.slice(0, 4)] // Keep last 5 failed actions
    }));
  }, []);

  const trackSuccess = useCallback((action: string) => {
    setActivity(prev => ({
      ...prev,
      lastSuccessfulAction: action
    }));
  }, []);

  const getContextualHints = useCallback((): string[] => {
    const hints: string[] = [];
    const { currentPage, timeOnPage, recentActions, exportAttempts } = activity;

    // Page-specific hints
    if (currentPage.includes('/generator') && timeOnPage > 30) {
      hints.push('💡 Need help creating your presentation? I can suggest the best prompts!');
    }

    if (currentPage.includes('/presentations') && exportAttempts > 2) {
      hints.push('📤 Having trouble with exports? I can guide you through each format!');
    }

    if (currentPage.includes('/subscription') && timeOnPage > 15) {
      hints.push('💎 Questions about our plans? I can help you choose the right one!');
    }

    // Action-based hints
    if (recentActions.some(action => action.includes('error'))) {
      hints.push('🔧 I noticed you encountered an error. I can help troubleshoot!');
    }

    if (recentActions.some(action => action.includes('export'))) {
      hints.push('📊 Working with exports? Did you know HTML exports have slideshow mode with F5?');
    }

    return hints;
  }, [activity]);

  return {
    activity,
    trackAction,
    trackExportAttempt,
    trackError,
    trackSuccess,
    getContextualHints
  };
}