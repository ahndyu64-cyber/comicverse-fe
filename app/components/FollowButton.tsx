'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { followComic, unfollowComic, getFollowingComics, getComicFollowersCount } from '../lib/api';

type FollowButtonProps = {
  comicId: string;
  initialFollows?: number;
  onFollowChange?: (isFollowing: boolean, followCount: number) => void;
};

export default function FollowButton({ comicId, initialFollows = 0, onFollowChange }: FollowButtonProps) {
  const { user, token } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(initialFollows);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is following this comic and fetch followers count on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      const userId = (user && ((user as any).id || (user as any)._id)) as string | undefined;
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      try {
        // Always fetch the current followers count from API
        const response = await getComicFollowersCount(comicId);
        const count = Math.max(0, response?.followersCount || response?.count || response || 0);
        setFollowCount(count);
        console.log('[FollowButton] Fetched followers count:', count);

        // Only check follow status if user is logged in
        if (!userId || (!token && !storedToken)) {
          setIsCheckingStatus(false);
          return;
        }

        const followingComics = await getFollowingComics(userId || '');
        const isUserFollowing = followingComics?.some((comic: any) => comic._id === comicId);
        setIsFollowing(isUserFollowing || false);
      } catch (err) {
        console.error('Error checking follow status:', err);
        // Fallback to initialFollows if API fails
        setFollowCount(Math.max(0, initialFollows || 0));
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [comicId, initialFollows, token, user?.id]);

  const handleFollow = async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userId = (user && ((user as any).id || (user as any)._id)) as string | undefined;
    if (!user || (!token && !storedToken) || !userId) {
      setError('Bạn cần đăng nhập để theo dõi truyện');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        await unfollowComic(comicId);
      } else {
        await followComic(comicId);
      }

      // Refetch the follow status to ensure accuracy
      let newFollowingStatus = !isFollowing;
      try {
        const followingComics = await getFollowingComics(userId || '');
        const isUserFollowing = followingComics?.some((comic: any) => comic._id === comicId);
        newFollowingStatus = isUserFollowing || false;
        setIsFollowing(newFollowingStatus);
      } catch (err) {
        console.error('Error refetching follow status:', err);
        // If refetch fails, just toggle the state optimistically
        newFollowingStatus = !isFollowing;
        setIsFollowing(newFollowingStatus);
      }

      // Fetch updated followers count from API
      try {
        const response = await getComicFollowersCount(comicId);
        console.log('[FollowButton] API response:', response);
        
        // Handle different response formats
        let count = 0;
        if (typeof response === 'number') {
          count = response;
        } else if (response?.followersCount !== undefined) {
          count = response.followersCount;
        } else if (response?.count !== undefined) {
          count = response.count;
        } else if (response?.data?.followersCount !== undefined) {
          count = response.data.followersCount;
        }
        
        count = Math.max(0, count || 0);
        setFollowCount(count);
        console.log('[FollowButton] Updated followers count:', count);
      } catch (err) {
        console.warn('[FollowButton] Error fetching followers count, using optimistic update:', err);
        // Optimistic update if API fails
        setFollowCount(prev => newFollowingStatus ? Math.max(prev + 1, 1) : Math.max(0, prev - 1));
      }

      // Only dispatch event for pages that are actually mounted and listening
      // To prevent unnecessary page reloads
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        console.log('[FollowButton] Current path:', currentPath);
        
        // Dispatch event for homepage to update both RecentFollowing and HotComicsList
        if (currentPath === '/') {
          console.log('[FollowButton] Dispatching events for homepage');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('recentFollowingRefresh'));
            window.dispatchEvent(new CustomEvent('hotComicsRefresh'));
          }, 100);
        }
        // Dispatch event for following page
        else if (currentPath === '/comics/following') {
          console.log('[FollowButton] Dispatching event for following page');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('recentFollowingRefresh'));
          }, 100);
        }
        // Dispatch event for comics list page - ONLY for /comics, NOT for /comics/[id]
        else if (currentPath === '/comics') {
          console.log('[FollowButton] Dispatching event from comics list page');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('comicsListFollowEvent'));
          }, 100);
        }
        // Do NOT dispatch events from comic detail pages (/comics/[id]) to prevent unwanted refreshes
      }


    } catch (err) {
      setError(isFollowing ? 'Không thể bỏ theo dõi' : 'Không thể theo dõi truyện');
      console.error('Follow error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <a 
        href="/auth/login"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a1 1 0 011-1h4a1 1 0 011 1v1H9V5z" />
        </svg>
        Đăng nhập để theo dõi
      </a>
    );
  }

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-lg shadow-lg opacity-70"
      >
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Đang kiểm tra...
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleFollow}
          disabled={isLoading || isCheckingStatus}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl flex-1 sm:flex-initial ${
            isFollowing
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <svg className="w-5 h-5" fill={isFollowing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5a1 1 0 011-1h4a1 1 0 011 1v1H9V5z" />
          </svg>
          {isLoading ? 'Đang xử lý...' : isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
        </button>
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
          <span className="text-blue-600 dark:text-blue-400">{followCount.toLocaleString('vi-VN')}</span> người theo dõi
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
