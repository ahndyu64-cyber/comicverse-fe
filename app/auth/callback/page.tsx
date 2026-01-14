'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export const dynamic = 'force-dynamic';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let setAuth: any = null;
  try {
    const auth = useAuth();
    setAuth = auth?.login;
  } catch (e) {
    // Auth context may not be available during prerender
  }
  const [error, setError] = useState<string>('');
  const hasHandledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate handling
    if (hasHandledRef.current) return;
    hasHandledRef.current = true;

    const handleCallback = async () => {
      try {
        const token = searchParams?.get('token') || searchParams?.get('accessToken');
        const refreshToken = searchParams?.get('refreshToken');
        const userParam = searchParams?.get('user');

        if (token && refreshToken && userParam) {
          // Store tokens
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);

          // Parse user data từ URL param
          const user = JSON.parse(decodeURIComponent(userParam));

          const authResponse = {
            accessToken: token,
            refreshToken: refreshToken,
            user: user,
          };

          setAuth(authResponse);
          router.push('/');
        } else {
          throw new Error('No authentication tokens found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err?.message || 'Authentication failed');
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
