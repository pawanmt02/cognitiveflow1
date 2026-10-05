const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('cognitiveflow_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('cognitiveflow_token', token);
  } else {
    localStorage.removeItem('cognitiveflow_token');
  }
}

export function removeAuthToken() {
  localStorage.removeItem('cognitiveflow_token');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API calls
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function registerUser(email, password, fullName) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }
  const data = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      removeAuthToken();
      return null;
    }
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function saveUserSettings(settings) {
  const res = await fetch(`${API_BASE}/auth/settings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

// App REST API calls
export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchTelemetryHistory(limit = 40) {
  const res = await fetch(`${API_BASE}/telemetry/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch telemetry history');
  return res.json();
}

export async function sendNotification(notification) {
  const res = await fetch(`${API_BASE}/notifications/incoming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notification),
  });
  if (!res.ok) throw new Error('Failed to send notification');
  return res.json();
}

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function fetchDigests() {
  const res = await fetch(`${API_BASE}/digests`);
  if (!res.ok) throw new Error('Failed to fetch digests');
  return res.json();
}

export async function updateTaskContext(taskContext) {
  const res = await fetch(`${API_BASE}/task-context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskContext),
  });
  if (!res.ok) throw new Error('Failed to update task context');
  return res.json();
}

export async function setSimulatorMode(mode) {
  const res = await fetch(`${API_BASE}/simulator/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) throw new Error('Failed to set simulator mode');
  return res.json();
}

export function createWebSocket(onMessage, onOpen, onClose) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    if (onOpen) onOpen();
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (onMessage) onMessage(parsed);
    } catch (err) {
      console.error('WebSocket parse error:', err);
    }
  };

  ws.onclose = () => {
    if (onClose) onClose();
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  return ws;
}
