'use client';

import { useEffect, useState } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

type LatestComicsListProps = {
  initialComics: Comic[];
};

export default function LatestComicsList({ initialComics }: LatestComicsListProps) {
  const [latestComics, setLatestComics] = useState<Comic[]>(initialComics);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch latest comics from backend
  const fetchLatestComics = async () => {
    try {
      setIsLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
      
      // Fetch latest comics sorted by update time
      const response = await fetch(`${API_BASE}/comics?page=1&limit=30&sortBy=updated`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to fetch latest comics');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const comics = data.data || data.items || [];
      
      setLatestComics(comics.length > 0 ? comics : initialComics);
      console.log('LatestComicsList: Fetched latest comics', comics.length);
    } catch (error) {
      console.error('Error fetching latest comics:', error);
      setLatestComics(initialComics);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch latest comics on component mount
    fetchLatestComics();
    
    // Refresh every 1 minute to get updated data
    const refreshInterval = setInterval(fetchLatestComics, 1 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    // Listen for chapter update events to refresh immediately
    let debounceTimer: NodeJS.Timeout;
    
    const handleChapterUpdate = () => {
      console.log('LatestComicsList: Chapter update detected, will refresh in 500ms');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('LatestComicsList: Executing refresh callback');
        fetchLatestComics();
      }, 500);
    };

    window.addEventListener('chapterAdded', handleChapterUpdate);

    return () => {
      window.removeEventListener('chapterAdded', handleChapterUpdate);
      clearTimeout(debounceTimer);
    };
  }, []);
  
  return (
    <div className="lg:col-span-2">
      <div className="mb-4">
        <div className="mb-4">
          <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 pb-3 border-b-4 border-red-600 inline-block uppercase">
            Truyện mới cập nhật
          </h2>
          <p className="text-neutral-600 dark:text-white">
            Những bộ truyện mới nhất vừa được đăng tải
          </p>
        </div>
      </div>
      
      {latestComics.length > 0 ? (
        <div>
          <div className="grid grid-cols-3 gap-6">
            {latestComics.slice(0, 9).map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <a
              href="/comics"
              className="px-6 py-2 bg-white dark:bg-black text-black dark:text-white font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-300"
            >
              Xem thêm
            </a>
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
