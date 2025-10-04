import React from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Check, Zap, Crown, Star } from 'lucide-react'

export const SubscriptionPage: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      current: true,
      features: [
        '5 presentations per month',
        'Basic templates',
        'Standard AI assistance',
        'Export to PDF'
      ]
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'month',
      popular: true,
      features: [
        'Unlimited presentations',
        'Premium templates',
        'Advanced AI features',
        'All export formats',
        'Priority support',
        'Custom branding'
      ]
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: 'month',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Admin dashboard',
        'SSO integration',
        'Advanced analytics',
        'Dedicated support'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center">
            <CreditCard className="mr-3 h-8 w-8 text-cyan-400" />
            Subscription Plans
          </h1>
          <p className="text-slate-300">Choose the perfect plan for your presentation needs</p>
        </div>

        {/* Current Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Current Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">3/5</div>
              <div className="text-slate-300">Presentations This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">12</div>
              <div className="text-slate-300">AI Generations Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">Free Plan</div>
              <div className="text-slate-300">Current Subscription</div>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
              className={`relative bg-slate-800/50 backdrop-blur-xl border rounded-xl p-6 ${
                plan.popular
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/20'
                  : 'border-slate-700/50'
              } ${plan.current ? 'ring-2 ring-green-500/20 border-green-500/50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  {plan.name === 'Free' && <Zap className="h-6 w-6 text-cyan-400" />}
                  {plan.name === 'Pro' && <Star className="h-6 w-6 text-purple-400" />}
                  {plan.name === 'Enterprise' && <Crown className="h-6 w-6 text-yellow-400" />}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-300 ml-1">/{plan.period}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center">
                    <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  plan.current
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : plan.name === 'Free' ? 'Downgrade' : 'Upgrade'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Billing History</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-slate-300">No billing history available</span>
              <span className="text-slate-400 text-sm">Free Plan</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}