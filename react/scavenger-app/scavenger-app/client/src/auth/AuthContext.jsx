import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const Ctx = createContext(null);

function getToken(key) {
  const v = localStorage.getItem(key);
  try { return v ? JSON.parse(v) : null; } catch { return v; }
}
function setToken(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function clearAllTokens() {
  localStorage.removeItem('admin:jwt');
  localStorage.removeItem('user:jwt');
  localStorage.removeItem('token');
}
function pickTokenForMe() {
  return getToken('admin:jwt') || getToken('user:jwt') || getToken('token');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false); // <-- NEW
  const navigate = useNavigate();

  // boot: validate any stored token
  useEffect(() => {
    const tok = pickTokenForMe();
    if (!tok) { setIsReady(true); return; } // nothing to validate
    api.get('/auth/me', { headers: { Authorization: `Bearer ${tok}` } })
      .then(res => { setUser(res.data?.user || null); setIsReady(true); })
      .catch(() => { clearAllTokens(); setUser(null); setIsReady(true); });
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data || {};
    if (!token || !u) throw new Error('Invalid login response');
    if (u.role === 'admin') setToken('admin:jwt', token);
    else setToken('user:jwt', token);
    setToken('token', token);
    setUser(u);
    navigate(u.role === 'admin' ? '/admin' : '/');
  };

  const signup = async (email, password, name, country, intake, complete) => {
    const res = await api.post('/auth/signup', { email, password, name, country, intake, complete });
    const { token, user: u } = res.data || {};
    if (!token || !u) throw new Error('Invalid signup response');
    setToken('user:jwt', token);
    setToken('token', token);
    setUser(u);
    navigate('/');
  };

  const logout = () => {
    clearAllTokens();
    setUser(null);
    navigate('/login');
  };

  return (
    <Ctx.Provider value={{
      user,
      role: user?.role || null,
      isAuthed: !!user,
      isReady,                 // <-- EXPOSE THIS
      login, signup, logout
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider/>');
  return ctx;
}
