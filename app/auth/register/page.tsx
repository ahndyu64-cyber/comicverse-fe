"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return alert("Mật khẩu không khớp");
    try {
      await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000") + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      router.push("/auth/login");
    } catch (err) {
      console.error(err);
      alert("Đăng ký thất bại");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Đăng ký</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tên người dùng" className="rounded border px-3 py-2" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded border px-3 py-2" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mật khẩu" type="password" className="rounded border px-3 py-2" />
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Xác nhận mật khẩu" type="password" className="rounded border px-3 py-2" />
        <div className="flex gap-2">
          <button className="rounded bg-green-600 px-4 py-2 text-white">Đăng ký</button>
        </div>
      </form>
    </div>
  );
}
