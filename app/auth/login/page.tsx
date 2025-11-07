"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // NOTE: backend auth endpoint is assumed at POST /auth/login
    try {
      await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000") + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Đăng nhập thất bại (đã log lỗi)");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Đăng nhập</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded border px-3 py-2" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" type="password" className="rounded border px-3 py-2" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" /> Ghi nhớ
          </label>
          <a href="#" className="text-blue-600">Quên mật khẩu</a>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 text-white">Đăng nhập</button>
          <a href="/auth/register" className="ml-auto self-center text-sm text-blue-600">Đăng ký</a>
        </div>
      </form>
    </div>
  );
}
