"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("cv-dark");
    if (stored !== null) {
      setDark(stored === "1");
      document.documentElement.classList.toggle("dark", stored === "1");
    } else {
      // follow system
      const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(prefers);
      document.documentElement.classList.toggle("dark", prefers);
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cv-dark", next ? "1" : "0");
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/80 px-4 py-3 backdrop-blur dark:bg-black/80 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold">
            Comicverse
          </Link>
          <Link href="/comics" className="text-sm text-neutral-600 dark:text-neutral-300">
            Danh sách truyện
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="rounded-md border px-3 py-1 text-sm outline-none dark:bg-neutral-900"
            placeholder="Tìm kiếm truyện..."
          />
          <Link href="/auth/login" className="text-sm text-neutral-600 dark:text-neutral-300">
            Đăng nhập
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="rounded-md border px-3 py-1 text-sm"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
}
