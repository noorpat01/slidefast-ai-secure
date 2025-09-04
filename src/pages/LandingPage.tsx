import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Smartphone,
  Download
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'Adaptive AI Intelligence',
      description: 'AI automatically adjusts content complexity from beginner to PhD level based on your audience'
    },
    {
      icon: Zap,
      title: 'Lightning Fast Generation',
      description: 'Create professional presentations in seconds with our cost-effective DeepSeek V3.1 integration'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with SOC 2 compliance and data encryption at rest and in transit'
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Built-in analytics track engagement and performance to optimize your presentations'
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time with comments, suggestions, and version control'
    },
    {
      icon: Globe,
      title: 'Global Accessibility',
      description: 'Multi-language support and accessibility features ensure everyone can create and consume content'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'VP of Sales, TechCorp',
      content: 'Slidefast transformed our pitch process. We create presentations 10x faster with better engagement.'
    },
    {
      name: 'Dr. Michael Rodriguez',
      role: 'Research Director, MedTech',
      content: 'The PhD-level content generation is incredible. It understands complex research and creates compelling narratives.'
    },
    {
      name: 'Jessica Wang',
      role: 'Marketing Manager, Startup',
      content: 'From concept to presentation in minutes. The adaptive intelligence ensures our message resonates with any audience.'
    }
  ]

  const pricing = [
    {
      name: 'Freemium',
      price: '$0',
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '5 presentations per month',
        'Basic AI generation',
        'Standard templates',
        'PDF export',
        'Community support'
      ],
      popular: false
    },
    {
      name: 'Essential',
      price: '$12',
      period: '/month',
      description: 'For professionals and small teams',
      features: [
        '25 presentations per month',
        'Advanced AI generation',
        'Premium templates',
        'All export formats',
        'Image generation',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Professional',
      price: '$25',
      period: '/month',
      description: 'For power users and teams',
      features: [
        'Unlimited presentations',
        'PhD-level content',
        'Custom branding',
        'Team collaboration',
        'Advanced analytics',
        'API access'
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Slidefast</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              AI-Powered Presentations
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"> That Adapt</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create stunning presentations with adaptive AI that automatically adjusts content complexity for your audience. From beginner explanations to PhD-level analysis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 shadow-xl flex items-center space-x-2"
              >
                <span>Start Creating Now</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="px-8 py-4 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:border-slate-500 hover:text-white transition-all duration-200">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Experience the future of presentation creation with features designed for modern professionals
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              See how Slidefast is transforming how teams create and deliver presentations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-slate-400 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Start free and scale as you grow. All plans include our core Slidefast presentation features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <div key={index} className={`p-8 rounded-2xl border transition-all duration-300 relative ${
                plan.popular 
                  ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/50 scale-105'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <p className="text-slate-300 mb-8">{plan.description}</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-slate-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/signup"
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 text-center block ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 shadow-lg'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Presentations?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Join thousands of professionals who are already creating stunning, adaptive presentations with Slidefast.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 shadow-xl"
              >
                Start Your Free Trial
              </Link>
              <div className="flex items-center space-x-4 text-slate-400 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>5 presentations free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Slidefast</span>
            </div>
            <div className="flex items-center space-x-6 text-slate-400 text-sm">
              <span>© 2025 Slidefast. All rights reserved.</span>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}