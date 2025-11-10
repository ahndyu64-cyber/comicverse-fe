'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse } from '../lib/auth';

type User = {
  id?: string;
  username?: string;
  email?: string;
  roles?: string[];
  role?: string; // some backends use `role` instead of `roles`
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
    }
  }, []);

  const login = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.accessToken);
    setRefreshToken(response.refreshToken);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  };

  const isAdmin = () => {
    if (!user) return false;
    if (Array.isArray(user.roles)) return user.roles.includes('admin');
    if (typeof user.roles === 'string') return user.roles === 'admin';
    if (typeof user.role === 'string') return user.role === 'admin';
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};