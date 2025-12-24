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

  // Function to check if token is expired
  const isTokenExpired = (jwtToken: string): boolean => {
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) return true;
      
      const decoded = JSON.parse(atob(parts[1]));
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      return currentTime > expirationTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  const refreshUserData = async (authToken: string): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/users/profile`, {
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
    }
  };

  useEffect(() => {
    // Load auth state from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');

    // If we have a stored user and token, restore them; refresh token is optional.
    if (storedUser && storedToken) {
      // Check if token is expired
      if (isTokenExpired(storedToken)) {
        // Token is expired, clear all auth data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsLoading(false);
        return;
      }

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

      // Always attempt to refresh user data to ensure it's fresh
      // This helps with persistence across page reloads
      refreshUserData(storedToken).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (isTokenExpired(token)) {
        console.warn('Token has expired, logging out...');
        const logout = () => {
          setUser(null);
          setToken(null);
          setRefreshToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        };
        logout();
      }
    };

    // Check token expiration every 60 seconds
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token]);

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