import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X, Mail, Lock, User, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let userData;
      if (isLoginTab) {
        userData = await loginUser(email, password);
      } else {
        if (!fullName.trim()) throw new Error('Please enter your full name');
        userData = await registerUser(email, password, fullName);
      }
      if (onAuthSuccess) onAuthSuccess(userData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const userData = await loginUser('demo@cognitiveflow.ai', 'password123');
      if (onAuthSuccess) onAuthSuccess(userData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-card w-full max-w-md p-6 relative overflow-hidden border border-indigo-500/30 shadow-2xl"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isLoginTab ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sign in to sync your local cognitive load preferences & telemetry.
            </p>
          </div>

          {/* Demo Account Quick Shortcut Button */}
          <div className="mb-4">
            <button
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 rounded-xl text-xs font-semibold text-purple-200 flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              Quick Demo Login (demo@cognitiveflow.ai)
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl mb-5 border border-slate-800 font-medium text-xs">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 ${
                isLoginTab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setErrorMsg(''); }}
              className={`flex-1 py-2 rounded-lg transition-all font-bold flex items-center justify-center gap-1.5 ${
                !isLoginTab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-medium text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLoginTab && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Pawan Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/90 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="pawan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/90 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/90 text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLoginTab ? (
                <> <LogIn className="w-4 h-4" /> Sign In </>
              ) : (
                <> <UserPlus className="w-4 h-4" /> Create Account </>
              )}
            </motion.button>
          </form>

          <div className="mt-4 text-center text-[11px] text-slate-500 font-mono">
            Protected by local privacy encryption • No cloud logging
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
