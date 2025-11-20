'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: setAuth } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from URL query params or from the API response
        const token = searchParams?.get('token');
        const refreshToken = searchParams?.get('refreshToken');

        // If tokens are in query params, use them
        if (token && refreshToken) {
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
          // If no tokens in params, the backend might have set them in cookies
          // Try to fetch the profile directly
          const profileResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/users/profile`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            const user = userData.data || userData;

            // Check if we can get tokens from response headers or local storage
            const token = localStorage.getItem('token');
            const refreshToken = localStorage.getItem('refreshToken');

            if (token && refreshToken) {
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
              throw new Error('No authentication tokens found');
            }
          } else {
            throw new Error('Failed to fetch user profile');
          }
        }
      } catch (err: any) {
        console.error('Google callback error:', err);
        setError(err?.message || 'Authentication failed');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?error=google_auth_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi xác thực</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="mb-4">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Đang xác thực...</h1>
        <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
}
