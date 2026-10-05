import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Radio, Sparkles, Clock, User, LogIn, LogOut, Settings, ChevronDown } from 'lucide-react';

export default function Header({
  isConnected,
  taskContext,
  user,
  onOpenAuth,
  onOpenSettings,
  onLogout
}) {
  const [timeStr, setTimeStr] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="glass-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 relative z-20 overflow-visible"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 pointer-events-none" />

      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.08, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 cursor-pointer"
        >
          <Brain className="w-7 h-7" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Cognitive Flow-State Orchestrator
            </h1>
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
            >
              v1.0 Local Privacy Agent
            </motion.span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Real-Time Telemetry • ML Cognitive Mapping • RAG Interception
          </p>
        </div>
      </div>

      {/* Task Context Banner */}
      <motion.div
        layout
        className="hidden xl:flex items-center gap-2.5 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 shadow-inner"
      >
        <Sparkles className="w-4 h-4 text-purple-400 animate-spin-slow" />
        <div className="text-xs">
          <span className="text-slate-400 font-medium block">Active Task Context:</span>
          <span className="text-slate-200 font-semibold truncate max-w-xs block font-mono">
            {taskContext?.active_task || 'Loading task context...'}
          </span>
        </div>
      </motion.div>

      {/* Status Badges & User Profile Menu */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
          <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {isConnected ? 'WebSocket Live' : 'Connecting...'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{timeStr || '--:--:--'}</span>
        </div>

        {/* Auth User Menu */}
        {user ? (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-indigo-500/40 rounded-xl text-white font-medium shadow-md transition-all"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user.full_name ? user.full_name[0] : 'U'}
              </div>
              <span className="max-w-[100px] truncate font-semibold">{user.full_name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-1 z-30 text-xs"
                >
                  <div className="p-2 border-b border-slate-800">
                    <span className="font-bold text-white block truncate">{user.full_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); onOpenSettings(); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center gap-2 font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" /> Agent Settings
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-950/40 text-rose-300 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In / Account
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
