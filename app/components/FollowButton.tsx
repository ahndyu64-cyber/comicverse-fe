'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { followComic, unfollowComic, getFollowingComics } from '../lib/api';

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

  // Check if user is following this comic on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      const userId = (user && ((user as any).id || (user as any)._id)) as string | undefined;
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!userId || (!token && !storedToken)) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const followingComics = await getFollowingComics(userId || '');
        const isUserFollowing = followingComics?.some((comic: any) => comic._id === comicId);
        setIsFollowing(isUserFollowing || false);
      } catch (err) {
        console.error('Error checking follow status:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [user?.id, token, comicId]);

  useEffect(() => {
    setFollowCount(initialFollows);
  }, [initialFollows]);

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
      try {
        const followingComics = await getFollowingComics(userId || '');
        const isUserFollowing = followingComics?.some((comic: any) => comic._id === comicId);
        setIsFollowing(isUserFollowing || false);
      } catch (err) {
        console.error('Error refetching follow status:', err);
        // If refetch fails, just toggle the state optimistically
        setIsFollowing(!isFollowing);
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
      <button
        onClick={handleFollow}
        disabled={isLoading || isCheckingStatus}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl ${
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
      {followCount > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
          {followCount} {followCount === 1 ? 'người' : 'người'} đang theo dõi
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
