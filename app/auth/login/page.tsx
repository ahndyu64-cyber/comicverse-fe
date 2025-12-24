"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../../lib/auth";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login: setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      // Lưu thông tin đăng nhập vào auth context
      setAuth(response);
      router.push("/");
    } catch (err: any) {
      console.error('Login error:', err);
      // Prefer server-provided message when available
      setError(err?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      // Initiate Google OAuth flow
      const redirectUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/auth/google`;
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError("Không thể đăng nhập bằng Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 bg-clip-text text-transparent mb-2">ComicVerse</h1>
          <h2 className="text-2xl font-bold text-black dark:text-white">Chào mừng trở lại!</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-white">
            Đăng nhập để tiếp tục đọc truyện yêu thích
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-black/10 px-8 py-10 shadow-2xl">
          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/20 dark:bg-red-950/30 border border-red-500/50 dark:border-red-900/50 p-4 text-sm text-red-200 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black dark:text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 px-4 py-3 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-gray-600 backdrop-blur-sm"
                placeholder="username@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black dark:text-white mb-2">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 px-4 py-3 pr-10 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-gray-600 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-700 dark:text-white hover:text-black dark:hover:text-white transition-colors">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 text-blue-500 focus:ring-blue-400"
                />
                Ghi nhớ đăng nhập
              </label>
              <a
                href="/auth/forgot-password"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-black px-2 text-slate-600 dark:text-white">Hoặc tiếp tục với</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 hover:bg-white/20 dark:hover:bg-white/10 px-4 py-3 text-sm font-medium text-black dark:text-white transition-all hover:border-white/40 dark:hover:border-black/20 focus:ring-2 focus:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? "Đang xử lý..." : "Đăng nhập bằng Google"}
            </button>

            <p className="text-center text-sm text-slate-700 dark:text-white">
              Chưa có tài khoản?{" "}
              <a
                href="/auth/register"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Đăng ký ngay
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
