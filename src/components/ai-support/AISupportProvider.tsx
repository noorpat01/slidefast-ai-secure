import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserActivity, UserActivity } from '../../hooks/useUserActivity';

interface AISupportContextType {
  activity: UserActivity;
  trackAction: (action: string) => void;
  trackExportAttempt: () => void;
  trackError: (error: string) => void;
  getContextualHints: () => string[];
  showProactiveHint: boolean;
  dismissProactiveHint: () => void;
}

const AISupportContext = createContext<AISupportContextType | undefined>(undefined);

export function AISupportProvider({ children }: { children: React.ReactNode }) {
  const userActivity = useUserActivity();
  const [showProactiveHint, setShowProactiveHint] = useState(false);

  // Show proactive hints based on user behavior
  useEffect(() => {
    const hints = userActivity.getContextualHints();
    if (hints.length > 0) {
      const timer = setTimeout(() => {
        setShowProactiveHint(true);
      }, 5000); // Show hint after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [userActivity.activity]);

  const dismissProactiveHint = () => {
    setShowProactiveHint(false);
  };

  return (
    <AISupportContext.Provider value={{
      ...userActivity,
      showProactiveHint,
      dismissProactiveHint
    }}>
      {children}
    </AISupportContext.Provider>
  );
}

export function useAISupport() {
  const context = useContext(AISupportContext);
  if (context === undefined) {
    throw new Error('useAISupport must be used within an AISupportProvider');
  }
  return context;
}