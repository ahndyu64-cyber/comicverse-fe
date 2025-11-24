'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuth } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from URL query params - check for both 'token' and 'accessToken'
        const token = searchParams?.get('token') || searchParams?.get('accessToken');
        const refreshToken = searchParams?.get('refreshToken');

        // If tokens are in query params, use them
        if (token && refreshToken) {
          // Store tokens in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);

          // Fetch user profile with the token
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/users/profile`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            }
          );

          if (response.ok) {
            const userData = await response.json();
            const user = userData.data || userData;

            // Create AuthResponse format
            const authResponse = {
              accessToken: token,
              refreshToken: refreshToken,
              user: {
                id: user._id || user.id,
                username: user.username,
                email: user.email,
                roles: user.roles || [user.role || 'user'],
                avatar: user.avatar,
              },
            };

            setAuth(authResponse);
            router.push('/');
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } else {
          throw new Error('No authentication tokens found in callback URL');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err?.message || 'Authentication failed');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?error=auth_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi xác thực</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="text-center">
        <div className="mb-4">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Đang xác thực...</h1>
        <p className="text-gray-600 dark:text-gray-400">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
}
