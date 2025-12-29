"use client";
import { useEffect, useState } from "react";
import { Comic, getFollowingComics } from "../../lib/api";
import ComicCard from "../../components/ComicCard";
import { useAuth } from "../../contexts/AuthContext";

export default function FollowingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Determine comics per page based on screen size
  const comicsPerPage = isMobile ? 10 : 30; // Mobile: 2 cols × 5 rows = 10, PC: 6 cols × 5 rows = 30

  // Check screen size on mount and on resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadFollowingComics = async () => {
    try {
      const userId = user?.id || (user as any)?._id;
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const data = await getFollowingComics(userId);
      setComics(data || []);
    } catch (err) {
      console.error("Error loading following comics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      loadFollowingComics();
    }
  }, [user?.id, authLoading]);

  // Listen for follow/unfollow events to refresh the list
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const handleFollowChange = () => {
      console.log('FollowingPage: Follow event detected, will refresh in 1000ms');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('FollowingPage: Executing refresh callback');
        loadFollowingComics();
      }, 1000);
    };

    console.log('FollowingPage: Setting up event listener for recentFollowingRefresh');
    window.addEventListener('recentFollowingRefresh', handleFollowChange);

    return () => {
      console.log('FollowingPage: Removing event listener');
      window.removeEventListener('recentFollowingRefresh', handleFollowChange);
      clearTimeout(debounceTimer);
    };
  }, []);

  if (loading || authLoading) {
    return <div className="p-8 text-neutral-900">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-full px-0 sm:px-2 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white pb-3 border-b-4 border-red-600 inline-block uppercase">Truyện đang theo dõi</h1>
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 text-center">
          <p className="mb-4 text-gray-600 dark:text-neutral-400">Bạn cần đăng nhập để xem truyện đã theo dõi</p>
          <a 
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full px-0 sm:px-2 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-white pb-3 border-b-4 border-red-600 inline-block uppercase">Truyện đang theo dõi</h1>
      
      {comics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 text-center">
          <p className="text-gray-600 dark:text-neutral-400">Bạn chưa theo dõi truyện nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
            {comics.slice((currentPage - 1) * comicsPerPage, currentPage * comicsPerPage).map((comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
          
          {Math.ceil(comics.length / comicsPerPage) > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(comics.length / comicsPerPage) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-full font-semibold transition-colors flex items-center justify-center ${
                      currentPage === page
                        ? 'bg-red-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const totalPages = Math.ceil(comics.length / comicsPerPage);
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={currentPage === Math.ceil(comics.length / comicsPerPage)}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}