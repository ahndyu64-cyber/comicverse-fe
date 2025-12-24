import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Intercept Google OAuth callback
  if (pathname === '/auth/google/callback') {
    const token = request.nextUrl.searchParams.get('token') || 
                  request.nextUrl.searchParams.get('accessToken');
    const refreshToken = request.nextUrl.searchParams.get('refreshToken');

    if (token && refreshToken) {
      // Create response that redirects to home
      const response = NextResponse.redirect(new URL('/', request.url));
      
      // Set tokens in cookies (will be read by AuthContext on home page)
      response.cookies.set('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      response.cookies.set('refreshToken', refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      console.log('[Middleware] Google callback intercepted, redirecting to home with tokens');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/google/callback'],
};
