import React, { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../store/auth'
import { supabase } from '../lib/supabase'
import { 
  Crown, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  CreditCard, 
  Calendar, 
  Users, 
  Star,
  Sparkles,
  TrendingUp,
  Shield,
  Headphones,
  Bot
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { AISupportChat } from '../components/ai-support/AISupportChat'
import toast from 'react-hot-toast'

export const SubscriptionPage: React.FC = () => {
  const { user, subscription, plans, usageStats, fetchSubscription, fetchPlans } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const aiChatRef = useRef<HTMLDivElement>(null)

  const scrollToAIChat = () => {
    if (aiChatRef.current) {
      aiChatRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Flash the AI chat to draw attention
      aiChatRef.current.style.animation = 'pulse 0.5s ease-in-out 2'
      setTimeout(() => {
        if (aiChatRef.current) {
          aiChatRef.current.style.animation = ''
        }
      }, 1000)
    }
  }

  useEffect(() => {
    fetchPlans()
    fetchSubscription()
  }, [])

  const currentPlan = subscription?.ai_present_plans || null
  const currentPlanType = currentPlan?.plan_type || 'freemium'

  const handleSubscribe = async (planType: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planType,
          customerEmail: user.email
        }
      })

      if (error) throw error

      if (data.data?.checkoutUrl) {
        toast.success('Redirecting to payment...')
        window.location.href = data.data.checkoutUrl
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Failed to create subscription')
    } finally {
      setLoading(false)
    }
  }

  const planFeatures = {
    freemium: [
      '5 presentations per month',
      'Basic AI generation',
      'Standard templates',
      'PDF export',
      'Community support'
    ],
    essential: [
      '25 presentations per month',
      'Advanced AI generation',
      'Premium templates',
      'All export formats',
      'Image generation',
      'Priority support'
    ],
    professional: [
      'Unlimited presentations',
      'PhD-level content generation',
      'Custom branding',
      'Team collaboration',
      'Advanced analytics',
      'API access',
      'Priority support'
    ],
    enterprise: [
      'Everything in Professional',
      'White-label solution',
      'Advanced security features',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      '24/7 phone support'
    ]
  }

  const planPricing = plans.reduce((acc, plan) => {
    acc[plan.plan_type] = {
      monthly: plan.price / 100,
      yearly: (plan.price / 100) * 10 // 20% discount for yearly
    }
    return acc
  }, {} as Record<string, { monthly: number; yearly: number }>)

  const planData = [
    {
      type: 'freemium',
      name: 'Freemium',
      description: 'Perfect for getting started',
      icon: Users,
      popular: false,
      gradient: 'from-slate-500 to-slate-600'
    },
    {
      type: 'essential',
      name: 'Essential',
      description: 'For professionals and small teams',
      icon: Zap,
      popular: true,
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      type: 'professional',
      name: 'Professional',
      description: 'For power users and teams',
      icon: Crown,
      popular: false,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      type: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      icon: Shield,
      popular: false,
      gradient: 'from-emerald-500 to-teal-500'
    }
  ]

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Unlock the full power of AI-driven presentation creation. Start free and scale as you grow.
          </p>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <div className="mb-8 p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Crown className="h-5 w-5 text-cyan-400 mr-2" />
                  <span className="text-cyan-300 font-medium">Current Plan</span>
                </div>
                <h3 className="text-xl font-bold text-white capitalize">{currentPlan?.plan_type} Plan</h3>
                <p className="text-slate-300">
                  ${(currentPlan?.price || 0) / 100}/month • Status: {subscription.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-300 text-sm mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {usageStats?.presentations_created || 0}
                  <span className="text-slate-400 text-base font-normal ml-1">
                    / {usageStats?.monthly_limit === -1 ? '∞' : usageStats?.monthly_limit} presentations
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 relative ${
                billingPeriod === 'yearly'
                  ? 'bg-cyan-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                20% off
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {planData.map((plan) => {
            const Icon = plan.icon
            const pricing = planPricing[plan.type]
            const price = pricing ? pricing[billingPeriod] : 0
            const isCurrentPlan = currentPlanType === plan.type
            const features = planFeatures[plan.type as keyof typeof planFeatures] || []

            return (
              <div
                key={plan.type}
                className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/50 scale-105'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    {plan.type === 'freemium' ? (
                      <div>
                        <span className="text-4xl font-bold text-white">Free</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-white">${price}</span>
                        <span className="text-slate-400">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                        {billingPeriod === 'yearly' && pricing && (
                          <div className="text-sm text-green-400 mt-1">
                            Save ${(pricing.monthly * 12 - pricing.yearly).toFixed(0)}/year
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-slate-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.type !== 'freemium' && handleSubscribe(plan.type)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                    isCurrentPlan
                      ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                      : plan.type === 'freemium'
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 shadow-lg'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.type === 'freemium' ? (
                    'Get Started'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Why Choose Slidefast?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Adaptive AI Intelligence</h3>
              <p className="text-slate-300">
                Our AI automatically adjusts content complexity from beginner to PhD level based on your audience.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Cost-Effective AI</h3>
              <p className="text-slate-300">
                We use DeepSeek V3.1 for 90% lower AI costs while maintaining premium quality output.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Enterprise Security</h3>
              <p className="text-slate-300">
                Bank-grade security with SOC 2 compliance and data encryption at rest and in transit.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ or AI Support */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            Need help choosing the right plan?
          </h3>
          <p className="text-slate-300 mb-6">
            Our AI assistant is here 24/7 to help you find the perfect plan and answer any questions instantly.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={scrollToAIChat}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center cursor-pointer hover:scale-105 active:scale-95"
            >
              <Bot className="h-5 w-5 mr-2" />
              Slidefast AI Assistant Available Below ↓
            </button>
            <div className="text-slate-400 text-sm">
              💬 Instant responses • 🤖 Context-aware • ✨ 24/7 availability
            </div>
          </div>
        </div>
      </div>

      {/* AI Support Chat Component */}
      <div ref={aiChatRef} className="mt-8">
        <AISupportChat />
      </div>
    </div>
  )
}