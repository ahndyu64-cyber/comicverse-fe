"use client";
import { useEffect, useState } from "react";
import { Comic, getFollowingComics } from "../../lib/api";
import ComicCard from "../../components/ComicCard";
import { useAuth } from "../../contexts/AuthContext";

export default function FollowingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Truyện đang theo dõi</h1>
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Truyện đang theo dõi</h1>
      
      {comics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 text-center">
          <p className="text-gray-600 dark:text-neutral-400">Bạn chưa theo dõi truyện nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {comics.map((comic) => (
            <ComicCard key={comic._id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}