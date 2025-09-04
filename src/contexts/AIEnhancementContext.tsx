import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AISuggestion {
  id: string;
  type: 'content' | 'design' | 'template';
  category: string;
  text: string;
  reason: string;
  priority: number;
  confidence: number;
  applied: boolean;
  dismissed: boolean;
}

interface AIAnalysis {
  strengths: string[];
  improvements: string[];
  clarity_score: number;
  engagement_score: number;
  tone?: string;
}

interface TemplateRecommendation {
  template_id: string;
  match_score: number;
  reasons: string[];
  style_adjustments: string[];
  priority: 'high' | 'medium' | 'low';
}

interface VoiceNarration {
  id: string;
  audio_url: string;
  duration_seconds: number;
  status: 'generating' | 'ready' | 'failed';
  voice_settings: {
    voice: string;
    speed: number;
    tone: string;
    language: string;
  };
}

interface AIEnhancementContextType {
  // AI Suggestions
  suggestions: AISuggestion[];
  loadingSuggestions: boolean;
  
  // AI Analysis
  currentAnalysis: AIAnalysis | null;
  loadingAnalysis: boolean;
  
  // Template Recommendations
  templateRecommendations: TemplateRecommendation[];
  loadingTemplates: boolean;
  
  // Voice Narrations
  voiceNarrations: VoiceNarration[];
  loadingVoice: boolean;
  
  // Actions
  analyzeContent: (presentationId: string, slideId: string, content: string, type?: 'content' | 'design') => Promise<void>;
  getTemplateRecommendations: (presentationId: string, content: string, title?: string) => Promise<void>;
  generateVoiceNarration: (presentationId: string, slideId: string, text: string, settings?: any) => Promise<void>;
  applySuggestion: (suggestionId: string) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;
  refreshSuggestions: (presentationId: string) => Promise<void>;
}

const AIEnhancementContext = createContext<AIEnhancementContextType | undefined>(undefined);

export function AIEnhancementProvider({ children }: { children: React.ReactNode }) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  const [templateRecommendations, setTemplateRecommendations] = useState<TemplateRecommendation[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  const [voiceNarrations, setVoiceNarrations] = useState<VoiceNarration[]>([]);
  const [loadingVoice, setLoadingVoice] = useState(false);
  
  const { user } = useAuthStore();

  const analyzeContent = async (
    presentationId: string, 
    slideId: string, 
    content: string, 
    type: 'content' | 'design' = 'content'
  ) => {
    if (!user) {
      toast.error('Please log in to use AI features');
      return;
    }

    setLoadingAnalysis(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-analyzer', {
        body: {
          presentationId,
          slideId,
          content,
          analysisType: type
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.data?.analysis) {
        setCurrentAnalysis(data.data.analysis);
      }

      if (data?.data?.suggestions) {
        // Save suggestions to database for persistence
        const suggestionsToSave = data.data.suggestions.map((suggestion: any) => ({
          presentation_id: presentationId,
          slide_id: slideId,
          suggestion_type: suggestion.type || type,
          suggestion_data: {
            category: suggestion.category,
            text: suggestion.text || suggestion.recommendation,
            reason: suggestion.reason || suggestion.rationale,
            priority: suggestion.priority || 3
          },
          confidence_score: 0.85,
          applied: false,
          dismissed: false
        }));

        try {
          const { data: savedSuggestions, error: saveError } = await supabase
            .from('ai_suggestions')
            .insert(suggestionsToSave)
            .select();

          if (saveError) {
            console.error('Failed to save suggestions to database:', saveError);
            // Continue with local suggestions if database save fails
          }

          // Use saved suggestions with proper IDs if available, otherwise use local ones
          const newSuggestions = (savedSuggestions || suggestionsToSave).map((suggestion: any, index: number) => ({
            id: suggestion.id || `${Date.now()}-${Math.random()}`,
            type: suggestion.suggestion_type || suggestion.type,
            category: suggestion.suggestion_data?.category || suggestion.category,
            text: suggestion.suggestion_data?.text || suggestion.text || suggestion.recommendation,
            reason: suggestion.suggestion_data?.reason || suggestion.reason || suggestion.rationale,
            priority: suggestion.suggestion_data?.priority || suggestion.priority || 3,
            confidence: suggestion.confidence_score || 0.85,
            applied: suggestion.applied || false,
            dismissed: suggestion.dismissed || false
          }));
          
          setSuggestions(prev => {
            const filtered = prev.filter(s => s.type !== type);
            return [...filtered, ...newSuggestions];
          });
        } catch (error) {
          console.error('Error processing suggestions:', error);
          // Fallback to local-only suggestions
          const newSuggestions = data.data.suggestions.map((suggestion: any) => ({
            id: `${Date.now()}-${Math.random()}`,
            type: suggestion.type,
            category: suggestion.category,
            text: suggestion.text || suggestion.recommendation,
            reason: suggestion.reason || suggestion.rationale,
            priority: suggestion.priority || 3,
            confidence: 0.85,
            applied: false,
            dismissed: false
          }));
          
          setSuggestions(prev => {
            const filtered = prev.filter(s => s.type !== type);
            return [...filtered, ...newSuggestions];
          });
        }
      }

      if (!data?.data?.cached) {
        toast.success(`AI ${type} analysis complete`);
      }
    } catch (error: any) {
      console.error('Content analysis error:', error);
      toast.error(`AI analysis failed: ${error.message}`);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getTemplateRecommendations = async (
    presentationId: string, 
    content: string, 
    title?: string
  ) => {
    if (!user) {
      toast.error('Please log in to use AI features');
      return;
    }

    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase.functions.invoke('template-matcher', {
        body: {
          presentationId,
          content,
          title
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.data?.template_recommendations) {
        setTemplateRecommendations(data.data.template_recommendations);
        toast.success('Template recommendations ready');
      }
    } catch (error: any) {
      console.error('Template matching error:', error);
      toast.error(`Template matching failed: ${error.message}`);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const generateVoiceNarration = async (
    presentationId: string, 
    slideId: string, 
    text: string, 
    settings: any = {}
  ) => {
    if (!user) {
      toast.error('Please log in to use AI features');
      return;
    }

    setLoadingVoice(true);
    try {
      const { data, error } = await supabase.functions.invoke('voice-narrator', {
        body: {
          presentationId,
          slideId,
          narrationText: text,
          voiceSettings: settings
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.data) {
        const newNarration: VoiceNarration = {
          id: data.data.narration_id,
          audio_url: data.data.audio_url,
          duration_seconds: data.data.duration_seconds,
          status: data.data.status,
          voice_settings: data.data.voice_settings
        };
        
        setVoiceNarrations(prev => [...prev, newNarration]);
        toast.success('Voice narration generated');
      }
    } catch (error: any) {
      console.error('Voice narration error:', error);
      toast.error(`Voice generation failed: ${error.message}`);
    } finally {
      setLoadingVoice(false);
    }
  };

  const applySuggestion = async (suggestionId: string) => {
    try {
      // Update local state immediately for UI responsiveness
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, applied: true } : s)
      );
      
      // Persist to database
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ applied: true })
        .eq('id', suggestionId);
        
      if (error) {
        console.error('Failed to persist suggestion application:', error);
        // Revert local state if database update fails
        setSuggestions(prev => 
          prev.map(s => s.id === suggestionId ? { ...s, applied: false } : s)
        );
        throw error;
      }
      
      toast.success('Suggestion applied and saved');
    } catch (error: any) {
      console.error('Error applying suggestion:', error);
      toast.error('Failed to apply suggestion');
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    try {
      // Update local state immediately for UI responsiveness
      setSuggestions(prev => 
        prev.map(s => s.id === suggestionId ? { ...s, dismissed: true } : s)
      );
      
      // Persist to database
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ dismissed: true })
        .eq('id', suggestionId);
        
      if (error) {
        console.error('Failed to persist suggestion dismissal:', error);
        // Revert local state if database update fails
        setSuggestions(prev => 
          prev.map(s => s.id === suggestionId ? { ...s, dismissed: false } : s)
        );
        throw error;
      }
      
      toast.success('Suggestion dismissed');
    } catch (error: any) {
      console.error('Error dismissing suggestion:', error);
      toast.error('Failed to dismiss suggestion');
    }
  };

  const refreshSuggestions = async (presentationId: string) => {
    if (!user || !presentationId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('presentation_id', presentationId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedSuggestions = data.map((suggestion: any) => ({
          id: suggestion.id,
          type: suggestion.suggestion_type,
          category: suggestion.suggestion_data?.category || 'general',
          text: suggestion.suggestion_data?.text || '',
          reason: suggestion.suggestion_data?.reason || '',
          priority: suggestion.suggestion_data?.priority || 3,
          confidence: suggestion.confidence_score || 0.85,
          applied: suggestion.applied,
          dismissed: suggestion.dismissed
        }));
        setSuggestions(formattedSuggestions);
      }
    } catch (error: any) {
      console.error('Error refreshing suggestions:', error);
    }
  };

  return (
    <AIEnhancementContext.Provider value={{
      suggestions,
      loadingSuggestions,
      currentAnalysis,
      loadingAnalysis,
      templateRecommendations,
      loadingTemplates,
      voiceNarrations,
      loadingVoice,
      analyzeContent,
      getTemplateRecommendations,
      generateVoiceNarration,
      applySuggestion,
      dismissSuggestion,
      refreshSuggestions
    }}>
      {children}
    </AIEnhancementContext.Provider>
  );
}

export function useAIEnhancement() {
  const context = useContext(AIEnhancementContext);
  if (context === undefined) {
    throw new Error('useAIEnhancement must be used within an AIEnhancementProvider');
  }
  return context;
}