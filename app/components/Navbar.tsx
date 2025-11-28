"use client";
import Link from "next/link";
import { useEffect, useRef, useState, forwardRef } from "react";
import { useRouter } from "next/navigation";
import SearchBox from "./SearchBox";

const MenuNavButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function MenuNavButton(
  { children, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={`w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-300 ${className ?? ""}`}
    >
      {children}
    </button>
  );
});
MenuNavButton.displayName = "MenuNavButton";

import { useAuth } from "../contexts/AuthContext";

const extractAvatarUrl = (avatarVal: any): string => {
  if (!avatarVal) return "";
  if (typeof avatarVal === "string") return avatarVal;
  if (typeof avatarVal === "object") {
    return avatarVal.secure_url || avatarVal.url || avatarVal.data?.secure_url || avatarVal.data?.url || "";
  }
  return "";
};

export default function Navbar() {
  const [dark, setDark] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>([]);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const genreMenuRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);

  const router = useRouter();
  const { user, logout } = useAuth();

  const [localUser, setLocalUser] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      setLocalUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setLocalUser(null);
    }
  }, []);

  useEffect(() => {
    if (user) setLocalUser(user);
    else setLocalUser(null);
  }, [user]);

  const effectiveUser = (user as any) || localUser;
  const avatarUrl = extractAvatarUrl((effectiveUser as any)?.avatar);

  useEffect(() => {
    async function fetchGenres() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
        const response = await fetch(`${API_BASE}/genres`);
        if (response.ok) {
          const data = await response.json();
          const genreList = data.data || data || [];
          setGenres(genreList);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" && localStorage.getItem("cv-dark");
    if (stored !== null) {
      setDark(stored === "1");
      document.documentElement.classList.toggle("dark", stored === "1");
    } else {
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsNavbarVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (genreMenuRef.current && e.target instanceof Node && !genreMenuRef.current.contains(e.target)) {
        setShowGenreMenu(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowMenu(false);
        setShowGenreMenu(false);
      }
    }

    if (showMenu || showGenreMenu) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMenu, showGenreMenu]);

  return (
    <nav
      className={`sticky top-0 z-50 w-full 
      bg-white dark:bg-black
      shadow-lg border-b border-gray-200 dark:border-gray-800 
      backdrop-blur transition-transform duration-300 
      ${isNavbarVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-block h-8 w-8 rounded-full bg-white/20" />
            <span className="text-lg font-extrabold text-black dark:text-white">Comicverse</span>
          </Link>

          <Link href="/comics" className="text-sm text-black/70 hover:text-black dark:text-white dark:hover:text-white transition-colors">
            Danh sách truyện
          </Link>

          {/* GENRE DROPDOWN */}
          <div className="relative" ref={genreMenuRef}>
            <button
              onClick={() => setShowGenreMenu((s) => !s)}
              className="flex items-center gap-2 text-sm text-black/70 hover:text-black dark:text-white dark:hover:text-white"
            >
              Thể loại
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${showGenreMenu ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {showGenreMenu && genres.length > 0 && (
              <div className="absolute left-0 top-full mt-2 max-h-96 w-48 overflow-y-auto rounded-md border bg-white p-2 shadow-lg dark:bg-neutral-900 z-50">
                {genres.map((genre) => (
                  <button
                    key={genre._id}
                    onClick={() => {
                      router.push(`/comics?genre=${encodeURIComponent(genre.name)}`);
                      setShowGenreMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AREA */}
        <div className="flex items-center gap-3">
          <SearchBox />

          {/* USER MENU */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/20 dark:hover:bg-white/20"
            >
              {effectiveUser ? (
                <>
                  {avatarUrl ? (
                    <img src={avatarUrl} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="h-8 w-8 flex items-center justify-center rounded-full bg-black/30 dark:bg-white/30 text-sm text-white">
                      {(effectiveUser.username || effectiveUser.userName || "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm text-black dark:text-white">
                    {effectiveUser.username || effectiveUser.userName}
                  </span>
                </>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-white" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white p-2 shadow-lg dark:bg-neutral-900">
                {!effectiveUser ? (
                  <>
                    <MenuNavButton ref={firstMenuItemRef} onClick={() => router.push("/auth/login")}>
                      Đăng nhập
                    </MenuNavButton>
                    <MenuNavButton onClick={() => router.push("/auth/register")}>Đăng ký</MenuNavButton>
                  </>
                ) : (
                  <>
                    <MenuNavButton ref={firstMenuItemRef} onClick={() => router.push("/profile")}>
                      Hồ sơ của tôi
                    </MenuNavButton>

                    <MenuNavButton onClick={() => router.push("/comics/following")}>
                      Truyện đã theo dõi
                    </MenuNavButton>

                    <button onClick={() => logout()} className="w-full text-left px-3 py-2 text-sm text-neutral-700">
                      Đăng xuất
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* DARK MODE TOGGLE */}
          <button
            onClick={toggle}
            className="rounded-md border border-black/30 dark:border-white/30 bg-black/20 dark:bg-white/20 p-2"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5a1 1 0 011 1V7a1 1 0 11-2 0V5.5a1 1 0 011-1zM12 17a5 5 0 100-10 5 5 0 000 10z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
