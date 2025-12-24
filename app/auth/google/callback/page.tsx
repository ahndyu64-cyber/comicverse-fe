'use client';

// This page is handled by middleware in middleware.ts
// When user clicks Google login, they are redirected here by Google OAuth
// The middleware intercepts this, stores tokens in cookies, and redirects to home page
// The user will never see this page - it's completely transparent

export default function GoogleCallbackPage() {
  // Middleware handles the redirect before this component renders
  return null;
}
