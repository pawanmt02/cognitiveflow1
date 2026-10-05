import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, FileText, CheckCircle } from 'lucide-react';

export default function DigestViewer({ digests }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-panel p-5 flex flex-col h-full relative z-10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Synthesized AI Digests
          </h3>
        </div>
        <span className="text-xs text-purple-300 font-semibold bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30 shadow-sm">
          Focus Transition Summaries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-96 pr-1">
        <AnimatePresence initial={false}>
          {digests && digests.length > 0 ? (
            digests.map((d) => {
              const timeStr = new Date((d.timestamp || Date.now() / 1000) * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <motion.div
                  key={d.id || Math.random()}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, type: 'spring' }}
                  className="bg-slate-900/90 p-4 rounded-xl border border-purple-500/30 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between text-xs mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-200">
                        State Shift → <span className="text-purple-300 font-mono">{d.trigger_state}</span>
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{timeStr}</span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/90 p-3 rounded-xl border border-slate-800 shadow-inner relative z-10">
                    {d.summary}
                  </div>

                  <div className="mt-2.5 text-[10px] text-slate-400 flex justify-between font-mono relative z-10">
                    <span>Batch Count: <strong className="text-purple-300">{d.notification_count} items</strong></span>
                    <span>RAG Engine: Local Ollama / AI Fallback</span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-slate-500 text-xs font-mono">
              No digests compiled yet. Transition state from Deep Focus to Routine Work to generate a digest batch.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
