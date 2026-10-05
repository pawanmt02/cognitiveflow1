import React, { useState, useEffect } from 'react';
import { Target, Save, Tag } from 'lucide-react';
import { updateTaskContext } from '../services/api';

export default function TaskContextEditor({ taskContext, onTaskContextUpdated }) {
  const [activeTask, setActiveTask] = useState('');
  const [projectName, setProjectName] = useState('');
  const [keyTermsStr, setKeyTermsStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (taskContext) {
      setActiveTask(taskContext.active_task || '');
      setProjectName(taskContext.project_name || '');
      setKeyTermsStr((taskContext.key_terms || []).join(', '));
    }
  }, [taskContext]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const termsArray = keyTermsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await updateTaskContext({
        active_task: activeTask,
        project_name: projectName,
        key_terms: termsArray
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onTaskContextUpdated) onTaskContextUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Active Task RAG Context
          </h3>
        </div>
        {saveSuccess && (
          <span className="text-xs text-emerald-400 font-semibold animate-pulse">
            ✓ Context Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Current Active Task Description
          </label>
          <input
            type="text"
            value={activeTask}
            onChange={(e) => setActiveTask(e.target.value)}
            className="w-full bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            placeholder="e.g. Building Cognitive Flow Orchestrator FastAPI & RAG engine"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Cognitiveflow"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Key Focus Terms (Comma Separated)
            </label>
            <input
              type="text"
              value={keyTermsStr}
              onChange={(e) => setKeyTermsStr(e.target.value)}
              className="w-full bg-slate-900 text-xs p-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
              placeholder="FastAPI, pynput, scikit-learn, RAG"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" /> Save Context
          </button>
        </div>
      </form>
    </div>
  );
}
