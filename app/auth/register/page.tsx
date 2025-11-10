"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { register } from "../../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

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
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
          {/* Left side - Hero Image */}
          <div className="relative hidden w-full max-w-md lg:block">
            <Image
              src="https://illustrations.popsy.co/purple/digital-nomad.svg"
              alt="Register illustration"
              width={500}
              height={500}
              priority
              className="drop-shadow-xl"
            />
          </div>

          {/* Right side - Registration Form */}
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/70 px-8 py-10 shadow-xl backdrop-blur-xl">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Tạo tài khoản mới</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Tham gia cộng đồng đọc truyện lớn nhất Việt Nam
                </p>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Tên người dùng
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Nhập tên của bạn"
                  />
                </div>

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

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Tôi đồng ý với <a href="#" className="text-blue-600 hover:text-blue-800">Điều khoản sử dụng</a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full transform rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
                >
                  Đăng ký
                </button>

                <p className="mt-4 text-center text-sm text-gray-600">
                  Đã có tài khoản?{" "}
                  <a
                    href="/auth/login"
                    className="font-medium text-blue-600 transition-colors hover:text-blue-800"
                  >
                    Đăng nhập ngay
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
