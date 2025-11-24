"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

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
        throw new Error(data.message || "Không thể gửi email đặt lại mật khẩu");
      }

      setSuccess("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hòm thư của bạn.");
      setEmail("");
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Left side - Hero Image */}
          <div className="relative hidden w-full max-w-md lg:block">
            <Image
              src="https://illustrations.popsy.co/purple/secure-login.svg"
              alt="Forgot password illustration"
              width={500}
              height={500}
              priority
              className="drop-shadow-xl"
            />
          </div>

          {/* Right side - Form */}
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/70 px-8 py-10 shadow-xl backdrop-blur-xl">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Quên mật khẩu?</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="username@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full transform rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Đang gửi..." : "Gửi hướng dẫn"}
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Nhớ mật khẩu rồi?{" "}
                  <a
                    href="/auth/login"
                    className="font-medium text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Quay lại đăng nhập
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
