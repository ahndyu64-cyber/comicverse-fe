"use client";
import Link from "next/link";
import { useEffect, useRef, useState, forwardRef } from "react";
import { useRouter } from "next/navigation";

// Small focusable menu button that forwards ref to the underlying button element
const MenuNavButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function MenuNavButton(
  { children, className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={`w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 ${className ?? ""}`}
    >
      {children}
    </button>
  );
});
MenuNavButton.displayName = "MenuNavButton";
import { useAuth } from "../contexts/AuthContext";

// Helper to extract avatar URL from various response formats
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  // read localStorage only after mount to avoid hydration mismatch
  const [localUser, setLocalUser] = useState<any | null>(null);
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      setLocalUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setLocalUser(null);
    }
  }, []);

  const effectiveUser = (user as any) || localUser;
  const avatarUrl = extractAvatarUrl((effectiveUser as any)?.avatar);

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

  // Close menu on outside click or Escape; focus first item when opened
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowMenu(false);
    }

    if (showMenu) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      // focus the first focusable menu item
      setTimeout(() => firstMenuItemRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMenu]);

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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-haspopup="true"
              aria-expanded={showMenu}
            >
              {effectiveUser ? (
                <>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={effectiveUser.username || effectiveUser.userName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white">
                      {(effectiveUser.username || effectiveUser.userName || "?")?.slice(0,1).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm text-neutral-700 dark:text-neutral-300">{effectiveUser.username || effectiveUser.userName}</span>
                </>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-700 dark:text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {showMenu && (
              <div
                role="menu"
                aria-label="Site menu"
                className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white p-2 shadow-lg dark:bg-neutral-900"
              >
                {!effectiveUser ? (
                  <>
                    <MenuNavButton
                      ref={firstMenuItemRef}
                      onClick={() => { router.push("/auth/login"); setShowMenu(false); }}
                    >
                      Đăng nhập
                    </MenuNavButton>
                    <MenuNavButton onClick={() => { router.push("/auth/register"); setShowMenu(false); }}>Đăng ký</MenuNavButton>
                  </>
                ) : (
                  <>
                    {/* show admin/uploader links if user has permission */}
                    {(() => {
                      const u = effectiveUser as any;
                      function hasAdminOrUploaderRole(x: any) {
                        if (!x) return false;
                        // roles as array - elements may be strings or objects
                        if (Array.isArray(x.roles)) {
                          for (const el of x.roles) {
                            if (!el) continue;
                            if (typeof el === "string" && (el.toLowerCase().includes("admin") || el.toLowerCase().includes("uploader"))) return true;
                            if (typeof el === "object") {
                              if ((el.name === "admin" || el.name === "uploader" || el.role === "admin" || el.role === "uploader")) return true;
                              if (typeof el.name === "string" && (el.name.toLowerCase().includes("admin") || el.name.toLowerCase().includes("uploader"))) return true;
                            }
                          }
                        }
                        // roles as string
                        if (typeof x.roles === "string" && (x.roles.toLowerCase().includes("admin") || x.roles.toLowerCase().includes("uploader"))) return true;
                        // single role field
                        if (typeof x.role === "string" && (x.role.toLowerCase().includes("admin") || x.role.toLowerCase().includes("uploader"))) return true;
                        return false;
                      }

                      try {
                        if (hasAdminOrUploaderRole(u)) {
                          return (
                            <>
                              {/* Only show user management to admins */}
                              {(() => {
                                function isAdminUser(x: any) {
                                  if (!x) return false;
                                  if (Array.isArray(x.roles)) {
                                    for (const el of x.roles) {
                                      if (!el) continue;
                                      if (typeof el === "string" && el.toLowerCase().includes("admin")) return true;
                                      if (typeof el === "object") {
                                        if (el.name === "admin" || el.role === "admin") return true;
                                        if (typeof el.name === "string" && el.name.toLowerCase().includes("admin")) return true;
                                      }
                                    }
                                  }
                                  if (typeof x.roles === "string" && x.roles.toLowerCase().includes("admin")) return true;
                                  if (typeof x.role === "string" && x.role.toLowerCase().includes("admin")) return true;
                                  if (typeof x.username === "string" && x.username.toLowerCase().includes("admin")) return true;
                                  if (typeof x.email === "string" && x.email.toLowerCase().includes("admin")) return true;
                                  return false;
                                }
                                
                                if (isAdminUser(u)) {
                                  return (
                                    <MenuNavButton onClick={() => { router.push("/admin/users"); setShowMenu(false); }}>
                                      Quản lý người dùng
                                    </MenuNavButton>
                                  );
                                }
                              })()}
                              <MenuNavButton onClick={() => { router.push("/admin/comics"); setShowMenu(false); }}>
                                Quản lý truyện
                              </MenuNavButton>
                            </>
                          );
                        }
                      } catch (e) {
                        // ignore
                      }
                      return null;
                    })()}
                    <MenuNavButton
                      ref={firstMenuItemRef}
                      onClick={() => { router.push("/profile"); setShowMenu(false); }}
                    >
                      Hồ sơ của tôi
                    </MenuNavButton>
                    <MenuNavButton onClick={() => { router.push("/comics/following"); setShowMenu(false); }}>Truyện đã theo dõi</MenuNavButton>
                    <button
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300"
                    >
                      Đăng xuất
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
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
