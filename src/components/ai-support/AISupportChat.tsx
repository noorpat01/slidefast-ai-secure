import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  context?: {
    page?: string;
    action?: string;
    presentationId?: string;
    error?: string;
  };
}

interface UserContext {
  currentPage: string;
  recentAction?: string;
  presentationCount?: number;
  subscriptionStatus?: string;
  lastExportAttempt?: string;
  errorHistory?: string[];
  timeOnPage?: number;
  sessionStart?: Date;
  exportAttempts?: number;
  lastError?: string;
  recentActions?: string[];
}

export function AISupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your Slidefast AI Assistant. How can I help you with your presentations today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({
    currentPage: window.location.pathname,
    timeOnPage: 0,
    sessionStart: new Date(),
    exportAttempts: 0,
    errorHistory: [],
    recentActions: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Track user context and activity
  useEffect(() => {
    const trackUserContext = async () => {
      if (user) {
        try {
          // Get user's presentation count
          const { count: presentationCount } = await supabase
            .from('presentations')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);

          // Get user's subscription info (if available)
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_status')
            .eq('id', user.id)
            .single();

          setUserContext(prev => ({
            ...prev,
            presentationCount: presentationCount || 0,
            subscriptionStatus: profile?.subscription_status || 'free'
          }));
        } catch (error) {
          console.log('Context tracking error:', error);
          // Track this error
          setUserContext(prev => ({
            ...prev,
            lastError: 'Failed to load user context',
            errorHistory: [`${new Date().toISOString()}: Context tracking error`, ...(prev.errorHistory || []).slice(0, 9)]
          }));
        }
      }
    };

    trackUserContext();

    // Enhanced page tracking with activity monitoring
    const handleLocationChange = () => {
      setUserContext(prev => ({
        ...prev,
        currentPage: window.location.pathname,
        timeOnPage: 0,
        recentActions: [`navigated to ${window.location.pathname}`, ...(prev.recentActions || []).slice(0, 4)]
      }));
    };

    // Track time on page
    const timeTracker = setInterval(() => {
      setUserContext(prev => ({
        ...prev,
        timeOnPage: (prev.timeOnPage || 0) + 1
      }));
    }, 1000);

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(timeTracker);
    };
  }, [user]);

  // Enhanced AI Response Engine with Real OpenAI Integration
  const generateAIResponse = async (userMessage: string, context: UserContext): Promise<string> => {
    try {
      // Enhanced context payload for AI
      const enhancedContext = {
        user: {
          email: user?.email || 'anonymous',
          presentationCount: context.presentationCount || 0,
          subscriptionStatus: context.subscriptionStatus || 'free',
          currentPage: context.currentPage,
          recentAction: context.recentAction
        },
        session: {
          currentURL: window.location.href,
          userAgent: navigator.userAgent,
          timeOnCurrentPage: userContext.timeOnPage || 0,
          sessionStart: userContext.sessionStart
        },
        activity: {
          exportAttempts: context.exportAttempts || 0,
          lastError: context.lastError,
          errorHistory: context.errorHistory || [],
          recentActions: userContext.recentActions || []
        },
        application: {
          name: 'Slidefast',
          version: '2.0',
          features: ['Slidefast Presentation Generation', 'PNG/JPEG Export', 'PDF Export', 'PowerPoint Export', 'HTML Export', 'Slideshow Mode']
        }
      };

      const systemPrompt = `You are an AI assistant for Slidefast, a professional presentation platform available at slidefast.ai. Provide concise, helpful support.

KEY FEATURES:
- AI-powered presentation generation
- Export formats: PNG/JPEG (zero-flash), PDF, PowerPoint, HTML (F5 slideshow)
- Mobile-optimized design
- Subscription tiers: Free (5/month), Pro (unlimited), Business (teams)

IMPORTANT DOMAIN REFERENCES:
- Always reference "slidefast.ai" as the primary domain
- Use "slidefast.ai/login" for login references
- Use "slidefast.ai/signup" for registration
- Use "slidefast.ai/presentations" for presentation management
- Use "slidefast.ai/subscription" for subscription information
- NEVER reference development URLs or temporary domains

USER CONTEXT:
${JSON.stringify(enhancedContext, null, 1)}

REQUIREMENTS:
- Be helpful and concise (max 3 short paragraphs)
- Reference user's actual data
- Always refer to platform as "Slidefast"
- Use slidefast.ai domain in any URL references
- Focus on immediate solutions
- Maintain professional tone without emojis`;

      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('API key not configured. Please set VITE_DEEPSEEK_API_KEY environment variable.');
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://slidefast.ai',
          'X-Title': 'Slidefast AI Assistant'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 250,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response format from OpenRouter');
      }

    } catch (error) {
      console.error('AI Response Error:', error);
      
      // Intelligent fallback based on context
      const fallbackResponse = generateIntelligentFallback(userMessage, context);
      return fallbackResponse;
    }
  };

  // Intelligent fallback system when AI API fails
  const generateIntelligentFallback = (userMessage: string, context: UserContext): string => {
    const currentPage = context.currentPage;
    const lowerMessage = userMessage.toLowerCase();

    // Context-aware fallback responses
    if (currentPage.includes('/presentations')) {
      if (lowerMessage.includes('export') || lowerMessage.includes('download')) {
        return `Export Support

PNG/JPEG: Zero-flash Web Worker technology - perfect for social media
PDF: Executive-quality documents with professional formatting  
PowerPoint: Sophisticated PPTX with premium design elements
HTML: Interactive slideshow with F5 fullscreen mode

Quick Fix: Try refreshing and re-attempting your export. If issues persist, check your browser's console for detailed error messages or visit slidefast.ai/help for additional support.`;
      }
    }

    if (currentPage.includes('/generator')) {
      return `Generation Support

Pro Tips for Better Results:
- Be specific about your topic and target audience
- Include desired slide count (e.g., "10-slide presentation")
- Mention key points you want covered
- Specify tone: professional, casual, educational

Your Stats: ${context.presentationCount || 0} presentations created

Try your generation again - our Slidefast AI is highly reliable! For additional help, visit slidefast.ai/support.`;
    }

    // General fallback
    return `Support Assistant

I can help you with:
- Presentation creation and editing
- Export troubleshooting (all formats)
- Keyboard shortcuts (F5 for slideshow!)
- Account and subscription questions
- Technical issues and error resolution

Current Status: Page: ${currentPage.split('/').pop()}, Presentations: ${context.presentationCount || 0}

Please try your question again, or describe your specific issue for targeted assistance. For comprehensive help, visit slidefast.ai/support.`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Track user action
    setUserContext(prev => ({
      ...prev,
      recentAction: `asked: ${inputMessage}`,
      recentActions: [`asked: ${inputMessage}`, ...(prev.recentActions || []).slice(0, 4)]
    }));

    // If message is about exports, track as export attempt
    if (inputMessage.toLowerCase().includes('export') || inputMessage.toLowerCase().includes('download')) {
      setUserContext(prev => ({
        ...prev,
        exportAttempts: (prev.exportAttempts || 0) + 1
      }));
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: {
        page: userContext.currentPage,
        action: userContext.recentAction
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const aiResponse = await generateAIResponse(inputMessage, userContext);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Track successful AI response
      setUserContext(prev => ({
        ...prev,
        recentActions: [`received AI response`, ...(prev.recentActions || []).slice(0, 4)]
      }));
      
    } catch (error) {
      console.error('AI response error:', error);
      
      // Track error
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      setUserContext(prev => ({
        ...prev,
        lastError: errorText,
        errorHistory: [`${new Date().toISOString()}: ${errorText}`, ...(prev.errorHistory || []).slice(0, 9)]
      }));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I\'m experiencing a temporary issue. Please try again in a moment, or refresh the page if the problem persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  // Chat bubble (closed state)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group relative"
          title="Ask AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            AI
          </div>
          
          {/* Proactive hint tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask me anything about Slidefast!
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[600px]'} w-96`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bot className="h-6 w-6" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-semibold">Slidefast AI Assistant</h3>
              <p className="text-xs opacity-90">Slidefast Support</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-white/20 p-1 rounded"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded"
              title="Close Chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-blue-100' : 'bg-gradient-to-r from-purple-100 to-blue-100'}`}>
                    {message.type === 'user' ? <User className="h-4 w-4 text-blue-600" /> : <Bot className="h-4 w-4 text-purple-600" />}
                  </div>
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-2xl max-w-xs ${message.type === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md shadow-sm'}`}>
                      <div className="text-sm leading-relaxed">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Slidefast presentations..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping || !inputMessage.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setInputMessage('How do I export my presentation?')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                >
                  Export Help
                </button>
                <button
                  onClick={() => setInputMessage('What are the keyboard shortcuts?')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                >
                  Shortcuts
                </button>
                <button
                  onClick={() => setInputMessage('Show me all features')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                >
                  Features
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}