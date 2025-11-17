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
        // Normalize user shape so `role` is always a string (supports `roles` array)
        const normalize = (u: any) => {
          if (!u) return u;
          let roleFromRolesArray: any = undefined;
          if (Array.isArray(u.roles) && u.roles.length > 0) {
            const first = u.roles[0];
            if (typeof first === 'string') roleFromRolesArray = first;
            else if (first && typeof first === 'object') roleFromRolesArray = first.name || first.role || first.value || undefined;
          }
          const roleFromRolesString = typeof u.roles === 'string' ? u.roles : undefined;
          const role = u.role || roleFromRolesArray || roleFromRolesString || 'user';
          return { ...u, role };
        };

        const normalizedRaw = normalize(userData_data);
        // Ensure `id` is always set (prefer `_id` for some backends)
        const id = (userData_data && (userData_data._id || userData_data.id)) || (normalizedRaw && (normalizedRaw._id || normalizedRaw.id));
        const normalized = { ...normalizedRaw, id };
        setUser(normalized);
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(normalized));
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

    // If we have a stored user and token, restore them; refresh token is optional.
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        // Ensure role normalization on load from localStorage
        let roleFromRolesArray: any = undefined;
        if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
          const first = parsed.roles[0];
          if (typeof first === 'string') roleFromRolesArray = first;
          else if (first && typeof first === 'object') roleFromRolesArray = first.name || first.role || first.value || undefined;
        }
        const roleFromRolesString = typeof parsed.roles === 'string' ? parsed.roles : undefined;
        const role = parsed.role || roleFromRolesArray || roleFromRolesString || 'user';
        // normalize id if backend uses _id
        const id = parsed?.id || parsed?._id || undefined;
        setUser({ ...parsed, role, id });
      } catch (e) {
        setUser(JSON.parse(storedUser));
      }
      setToken(storedToken);
      // Only set `refreshToken` if present
      if (storedRefreshToken) setRefreshToken(storedRefreshToken);

      // If we have a refreshToken, attempt to get the freshest user data.
      if (storedRefreshToken) {
        refreshUserData(storedToken);
      } else {
        // No refresh token; we still restored `user` & `token` from localStorage
        // but avoid calling refreshUserData so we don't trip over missing credentials.
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (response: AuthResponse) => {
    // Normalize incoming user shape to ensure `role` is set
    const parsedUser: any = response.user || {};
    let roleFromRolesArray: any = undefined;
    if (Array.isArray(parsedUser.roles) && parsedUser.roles.length > 0) {
      const first = parsedUser.roles[0];
      if (typeof first === 'string') roleFromRolesArray = first;
      else if (first && typeof first === 'object') roleFromRolesArray = first.name || first.role || first.value || undefined;
    }
    const roleFromRolesString = typeof parsedUser.roles === 'string' ? parsedUser.roles : undefined;
    const role = parsedUser.role || roleFromRolesArray || roleFromRolesString || 'user';
    const id = parsedUser?.id || parsedUser?._id || undefined;
    const normalizedUser = { ...parsedUser, role, id };
    setUser(normalizedUser);
    setToken(response.accessToken);
    setRefreshToken(response.refreshToken);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    // Refresh user data from server to get latest avatar and info
    refreshUserData(response.accessToken);
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