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
  isLoading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        const userData_data = userData.data || userData;
        setUser(userData_data);
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(userData_data));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    if (storedUser && storedToken && storedRefreshToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      
      // Refresh user data from server to get latest role/permissions
      refreshUserData(storedToken);
    } else {
      setIsLoading(false);
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

  const refreshUser = async () => {
    if (!token) return;
    await refreshUserData(token);
  };

  const isAdmin = () => {
    if (!user) return false;
    if (Array.isArray(user.roles)) return user.roles.includes('admin');
    if (typeof user.roles === 'string') return user.roles === 'admin';
    if (typeof user.role === 'string') return user.role === 'admin';
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, isLoading, login, logout, refreshUser, isAdmin }}>
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