"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      await register({ 
        username, 
        email, 
        password,
        confirmPassword: confirm // Thêm confirmPassword vào request
      });
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 bg-clip-text text-transparent mb-2">ComicVerse</h1>
          <h2 className="text-2xl font-bold text-black dark:text-white">Tạo tài khoản mới</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-white">
            Tham gia cộng đồng đọc truyện lớn nhất Việt Nam
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-black/10 px-8 py-10 shadow-2xl">
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/20 dark:bg-red-950/30 border border-red-500/50 dark:border-red-900/50 p-4 text-sm text-red-200 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-black dark:text-white mb-2">
                Tên người dùng
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 px-4 py-3 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-white/5 backdrop-blur-sm"
                placeholder="Nhập tên của bạn"
              />
            </div>

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
                className="w-full rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 px-4 py-3 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-white/5 backdrop-blur-sm"
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
                  className="w-full rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 px-4 py-3 pr-10 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-white/5 backdrop-blur-sm"
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

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-black dark:text-white mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 px-4 py-3 pr-10 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-white/5 backdrop-blur-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  title={showConfirm ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showConfirm ? (
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

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 mt-1 rounded bg-white/10 dark:bg-white/5 border border-white/20 dark:border-black/10 text-blue-500 focus:ring-blue-400 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-slate-700 dark:text-white leading-relaxed">
                Tôi đồng ý với <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Điều khoản sử dụng</a> và <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Chính sách bảo mật</a>
              </label>
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
                  Đang đăng ký...
                </span>
              ) : (
                "Đăng ký"
              )}
            </button>

            <p className="text-center text-sm text-slate-700 dark:text-white">
              Đã có tài khoản?{" "}
              <a
                href="/auth/login"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Đăng nhập ngay
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
