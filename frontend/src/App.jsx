import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CognitiveStateGauge from './components/CognitiveStateGauge';
import TelemetryCharts from './components/TelemetryCharts';
import NotificationStream from './components/NotificationStream';
import DigestViewer from './components/DigestViewer';
import TaskContextEditor from './components/TaskContextEditor';
import SimulatorControls from './components/SimulatorControls';
import AnimatedBackground from './components/AnimatedBackground';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import {
  fetchStatus,
  fetchTelemetryHistory,
  fetchNotifications,
  fetchDigests,
  fetchCurrentUser,
  removeAuthToken,
  createWebSocket
} from './services/api';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentState, setCurrentState] = useState(null);
  const [simulatorMode, setSimulatorModeState] = useState('SIM_DEEP_FOCUS');
  const [taskContext, setTaskContextState] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [digests, setDigests] = useState([]);

  // Auth & Settings state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load initial user & app snapshot
  const loadSnapshot = async () => {
    try {
      // Check user session
      const user = await fetchCurrentUser();
      if (user) setCurrentUser(user);

      const statusData = await fetchStatus();
      setCurrentState(statusData.current_state);
      setSimulatorModeState(statusData.simulator_mode);
      setTaskContextState(statusData.active_task_context);

      const history = await fetchTelemetryHistory(40);
      setTelemetryHistory(history);

      const notifs = await fetchNotifications();
      setNotifications(notifs);

      const digList = await fetchDigests();
      setDigests(digList);
    } catch (err) {
      console.error('Error loading snapshot:', err);
    }
  };

  useEffect(() => {
    loadSnapshot();

    const ws = createWebSocket(
      (msg) => {
        setIsConnected(true);
        if (msg.type === 'INITIAL_STATE') {
          setCurrentState(msg.data.current_state);
          setSimulatorModeState(msg.data.simulator_mode);
          setTaskContextState(msg.data.task_context);
        } else if (msg.type === 'TELEMETRY_UPDATE') {
          setCurrentState(msg.data);
          setTelemetryHistory((prev) => [...prev.slice(-39), msg.data]);
        } else if (msg.type === 'NOTIFICATION_RECEIVED') {
          setNotifications((prev) => [msg.data, ...prev.slice(0, 49)]);
        } else if (msg.type === 'DIGEST_CREATED') {
          setDigests((prev) => [msg.data, ...prev.slice(0, 19)]);
          fetchNotifications().then(setNotifications).catch(console.error);
        } else if (msg.type === 'TASK_CONTEXT_UPDATED') {
          setTaskContextState(msg.data);
        } else if (msg.type === 'SIMULATOR_MODE_CHANGED') {
          setSimulatorModeState(msg.mode);
        }
      },
      () => setIsConnected(true),
      () => setIsConnected(false)
    );

    return () => {
      ws.close();
    };
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto relative z-10">
      {/* Dynamic Animated Canvas Background */}
      <AnimatedBackground cognitiveState={currentState?.cognitive_state} />

      {/* Header Bar */}
      <Header
        isConnected={isConnected}
        taskContext={taskContext}
        user={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Workload Simulator Controls */}
      <div className="mb-6">
        <SimulatorControls
          currentMode={simulatorMode}
          onModeChanged={(mode) => setSimulatorModeState(mode)}
        />
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <CognitiveStateGauge currentState={currentState} />
          <TelemetryCharts historyData={telemetryHistory} />
          <TaskContextEditor
            taskContext={taskContext}
            onTaskContextUpdated={loadSnapshot}
          />
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <NotificationStream
            notifications={notifications}
            onNotificationSent={loadSnapshot}
          />
          <DigestViewer digests={digests} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(userData) => {
          setCurrentUser(userData);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={currentUser}
        onSettingsSaved={(newSettings) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, settings: newSettings });
          }
        }}
      />

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-900/80 font-mono relative z-10">
        Cognitive Flow-State Orchestrator • Unstop HackNowa 2026 • Local Privacy-First Desktop Agent
      </footer>
    </div>
  );
}
