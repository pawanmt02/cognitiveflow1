import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { LineChart as ChartIcon, Keyboard, MousePointer } from 'lucide-react';

export default function TelemetryCharts({ historyData }) {
  const formattedData = (historyData || []).map((item, idx) => {
    const d = new Date((item.timestamp || Date.now() / 1000) * 1000);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      focusScore: Math.round(item.focus_score || 0),
      extraneousLoad: Math.round(item.extraneous_load || 0),
      kpm: Math.round(item.keystrokes_per_min || 0),
      mouseDist: Math.round((item.mouse_distance_px_min || 0) / 50),
      appSwitches: Math.round((item.app_switches_per_min || 0))
    };
  });

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Real-Time Sensory Telemetry & Cognitive Load
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" /> KPM (Keystrokes/min)
          </span>
          <span className="flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> Mouse Movement
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="focusScore"
                name="Focus Score (0-100)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="extraneousLoad"
                name="Extraneous Load (%)"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="kpm"
                name="Keystroke Cadence"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Waiting for telemetry stream...
          </div>
        )}
      </div>
    </div>
  );
}
