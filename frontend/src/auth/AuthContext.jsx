import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearAuthSession, getAuthSnapshot, subscribeAuth } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function hydrateSession() {
      const snapshot = getAuthSnapshot();

      if (!snapshot.refreshToken) {
        setUser(snapshot.user || null);
        setInitializing(false);
        return;
      }

      try {
        const data = await api.refreshSession();
        setUser(data?.user || null);
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setInitializing(false);
      }
    }

    hydrateSession();
  }, []);

  useEffect(() => {
    return subscribeAuth((snapshot) => {
      setUser(snapshot.user || null);
    });
  }, []);

  const login = useCallback(async (payload) => {
    const data = await api.login(payload);
    setUser(data?.user || null);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    setUser(data?.user || null);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    initializing,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout
  }), [user, initializing, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
