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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

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