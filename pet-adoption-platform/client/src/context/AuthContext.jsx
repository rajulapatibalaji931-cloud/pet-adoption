import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pawbridge_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('pawbridge_token')));
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('pawbridge_token')) {
      setUnreadNotifications(0);
      return;
    }
    try {
      const { data } = await api.get('/notifications?limit=1');
      setUnreadNotifications(data.unreadCount || 0);
    } catch {
      // ignore background badge failure
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('pawbridge_token');
    if (!token) {
      setUser(null);
      setNgo(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setNgo(data.ngo || null);
      localStorage.setItem('pawbridge_user', JSON.stringify(data.user));
      await refreshUnreadCount();
    } catch {
      localStorage.removeItem('pawbridge_token');
      localStorage.removeItem('pawbridge_user');
      setUser(null);
      setNgo(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setNgo(null);
      setUnreadNotifications(0);
    };
    window.addEventListener('pawbridge:session-expired', handleSessionExpired);
    return () => window.removeEventListener('pawbridge:session-expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('pawbridge_token', data.token);
    localStorage.setItem('pawbridge_user', JSON.stringify(data.user));
    if (data.user?.role === 'adopter') {
      localStorage.setItem('pawbridge_last_adopter_email', data.user.email);
    }
    setUser(data.user);
    setNgo(data.ngo || null);
    await refreshUnreadCount();
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('pawbridge_token', data.token);
    localStorage.setItem('pawbridge_user', JSON.stringify(data.user));
    if (data.user?.role === 'adopter') {
      localStorage.setItem('pawbridge_last_adopter_email', data.user.email);
    }
    setUser(data.user);
    setNgo(data.ngo || null);
    await refreshUnreadCount();
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // proceed with local cleanup
    }
    localStorage.removeItem('pawbridge_token');
    localStorage.removeItem('pawbridge_user');
    setUser(null);
    setNgo(null);
    setUnreadNotifications(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ngo,
        loading,
        isAuthenticated: Boolean(user),
        unreadNotifications,
        setUnreadNotifications,
        refreshUnreadCount,
        refreshUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
