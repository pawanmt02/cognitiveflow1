import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Coffee, Activity, Layers, Cpu, Award } from 'lucide-react';

export default function CognitiveStateGauge({ currentState }) {
  const state = currentState?.cognitive_state || 'ROUTINE_WORK';
  const focusScore = currentState?.focus_score ?? 50;
  const loadScore = currentState?.extraneous_load ?? 30;
  const confidence = (currentState?.confidence ?? 1.0) * 100;
  const probs = currentState?.state_probabilities || {};

  const getStateConfig = (st) => {
    switch (st) {
      case 'DEEP_FOCUS':
        return {
          label: 'DEEP FOCUS',
          icon: Zap,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20',
          glowClass: 'pulse-focus',
          gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
          strokeColor: '#10b981',
          description: 'High cognitive absorption. Intercepting & queuing routine communications.'
        };
      case 'ROUTINE_WORK':
        return {
          label: 'ROUTINE WORK',
          icon: Activity,
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20',
          glowClass: 'pulse-routine',
          gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
          strokeColor: '#06b6d4',
          description: 'Multitasking & communication state. Live notifications active.'
        };
      case 'IDLE':
      default:
        return {
          label: 'IDLE / TRANSITION',
          icon: Coffee,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20',
          glowClass: '',
          gradient: 'from-amber-500 via-orange-500 to-red-600',
          strokeColor: '#f59e0b',
          description: 'Low telemetry input. Synthesizing AI executive digest batch.'
        };
    }
  };

  const config = getStateConfig(state);
  const StateIcon = config.icon;

  const strokeDashoffset = 238 - (238 * Math.min(100, Math.max(0, focusScore))) / 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`glass-panel p-6 ${config.glowClass} relative overflow-hidden transition-all duration-500`}
    >
      {/* Background Subtle Gradient Aura */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Cognitive State Engine
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Award className="w-3.5 h-3.5 text-yellow-400" />
          <span>Confidence: <strong className="text-slate-200">{confidence.toFixed(0)}%</strong></span>
        </div>
      </div>

      {/* Main State Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 my-2 bg-slate-900/80 p-5 rounded-2xl border border-slate-800/80 shadow-2xl relative z-10">
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-2xl`}
            >
              <StateIcon className="w-9 h-9" />
            </motion.div>
          </AnimatePresence>

          <div>
            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.span
                  key={state}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -5, opacity: 0 }}
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold border shadow-lg ${config.badgeBg}`}
                >
                  {config.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="text-sm text-slate-300 mt-2 font-medium">
              {config.description}
            </p>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Active Window: <span className="text-indigo-300 font-semibold">{currentState?.active_app || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Animated Circular Gauge */}
        <div className="flex items-center gap-6">
          <div className="text-center relative">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="42"
                className="text-slate-800/80"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="42"
                stroke={config.strokeColor}
                strokeWidth="9"
                strokeDasharray={264}
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * focusScore) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                key={Math.round(focusScore)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black text-white leading-none tracking-tight font-mono"
              >
                {focusScore.toFixed(0)}
              </motion.span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Focus
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extraneous Load Bar & ML Probabilities */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {/* Extraneous Load Meter */}
        <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 shadow-inner">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Extraneous Cognitive Load
            </span>
            <span className="text-rose-300 font-bold font-mono">{loadScore.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, loadScore))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* ML Probabilities */}
        <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80 shadow-inner">
          <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> RF Classifier Probabilities
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
              <span className="text-slate-400 block text-[9px]">FOCUS</span>
              <span className="text-emerald-400 font-bold">
                {((probs.DEEP_FOCUS || 0) * 100).toFixed(0)}%
              </span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
              <span className="text-slate-400 block text-[9px]">ROUTINE</span>
              <span className="text-cyan-400 font-bold">
                {((probs.ROUTINE_WORK || 0) * 100).toFixed(0)}%
              </span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-950 p-1.5 rounded-lg text-center border border-slate-800">
              <span className="text-slate-400 block text-[9px]">IDLE</span>
              <span className="text-amber-400 font-bold">
                {((probs.IDLE || 0) * 100).toFixed(0)}%
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
