import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Save, Sliders, Cpu, BellRing, Volume2, Check } from 'lucide-react';
import { saveUserSettings } from '../services/api';

export default function SettingsModal({ isOpen, onClose, user, onSettingsSaved }) {
  const [focusThreshold, setFocusThreshold] = useState(user?.settings?.focus_threshold || 75);
  const [ollamaModel, setOllamaModel] = useState(user?.settings?.ollama_model || 'llama3:8b');
  const [autoDigest, setAutoDigest] = useState(user?.settings?.auto_digest ?? true);
  const [soundAlerts, setSoundAlerts] = useState(user?.settings?.sound_alerts ?? false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newSettings = {
        focus_threshold: focusThreshold,
        ollama_model: ollamaModel,
        auto_digest: autoDigest,
        sound_alerts: soundAlerts
      };
      await saveUserSettings(newSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      if (onSettingsSaved) onSettingsSaved(newSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
          className="glass-card w-full max-w-lg p-6 relative border border-indigo-500/30 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Agent & User Preferences</h2>
              <p className="text-xs text-slate-400">Customize focus thresholds and local LLM options.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Focus Sensitivity Slider */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Deep Focus Interception Threshold
                </span>
                <span className="font-bold font-mono text-indigo-300 text-sm">{focusThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={focusThreshold}
                onChange={(e) => setFocusThreshold(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>50% (Strict)</span>
                <span>75% (Balanced)</span>
                <span>90% (Ultra Focus)</span>
              </div>
            </div>

            {/* Local LLM Selector */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5 block">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Local Ollama RAG Model
              </label>
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full bg-slate-950 text-xs p-2.5 rounded-lg border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="llama3:8b">Llama 3 8B (Recommended)</option>
                <option value="mistral:7b">Mistral 7B Instruct</option>
                <option value="phi3:mini">Phi-3 Mini (Ultra Fast)</option>
                <option value="gemma:7b">Gemma 7B (Google DeepMind)</option>
              </select>
            </div>

            {/* Auto-Digest Switch */}
            <div className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Auto AI Digest on State Shift</span>
                  <span className="text-[11px] text-slate-400">Summarize notifications when leaving Deep Focus</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoDigest}
                onChange={(e) => setAutoDigest(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Sound Alerts Switch */}
            <div className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-semibold text-slate-200 block">Audible Urgent Notifications</span>
                  <span className="text-[11px] text-slate-400">Play subtle chime for P0 urgent alerts</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {success ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Preferences Saved!
                </span>
              ) : <span />}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Preferences
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
