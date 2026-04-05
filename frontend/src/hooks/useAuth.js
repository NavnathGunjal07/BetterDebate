import { useState, useCallback } from 'react';
import client from '../api/client';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('bd_token'));
  const [name, setName] = useState(() => localStorage.getItem('bd_name'));
  const [userId, setUserId] = useState(() => {
    const id = localStorage.getItem('bd_userId');
    return id ? Number(id) : null;
  });

  const login = useCallback(async (name, passkey) => {
    const res = await client.post('/auth/login', { name, passkey });
    const { token, name: userName, userId } = res.data;
    localStorage.setItem('bd_token', token);
    localStorage.setItem('bd_name', userName);
    localStorage.setItem('bd_userId', String(userId));
    setToken(token);
    setName(userName);
    setUserId(userId);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bd_token');
    localStorage.removeItem('bd_name');
    localStorage.removeItem('bd_userId');
    setToken(null);
    setName(null);
    setUserId(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, name, userId, isAuthenticated, login, logout };
}
