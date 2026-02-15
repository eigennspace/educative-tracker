const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ACCESS_TOKEN_KEY = 'educative_tracker_access_token';
const REFRESH_TOKEN_KEY = 'educative_tracker_refresh_token';
const USER_KEY = 'educative_tracker_user';
const authSubscribers = new Set();

let accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || import.meta.env.VITE_ACCESS_TOKEN || '';
let refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || '';
let currentUser = (() => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
})();

function notifyAuthSubscribers() {
  const snapshot = getAuthSnapshot();
  authSubscribers.forEach((handler) => handler(snapshot));
}

export function subscribeAuth(handler) {
  authSubscribers.add(handler);
  return () => {
    authSubscribers.delete(handler);
  };
}

export function setAuthTokens(tokens) {
  accessToken = tokens?.accessToken || '';
  refreshToken = tokens?.refreshToken || '';

  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearAuthTokens() {
  setAuthTokens({ accessToken: '', refreshToken: '' });
}

export function setAuthUser(user) {
  currentUser = user || null;
  if (currentUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  notifyAuthSubscribers();
}

export function clearAuthSession() {
  clearAuthTokens();
  setAuthUser(null);
}

export function getAuthSnapshot() {
  return {
    accessToken,
    refreshToken,
    user: currentUser
  };
}

async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data?.tokens?.accessToken) {
    clearAuthSession();
    throw new Error(payload?.error || 'Authentication required');
  }

  setAuthTokens(payload.data.tokens);
  if (payload?.data?.user) {
    setAuthUser(payload.data.user);
  }
}

async function request(path, options = {}, retryOnAuthFail = true) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401 && retryOnAuthFail && path !== '/auth/refresh') {
    try {
      await refreshAccessToken();
      return request(path, options, false);
    } catch {
      clearAuthSession();
      throw new Error('Authentication required');
    }
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { error: text } : null;
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  return data?.data ?? null;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  register: async (body) => {
    const data = await request('/auth/register', { method: 'POST', body: JSON.stringify(body) }, false);
    if (data?.tokens) {
      setAuthTokens(data.tokens);
    }
    if (data?.user) {
      setAuthUser(data.user);
    }
    return data;
  },
  login: async (body) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(body) }, false);
    if (data?.tokens) {
      setAuthTokens(data.tokens);
    }
    if (data?.user) {
      setAuthUser(data.user);
    }
    return data;
  },
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }, false),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }, false),
  refreshSession: async () => {
    const data = await request('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }, false);
    if (data?.tokens) {
      setAuthTokens(data.tokens);
    }
    if (data?.user) {
      setAuthUser(data.user);
    }
    return data;
  }
};
