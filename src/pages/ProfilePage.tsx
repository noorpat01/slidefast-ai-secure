import React from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Camera, Lock, Bell } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <User className="mr-3 h-8 w-8 text-cyan-400" />
            Profile Settings
          </h1>
          <p className="text-slate-300">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                  <input
                    type="text"
                    defaultValue="Product Manager"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                  <input
                    type="text"
                    defaultValue="Tech Solutions Inc."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Security Settings */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Lock className="mr-2 h-5 w-5 text-cyan-400" />
                Security
              </h2>
              <div className="space-y-4">
                <button className="w-full text-left bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white hover:bg-slate-700 transition-colors">
                  Change Password
                </button>
                <button className="w-full text-left bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white hover:bg-slate-700 transition-colors">
                  Enable Two-Factor Authentication
                </button>
                <button className="w-full text-left bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white hover:bg-slate-700 transition-colors">
                  Manage Connected Apps
                </button>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Bell className="mr-2 h-5 w-5 text-cyan-400" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Email Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Push Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Marketing Updates</span>
                  <input type="checkbox" className="w-4 h-4 text-cyan-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Profile Picture and Stats */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-white">John Doe</h3>
              <p className="text-slate-300 text-sm">Product Manager</p>
            </motion.div>

            {/* Account Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Presentations Created</span>
                  <span className="text-white font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Templates Used</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">AI Generations</span>
                  <span className="text-white font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Member Since</span>
                  <span className="text-white font-medium">Jan 2024</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex justify-end"
        >
          <button className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}