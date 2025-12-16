'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Comic } from '../lib/comics';

type HotComicsListProps = {
  initialComics: Comic[];
};

export default function HotComicsList({ initialComics }: HotComicsListProps) {
  const [hotComics, setHotComics] = useState<Comic[]>(initialComics);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch hot comics from backend
  const fetchHotComics = async () => {
    try {
      setIsLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      
      // Fetch all comics and sort by followers
      const response = await fetch(`${API_BASE}/comics?page=1&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch hot comics, using initial data');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      let allComics = data.data || data.items || [];
      
      // Sort by followers count (highest first)
      const hotComicsData = allComics
        .filter((comic: Comic) => (comic.followersCount || 0) > 0)
        .sort((a: Comic, b: Comic) => {
          const aFollowers = a.followersCount || 0;
          const bFollowers = b.followersCount || 0;
          return bFollowers - aFollowers;
        })
        .slice(0, 10);

      setHotComics(hotComicsData.length > 0 ? hotComicsData : initialComics);
      console.log('HotComicsList: Fetched hot comics from backend', hotComicsData.length);
    } catch (error) {
      console.error('Error fetching hot comics:', error);
      setHotComics(initialComics);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch hot comics on component mount
    fetchHotComics();
    
    // Refresh every 1 minute to get updated data
    const refreshInterval = setInterval(fetchHotComics, 1 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Listen for chapter update events to refresh immediately
    let debounceTimer: NodeJS.Timeout;
    
    const handleChapterUpdate = () => {
      console.log('HotComicsList: Chapter update detected, will refresh in 500ms');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('HotComicsList: Executing refresh callback');
        fetchHotComics();
      }, 500);
    };

    window.addEventListener('chapterAdded', handleChapterUpdate);

    return () => {
      window.removeEventListener('chapterAdded', handleChapterUpdate);
      clearTimeout(debounceTimer);
    };
  }, []);

  useEffect(() => {
    // Listen for follow/unfollow events to update hot comics
    let debounceTimer: NodeJS.Timeout;
    
    const handleFollowChange = () => {
      console.log('HotComicsList: Follow event detected, will refresh in 1000ms');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('HotComicsList: Executing refresh callback');
        fetchHotComics();
      }, 1000);
    };

    window.addEventListener('hotComicsRefresh', handleFollowChange);

    return () => {
      window.removeEventListener('hotComicsRefresh', handleFollowChange);
      clearTimeout(debounceTimer);
    };
  }, []);

  const displayComics = hotComics.length > 0 ? hotComics : initialComics;

  return (
    <div>
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Top theo dõi
          </h2>
          <p className="text-neutral-600 dark:text-white">
            Được yêu thích nhất
          </p>
        </div>
      </div>

      {displayComics.length > 0 ? (
        <div>
          <div className="space-y-4">
            {displayComics.slice(0, 6).map((comic: Comic, index: number) => (
              <div
                key={comic._id}
                className="flex items-center gap-4 p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                {/* Comic Cover */}
                <div className="relative w-32 h-40 flex-shrink-0 rounded overflow-hidden bg-neutral-200 dark:bg-neutral-700">
                  {comic.cover ? (
                    <Link href={`/comics/${comic._id}`}>
                      <Image
                        src={comic.cover}
                        alt={comic.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </Link>
                  ) : (
                    <div className="w-full h-full bg-neutral-300 dark:bg-neutral-600" />
                  )}
                </div>

                {/* Comic Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-white truncate line-clamp-2">
                    <Link href={`/comics/${comic._id}`} className="hover:text-blue-500">
                      {comic.title}
                    </Link>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-sm text-neutral-600 dark:text-white">5</span>
                  </div>
                  {comic.chapters && comic.chapters.length > 0 && (
                    <p className="text-sm text-neutral-500 dark:text-white mt-1">
                      {comic.chapters[comic.chapters.length - 1].title}
                    </p>
                  )}
                </div>

                {/* Ranking Number */}
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-base"
                  style={{
                    backgroundColor: ['#FFA500', '#FF7F50', '#6366F1', '#3B82F6', '#8B5CF6', '#EC4899'][
                      index % 6
                    ],
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Chưa có truyện nào</p>
        </div>
      )}
    </div>
  );
}
