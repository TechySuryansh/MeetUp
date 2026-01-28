import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  Star,
  Play,
  Calendar,
  MessageCircle,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const LandingPage = ({ onSignIn, onHostMeeting, onJoinMeeting }) => {
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (joinMeetingId.trim()) {
      onJoinMeeting(joinMeetingId.trim());
      setShowJoinModal(false);
      setJoinMeetingId('');
    }
  };

  const features = [
    {
      icon: Video,
      title: "HD Video Calls",
      description: "Crystal clear video quality with adaptive streaming"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Connect with unlimited participants seamlessly"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end encryption for all your conversations"
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Instant messaging during calls with file sharing"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Schedule and manage meetings with ease"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Join from anywhere, on any device"
    }
  ];

  const stats = [
    { number: "10M+", label: "Happy Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "150+", label: "Countries" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">MeetUp</span>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSignIn}
              className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Trusted by millions worldwide
                </motion.div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  Connect
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Beyond </span>
                  Boundaries
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Experience seamless video conferencing with crystal-clear quality, 
                  real-time collaboration, and enterprise-grade security.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onHostMeeting}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Start Meeting</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowJoinModal(true)}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Join Meeting</span>
                  </div>
                </motion.button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-white">{stat.number}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Video Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Video Card */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-white/10"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">You</div>
                        <div className="text-gray-400 text-sm">Host</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Live</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Participant Cards */}
                <motion.div
                  animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                </motion.div>

                <motion.div
                  animate={{ x: [0, -10, 0], y: [0, 5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl border border-white/10 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> perfect meetings</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful features designed to make your virtual meetings more productive and engaging
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Meeting Modal */}
      {showJoinModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Join a Meeting</h3>
              <p className="text-gray-400">Enter the meeting ID to join</p>
            </div>

            <form onSubmit={handleJoinMeeting} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  placeholder="Enter Meeting ID"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  Join Meeting
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default LandingPage;