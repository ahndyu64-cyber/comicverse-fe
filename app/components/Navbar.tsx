"use client";
import Link from "next/link";
import { useEffect, useRef, useState, forwardRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchBox from "./SearchBox";
import Logo from "./Logo";

// Small focusable menu button that forwards ref to the underlying button element
const MenuNavButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }>(function MenuNavButton(
  { children, className, icon, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={`w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-white flex items-center gap-2 ${className ?? ""}`}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
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
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [genres, setGenres] = useState<Array<{ _id: string; name: string }>>([]);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement | null>(null);
  const genreMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const genreMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { user, logout, isAdmin, refreshUser } = useAuth();
  // read localStorage only after mount to avoid hydration mismatch
  const [localUser, setLocalUser] = useState<any | null>(null);
  
  const effectiveUser = (user as any) || localUser;
  const avatarUrl = extractAvatarUrl((effectiveUser as any)?.avatar);
  
  useEffect(() => {
    console.log('Avatar URL updated:', avatarUrl);
    console.log('Effective user:', effectiveUser);
  }, [avatarUrl]);

  // Memoize userId to ensure stable dependency - must come before useEffects that use it
  const userId = useMemo(() => {
    return effectiveUser ? ((effectiveUser as any)._id || (effectiveUser as any).id) : null;
  }, [effectiveUser]);

  // Refresh user data whenever user changes to get latest avatar
  useEffect(() => {
    if (user && refreshUser) {
      refreshUser();
    }
  }, [user, refreshUser]);

  // Initialize readNotificationIds from localStorage (per user)
  useEffect(() => {
    if (typeof window !== 'undefined' && effectiveUser) {
      const userIdLocal = (effectiveUser as any)._id || (effectiveUser as any).id;
      if (!userIdLocal) return;
      
      const key = `readNotifications_${userIdLocal}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const ids = JSON.parse(stored);
          setReadNotificationIds(new Set(ids));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [userId]);

  // Save readNotificationIds to localStorage whenever it changes (per user)
  useEffect(() => {
    if (typeof window !== 'undefined' && effectiveUser) {
      const userIdLocal = (effectiveUser as any)._id || (effectiveUser as any).id;
      if (!userIdLocal) return;
      
      const key = `readNotifications_${userIdLocal}`;
      localStorage.setItem(key, JSON.stringify(Array.from(readNotificationIds)));
    }
  }, [readNotificationIds, userId]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      setLocalUser(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setLocalUser(null);
    }
  }, []);

  // Update localUser when user from AuthContext changes
  useEffect(() => {
    if (user) {
      setLocalUser(user);
    } else {
      setLocalUser(null);
    }
  }, [user]);

  // Fetch notifications for logged-in user
  useEffect(() => {
    if (!userId) return;

    const abortController = new AbortController();

    const fetchNotifications = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // Fetch followed comics to check for new chapters
        const followingResponse = await fetch(`${API_BASE}/users/${userId}/following`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          signal: abortController.signal,
        });
        
        if (!followingResponse.ok) {
          // Silently handle errors - don't log network failures during redirect
          if (followingResponse.status !== 401) {
            console.debug('Failed to fetch following comics:', followingResponse.status);
          }
          return;
        }
        
        const followingData = await followingResponse.json();
        // Handle various response formats
        let followedComics = followingData.data || followingData.items || followingData || [];
        if (!Array.isArray(followedComics)) {
          followedComics = [];
        }
        
        // Check for recent updates (within last 24 hours)
        const recentUpdates = followedComics.filter((comic: any) => {
          if (!comic) return false;
          
          // Get the most recent chapter date
          let lastUpdateTime = null;
          
          if (comic.chapters && Array.isArray(comic.chapters) && comic.chapters.length > 0) {
            const lastChapter = comic.chapters[comic.chapters.length - 1];
            lastUpdateTime = new Date(lastChapter.createdAt || lastChapter.date || 0);
          } else if (comic.updatedAt) {
            lastUpdateTime = new Date(comic.updatedAt);
          } else if (comic.createdAt) {
            lastUpdateTime = new Date(comic.createdAt);
          }
          
          if (!lastUpdateTime) return false;
          
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return lastUpdateTime > dayAgo;
        });
        
        setNotifications(recentUpdates);
        
        // Update read notification IDs using functional updates
        // This avoids creating a dependency on readNotificationIds in the effect
        setReadNotificationIds((currentReadIds) => {
          const newReadIds = new Set(currentReadIds);
          let hasChanges = false;
          
          recentUpdates.forEach((comic: any) => {
            // If this comic is in recent updates and was marked as read,
            // it means there's a new update, so remove it from read set
            if (newReadIds.has(comic._id)) {
              newReadIds.delete(comic._id);
              hasChanges = true;
            }
          });
          
          return hasChanges ? newReadIds : currentReadIds;
        });
      } catch (error: any) {
        // Silently ignore abort errors - they're expected during cleanup
        if (error.name === 'AbortError') {
          return;
        }
        // Silently ignore network errors to avoid console spam
        console.debug('Error fetching notifications:', error.message);
      }
    };

    fetchNotifications();
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    
    // Listen for follow/unfollow events to refresh notifications
    const handleFollowChange = () => {
      fetchNotifications();
    };
    
    window.addEventListener('recentFollowingRefresh', handleFollowChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('recentFollowingRefresh', handleFollowChange);
      abortController.abort();
    };
  }, [userId]);

  // Update unread count when readNotificationIds changes
  useEffect(() => {
    const unreadNotifications = notifications.filter(
      (comic: any) => !readNotificationIds.has(comic._id)
    );
    setUnreadCount(unreadNotifications.length);
  }, [readNotificationIds, notifications]);

  // Handle marking a notification as read
  const handleNotificationClick = (comicId: string) => {
    // Mark as read
    setReadNotificationIds((prev) => new Set([...prev, comicId]));
    
    // Navigate to comic
    router.push(`/comics/${comicId}`);
    setShowNotifications(false);
  };

  // Fetch genres on mount
  useEffect(() => {
    async function fetchGenres() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
        const response = await fetch(`${API_BASE}/genres`);
        if (response.ok) {
          const data = await response.json();
          const genreList = data.data || data || [];
          setGenres(genreList);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
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

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down and not at top
        setIsNavbarVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsNavbarVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close menu on outside click or Escape; focus first item when opened
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (!genreMenuRef.current) return;
      if (e.target instanceof Node && !genreMenuRef.current.contains(e.target)) {
        setShowGenreMenu(false);
      }
      if (!notificationsRef.current) return;
      if (e.target instanceof Node && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowMenu(false);
        setShowGenreMenu(false);
        setShowNotifications(false);
      }
    }

    if (showMenu || showGenreMenu || showNotifications) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
      // focus the first focusable menu item
      if (showMenu) {
        setTimeout(() => firstMenuItemRef.current?.focus(), 0);
      }
    }

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [showMenu, showGenreMenu, showNotifications]);



  return (
    <nav className={`sticky top-0 z-50 w-full bg-white dark:bg-black shadow-lg border-b border-gray-200 dark:border-neutral-800 backdrop-blur transition-transform duration-300 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="flex w-full items-center justify-between gap-4 px-0 py-0">
        <div className="flex items-center gap-4">
          <Logo />
          {/* Desktop: Show list and genres */}
          <Link href="/comics" className="hidden md:block text-base text-black/70 hover:text-black dark:text-white dark:hover:text-white transition-colors uppercase">
            Danh sách
          </Link>
          
          {/* Desktop: Genre Dropdown */}
          <div 
            className="relative hidden md:block" 
            ref={genreMenuRef}
            onMouseEnter={() => {
              if (genreMenuTimeoutRef.current) {
                clearTimeout(genreMenuTimeoutRef.current);
              }
              setShowGenreMenu(true);
            }}
            onMouseLeave={() => {
              genreMenuTimeoutRef.current = setTimeout(() => {
                setShowGenreMenu(false);
              }, 150);
            }}
          >
            <button
              onClick={() => setShowGenreMenu((s) => !s)}
              className="flex items-center gap-2 text-base text-black/70 hover:text-black dark:text-white dark:hover:text-white transition-colors uppercase"
              aria-haspopup="true"
              aria-expanded={showGenreMenu}
            >
              Thể loại
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transition-transform duration-300"
                style={{
                  transform: showGenreMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showGenreMenu && genres.length > 0 && (
              <div
                role="menu"
                aria-label="Genres menu"
                className="absolute left-0 top-full mt-2 rounded-md border bg-white dark:!bg-neutral-900 border-neutral-200 dark:border-neutral-800 p-4 shadow-lg z-50 pointer-events-auto"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.ceil(genres.length / 10)}, minmax(200px, auto))`,
                  gap: '0.5rem',
                  backgroundColor: dark ? '#171717' : 'white'
                }}
              >
                {genres.map((genre, idx) => (
                  <button
                    key={genre._id}
                    onClick={() => {
                      router.push(`/comics?genre=${encodeURIComponent(genre.name)}`);
                      setShowGenreMenu(false);
                    }}
                    className="text-left px-3 py-2 text-sm text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors border border-neutral-200 dark:border-neutral-700"
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search: show icon by default, reveal input when active */}
          <SearchBox />
          
          {/* Notification Button - only show for logged-in users */}
          {effectiveUser && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative rounded px-2 py-1 hover:bg-white/20 dark:hover:bg-white/20 transition-colors"
                aria-label="Notifications"
                aria-haspopup="true"
                aria-expanded={showNotifications}
                title={unreadCount > 0 ? `${unreadCount} truyện mới` : 'Không có thông báo'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-black dark:text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  role="menu"
                  aria-label="Notifications menu"
                  className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-md border bg-white p-2 shadow-lg dark:bg-neutral-900 dark:border-neutral-800 z-50 dark:text-white"
                  style={{
                    backgroundColor: dark ? '#171717' : 'white',
                    borderColor: dark ? '#27272a' : 'rgb(229, 231, 235)',
                    color: dark ? 'white' : 'black'
                  }}
                >
                  {notifications.length > 0 ? (
                    <>
                      {notifications.map((comic: any) => {
                        // Get the latest chapter info
                        let latestChapter = null;
                        if (comic.chapters && Array.isArray(comic.chapters) && comic.chapters.length > 0) {
                          latestChapter = comic.chapters[comic.chapters.length - 1];
                        }
                        
                        return (
                          <button
                            key={comic._id}
                            onClick={() => handleNotificationClick(comic._id)}
                            className={`w-full text-left px-3 py-3 rounded transition-colors border-b dark:border-neutral-700 last:border-b-0 ${
                              readNotificationIds.has(comic._id)
                                ? 'opacity-60 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex gap-2">
                              {comic.cover && (
                                <img
                                  src={comic.cover}
                                  alt={comic.title}
                                  className="h-14 w-10 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                                  {comic.title}
                                </p>
                                {latestChapter && (
                                  <>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mt-1">
                                      Cập nhật: {latestChapter.title || `Chapter ${latestChapter.chapterNumber || ''}`}
                                    </p>
                                    {latestChapter.date && (
                                      <p className="text-xs text-neutral-500 dark:text-neutral-200 mt-1">
                                        {new Date(latestChapter.date).toLocaleDateString('vi-VN', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                    </>
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-neutral-600 dark:text-neutral-300">
                      Không có thông báo mới
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/20 dark:hover:bg-white/20 transition-colors"
              aria-haspopup="true"
              aria-expanded={showMenu}
            >
              {effectiveUser ? (
                <>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={effectiveUser.username || effectiveUser.userName}
                      className="h-10 w-10 rounded-full border-2 border-red-600 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-red-600 bg-black/30 dark:bg-white/30 text-sm font-semibold text-black dark:text-white">
                      {(effectiveUser.username || effectiveUser.userName || "?")?.slice(0,1).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden sm:inline text-base text-black dark:text-white">{effectiveUser.username || effectiveUser.userName}</span>
                </>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
              )}
            </button>

            {showMenu && (
              <div
                role="menu"
                aria-label="Site menu"
                className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-white p-2 shadow-lg dark:bg-neutral-900 dark:border-neutral-800"
                style={{
                  backgroundColor: dark ? '#171717' : 'white',
                  borderColor: dark ? '#27272a' : 'rgb(229, 231, 235)'
                }}
              >
                {!effectiveUser ? (
                  <>
                    <MenuNavButton
                      ref={firstMenuItemRef}
                      onClick={() => { router.push("/auth/login"); setShowMenu(false); }}
                    >
                      Đăng nhập
                    </MenuNavButton>
                    <MenuNavButton 
                      onClick={() => { router.push("/auth/register"); setShowMenu(false); }}
                    >
                      Đăng ký
                    </MenuNavButton>
                  </>
                ) : (
                  <>
                    {/* Mobile: Show list and genres in user menu */}
                    <div className="md:hidden border-b border-neutral-200 dark:border-neutral-700">
                      <MenuNavButton
                        ref={firstMenuItemRef}
                        onClick={() => { router.push("/comics"); setShowMenu(false); }}
                        className="border-b border-neutral-200 dark:border-neutral-700"
                      >
                        Danh sách
                      </MenuNavButton>
                      
                      <MenuNavButton
                        onClick={() => { router.push("/comics?openGenres=true"); setShowMenu(false); }}
                      >
                        Thể loại
                      </MenuNavButton>
                    </div>

                    {/* Authenticated user menu items */}
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
                                    <MenuNavButton 
                                      onClick={() => { router.push("/admin/users"); setShowMenu(false); }} 
                                      className="border-b border-neutral-200 dark:border-neutral-700"
                                    >
                                      Quản lý người dùng
                                    </MenuNavButton>
                                  );
                                }
                              })()}
                              <MenuNavButton 
                                onClick={() => { router.push("/admin/comics"); setShowMenu(false); }} 
                                className="border-b border-neutral-200 dark:border-neutral-700"
                              >
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
                      className="border-b border-neutral-200 dark:border-neutral-700"
                    >
                      Hồ sơ của tôi
                    </MenuNavButton>
                    <MenuNavButton 
                      onClick={() => { router.push("/comics/following"); setShowMenu(false); }} 
                      className="border-b border-neutral-200 dark:border-neutral-700"
                    >
                      Truyện đã theo dõi
                    </MenuNavButton>
                    {/* Mobile: Dark mode toggle in menu */}
                    <button
                      onClick={() => { toggle(); setShowMenu(false); }}
                      className="md:hidden w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between"
                    >
                      <span>{dark ? "Light mode" : "Dark mode"}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        {dark ? (
                          // Sun icon
                          <circle cx="12" cy="12" r="5" />
                        ) : (
                          // Moon icon
                          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => { logout(); setShowMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                    >
                      Đăng xuất
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Desktop: Dark mode toggle */}
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            title={dark ? "Light mode" : "Dark mode"}
            className="hidden md:flex relative inline-flex items-center h-10 w-20 rounded-full transition-colors hover:opacity-90 overflow-hidden bg-neutral-300 dark:bg-neutral-700"
          >
            {/* Animated circle slider */}
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                dark ? 'translate-x-10' : 'translate-x-1'
              }`}
            >
            {!dark ? (
                // Sun icon for light mode (off state)
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-yellow-500">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              ) : (
                // Moon icon for dark mode (on state)
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-400">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
