"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingCode, setIsGettingCode] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !code || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường!");
      return;
    }

    if (code.length !== 8) {
      setError("Mã xác thực phải có đúng 8 ký tự!");
      return;
    }

    if (newPassword.length < 4) {
      setError("Mật khẩu phải có ít nhất 4 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token: code, password: newPassword, confirmPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể đặt lại mật khẩu");
      }

      setSuccess("Mật khẩu đã được đặt lại thành công!");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGetCode() {
    if (!email) {
      setError("Vui lòng nhập email trước!");
      return;
    }

    setError("");
    setSuccess("");
    setIsGettingCode(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Không thể gửi mã xác thực");
      }

      setSuccess("Mã xác thực đã được gửi về email của bạn!");
      setCodeTimer(60);

      // Countdown timer
      const timer = setInterval(() => {
        setCodeTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsGettingCode(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 bg-clip-text text-transparent mb-2">ComicVerse</h1>
          <h2 className="text-2xl font-bold text-black dark:text-white">Quên mật khẩu?</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-white">
            Nhập email, mã xác thực và mật khẩu mới để đặt lại mật khẩu
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-black/10 px-8 py-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-600/40 dark:bg-red-600/50 border border-red-500 dark:border-red-500 p-4 text-sm text-red-900 dark:text-red-50 font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-500/20 dark:bg-green-950/30 border border-green-500/50 dark:border-green-900/50 p-4 text-sm text-green-200 dark:text-green-300">
                {success}
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
              <label htmlFor="code" className="block text-sm font-medium text-black dark:text-white mb-2">
                Mã xác thực
              </label>
              <div className="relative flex items-center">
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full rounded-lg bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 px-4 py-3 pr-28 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-gray-600 backdrop-blur-sm"
                  placeholder="Nhập mã xác thực từ email"
                />
                <button
                  type="button"
                  onClick={handleGetCode}
                  disabled={isGettingCode || codeTimer > 0}
                  className="absolute right-2 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed rounded transition-colors whitespace-nowrap"
                >
                  {codeTimer > 0 ? `${codeTimer}s` : "Lấy mã"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-black dark:text-white mb-2">
                Mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black dark:text-white mb-2">
                Nhập lại mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 px-4 py-3 pr-10 text-black dark:text-white placeholder-slate-600 dark:placeholder-slate-400 transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:bg-white/20 dark:focus:bg-gray-600 backdrop-blur-sm"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 px-4 py-3 font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-700 dark:text-white">
              Nhớ mật khẩu rồi?{" "}
              <a
                href="/auth/login"
                className="font-medium text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700 dark:hover:text-blue-300"
              >
                Quay lại đăng nhập
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
