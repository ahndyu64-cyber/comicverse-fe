export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
};

import { API_BASE } from './api';

export async function login(data: LoginData) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  // If the response is not OK, try to extract the server-provided error message
  if (!response.ok) {
    let message = `Login failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && (body.message || body.error)) {
        message = body.message || body.error;
      } else {
        // If body is JSON but doesn't have message, stringify it for debugging
        message = JSON.stringify(body);
      }
    } catch (jsonErr) {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch (_) {
        // ignore
      }
    }
    console.error('Auth login error:', { status: response.status, message });
    throw new Error(message);
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(data: RegisterData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * Check if a user has admin or uploader role
 * Handles multiple formats: role as string, roles as array, roles as objects
 */
export function hasAdminOrModeratorRole(user: any): boolean {
  if (!user) return false;

  // Check single role field (string)
  if (typeof user.role === 'string') {
    const roleStr = user.role.toLowerCase();
    if (roleStr === 'admin' || roleStr === 'uploader') return true;
  }

  // Check roles field - could be string or array
  if (user.roles) {
    // If roles is a string
    if (typeof user.roles === 'string') {
      const roleStr = user.roles.toLowerCase();
      if (roleStr === 'admin' || roleStr === 'uploader') return true;
    }

    // If roles is an array
    if (Array.isArray(user.roles)) {
      for (const role of user.roles) {
        // Handle role as string
        if (typeof role === 'string') {
          const roleStr = role.toLowerCase();
          if (roleStr === 'admin' || roleStr === 'uploader') return true;
        }
        // Handle role as object with name or role property
        if (typeof role === 'object' && role !== null) {
          const roleStr = (role.name || role.role || '').toLowerCase();
          if (roleStr === 'admin' || roleStr === 'uploader') return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a user has admin role only
 */
export function hasAdminRole(user: any): boolean {
  if (!user) return false;

  // Check single role field (string)
  if (typeof user.role === 'string') {
    return user.role.toLowerCase() === 'admin';
  }

  // Check roles field - could be string or array
  if (user.roles) {
    // If roles is a string
    if (typeof user.roles === 'string') {
      return user.roles.toLowerCase() === 'admin';
    }

    // If roles is an array
    if (Array.isArray(user.roles)) {
      for (const role of user.roles) {
        // Handle role as string
        if (typeof role === 'string' && role.toLowerCase() === 'admin') {
          return true;
        }
        // Handle role as object with name or role property
        if (typeof role === 'object' && role !== null) {
          const roleStr = (role.name || role.role || '').toLowerCase();
          if (roleStr === 'admin') return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a user can manage (edit/delete) a specific comic
 * - Admins can manage all comics
 * - Uploaders can only manage comics they created
 */
export function canManageComic(user: any, comic: any): boolean {
  if (!user || !comic) return false;

  // Admins can manage all comics
  if (hasAdminRole(user)) return true;

  // Uploaders can only manage comics they created
  if (hasAdminOrModeratorRole(user)) {
    const userIdRaw = user._id || user.id || (user as any)?.userId;

    const extractCreatorRaw = (c: any) => {
      if (!c) return null;
      const candidates = [
        c.createdBy,
        c.createdById,
        c.creator,
        c.owner,
        c.user,
        c.created_by,
      ];

      for (const cand of candidates) {
        if (!cand) continue;
        // If it's an array, take first element
        if (Array.isArray(cand) && cand.length > 0) return cand[0];
        return cand;
      }

      return null;
    };

    const normalizeId = (v: any) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      if (typeof v === 'object') {
        // if nested like { user: { _id: '...' } }
        if ((v as any).user) {
          const u = (v as any).user;
          if (u._id) return String(u._id);
          if (u.id) return String(u.id);
        }
        // common shapes: { _id: '...', id: '...' } or mongoose ObjectId
        if ((v as any)._id) return String((v as any)._id);
        if ((v as any).id) return String((v as any).id);
        if (typeof v.toString === 'function') return v.toString();
      }
      return null;
    };

    const comicCreatorRaw = extractCreatorRaw(comic);
    const comicCreatorId = normalizeId(comicCreatorRaw);
    const userId = normalizeId(userIdRaw);

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[auth] canManageComic ids:', { userIdRaw, comicCreatorRaw, userId, comicCreatorId });
    }

    return !!userId && !!comicCreatorId && String(userId) === String(comicCreatorId);
  }

  return false;
}