import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Zap, Activity, Coffee, Terminal } from 'lucide-react';
import { setSimulatorMode } from '../services/api';

export default function SimulatorControls({ currentMode, onModeChanged }) {
  const modes = [
    {
      id: 'SIM_DEEP_FOCUS',
      label: 'Deep Focus Mode',
      icon: Zap,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30',
      activeBorder: 'border-emerald-500/80 ring-emerald-500/30',
      description: 'Simulates 280+ WPM typing, VS Code editor, zero distraction.'
    },
    {
      id: 'SIM_ROUTINE',
      label: 'Routine Work Mode',
      icon: Activity,
      color: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30',
      activeBorder: 'border-cyan-500/80 ring-cyan-500/30',
      description: 'Simulates rapid window switching, Slack messaging, browsing.'
    },
    {
      id: 'SIM_IDLE',
      label: 'Idle / Break Mode',
      icon: Coffee,
      color: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
      activeBorder: 'border-amber-500/80 ring-amber-500/30',
      description: 'Simulates away-from-keyboard state (triggers AI Digest).'
    },
    {
      id: 'REAL',
      label: 'Live Desktop Daemon',
      icon: Terminal,
      color: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30',
      activeBorder: 'border-purple-500/80 ring-purple-500/30',
      description: 'Captures real mouse & keyboard input via pynput daemon.'
    }
  ];

  const handleSelectMode = async (modeId) => {
    try {
      await setSimulatorMode(modeId);
      if (onModeChanged) onModeChanged(modeId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel p-5 relative z-10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Workload & Telemetry Live Simulator
          </h3>
        </div>
        <span className="text-xs text-indigo-300 font-mono bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30 shadow-sm">
          Active: <strong className="text-white">{currentMode}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;

          return (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectMode(m.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? `bg-slate-800/90 ${m.activeBorder} shadow-xl ring-2`
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isActive ? m.color : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="font-bold text-xs text-white mb-1">{m.label}</div>
                <div className="text-[11px] text-slate-400 leading-tight">{m.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
