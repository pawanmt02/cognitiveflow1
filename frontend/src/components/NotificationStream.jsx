import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Send, Bell, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { sendNotification } from '../services/api';

export default function NotificationStream({ notifications, onNotificationSent }) {
  const [sender, setSender] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sourceApp, setSourceApp] = useState('Slack');
  const [sending, setSending] = useState(false);

  const handleCustomSend = async (e) => {
    e.preventDefault();
    if (!sender || !title || !body) return;
    setSending(true);
    try {
      await sendNotification({ sender, title, body, source_app: sourceApp });
      setSender('');
      setTitle('');
      setBody('');
      if (onNotificationSent) onNotificationSent();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const triggerPreset = async (preset) => {
    setSending(true);
    try {
      await sendNotification(preset);
      if (onNotificationSent) onNotificationSent();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const presets = [
    {
      label: '⚡ Urgent: Build Failure',
      sender: 'GitHub Actions / CI',
      title: 'Build Failed on main branch',
      body: 'Critical syntax error in FastAPI WebSocket handler. Build #402 failed.',
      source_app: 'GitHub'
    },
    {
      label: '💬 Routine Slack Chat',
      sender: 'Alex (UI Dev)',
      title: 'Lunch options?',
      body: 'Hey! Are we ordering pizza today or hitting the cafeteria?',
      source_app: 'Slack'
    },
    {
      label: '📅 Routine Calendar Alert',
      sender: 'Google Calendar',
      title: 'Reminder: Weekly Sync in 30 mins',
      body: 'Team sync scheduled at 4:00 PM in Conference Room B.',
      source_app: 'Calendar'
    },
    {
      label: '🚨 Critical Prod Alert',
      sender: 'PagerDuty',
      title: 'CRITICAL: Database High Load Outage',
      body: 'Prod DB CPU usage exceeded 98%. Immediate action required.',
      source_app: 'PagerDuty'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-5 flex flex-col h-full relative z-10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Intelligent Notification Proxy
          </h3>
        </div>
        <span className="text-xs text-indigo-300 font-mono bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
          RAG Triage Filter
        </span>
      </div>

      {/* Preset Action Triggers */}
      <div className="mb-4 bg-slate-900/70 p-3 rounded-xl border border-slate-800 shadow-inner">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Simulate Message Stream:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={sending}
              onClick={() => triggerPreset(p)}
              className="text-left text-xs p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-all font-medium truncate shadow-sm"
            >
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Animated Live Notification Stream */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-96 pr-1">
        <AnimatePresence initial={false}>
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => {
              const isIntercepted = n.is_intercepted === 1;
              const isUrgent = n.is_urgent === 1;
              const timestampStr = new Date((n.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <motion.div
                  key={n.id || Math.random()}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, type: 'spring' }}
                  className={`p-3.5 rounded-xl border transition-all shadow-lg ${
                    isIntercepted
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-amber-950/20'
                      : isUrgent
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-rose-950/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{n.sender}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-[10px] font-mono text-slate-400">
                        {n.source_app}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{timestampStr}</span>
                  </div>

                  <div className="font-semibold text-xs text-white mb-0.5">{n.title}</div>
                  <div className="text-xs text-slate-300 font-normal line-clamp-2 mb-2">{n.body}</div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {isIntercepted ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="text-amber-300 font-semibold">INTERCEPTED & SUPPRESSED</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-semibold">PASSED THROUGH</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Relevance: {((n.relevance_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-slate-500 text-xs font-mono">
              No notifications processed yet. Trigger a sample above.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Form */}
      <form onSubmit={handleCustomSend} className="mt-4 pt-3 border-t border-slate-800 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Sender"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            className="col-span-1 bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-white"
          />
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-2 bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-white"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Message body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-white"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={sending}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
