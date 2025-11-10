"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

  // Search toggle (icon -> show input)
  function Search() {
    const [visible, setVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (visible) inputRef.current?.focus();
    }, [visible]);

    return visible ? (
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          className="rounded-md border px-3 py-1 text-sm outline-none dark:bg-neutral-900"
          placeholder="Tìm kiếm truyện..."
        />
        <button
          onClick={() => setVisible(false)}
          aria-label="Close search"
          className="ml-2 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ) : (
      <button
        onClick={() => setVisible(true)}
        aria-label="Open search"
        title="Tìm kiếm"
        className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </button>
    );
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-neutral-900/80 shadow-sm border-b border-transparent backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600" />
            <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">Comicverse</span>
          </Link>
          <Link href="/comics" className="text-sm text-neutral-600 hover:text-sky-600 dark:text-neutral-300 dark:hover:text-sky-400">
            Danh sách truyện
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Search: show icon by default, reveal input when active */}
          {/** searchVisible controls whether the input is shown */}
          <Search />
          <Link href="/auth/login" className="text-sm text-neutral-600 dark:text-neutral-300">
            Đăng nhập
          </Link>
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            title={dark ? "Light mode" : "Dark mode"}
            className="rounded-md border p-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center"
          >
            {dark ? (
              // Sun icon (light mode)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-yellow-400">
                <path d="M12 4.5a1 1 0 011 1V7a1 1 0 11-2 0V5.5a1 1 0 011-1zM12 17a5 5 0 100-10 5 5 0 000 10zm7-5a1 1 0 011 1h1.5a1 1 0 110 2H20a1 1 0 01-1-1 1 1 0 011-1zM4 12a1 1 0 011-1H6.5a1 1 0 110 2H5a1 1 0 01-1-1zM18.364 6.636a1 1 0 011.414 0l1.06 1.06a1 1 0 11-1.414 1.414l-1.06-1.06a1 1 0 010-1.414zM6.636 17.364a1 1 0 011.414 0l1.06 1.06a1 1 0 11-1.414 1.414l-1.06-1.06a1 1 0 010-1.414zM18.364 17.364a1 1 0 010 1.414l-1.06 1.06a1 1 0 11-1.414-1.414l1.06-1.06a1 1 0 011.414 0zM6.636 6.636a1 1 0 010 1.414L5.576 9.11A1 1 0 114.162 7.696l1.06-1.06a1 1 0 011.414 0z" />
              </svg>
            ) : (
              // Moon icon (dark mode)
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-neutral-700 dark:text-neutral-200">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
