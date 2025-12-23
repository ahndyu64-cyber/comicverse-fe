'use client';

import { useEffect, useState, useRef } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

export default function TopTrendingComicsList() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const fetchTopTrendingComics = async () => {
    try {
      setIsLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

      const response = await fetch(`${API_BASE}/comics?page=1&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const allComics = data.items || data.data || data || [];

      // Sort by views (highest first) and get top 15
      const topTrending = allComics
        .sort((a: Comic, b: Comic) => {
          const aViews = (a as any).views || 0;
          const bViews = (b as any).views || 0;
          return bViews - aViews;
        })
        .slice(0, 15);

      setComics(topTrending);
    } catch (error) {
      console.error('Error fetching top trending comics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopTrendingComics();
  }, []);

  // Initialize scroll position to the start of actual content
  useEffect(() => {
    if (scrollContainerRef.current && comics.length > 0) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [comics]);

  useEffect(() => {
    // Listen for view count updates to refresh top trending
    let debounceTimer: NodeJS.Timeout;
    
    const handleViewChange = () => {
      console.log('TopTrendingComicsList: View event detected, will refresh in 1000ms');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('TopTrendingComicsList: Executing refresh callback');
        fetchTopTrendingComics();
      }, 1000);
    };

    window.addEventListener('viewCountUpdated', handleViewChange);

    return () => {
      window.removeEventListener('viewCountUpdated', handleViewChange);
      clearTimeout(debounceTimer);
    };
  }, []);

  // Handle mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  // Handle mouse move event for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const x = e.pageX - (container.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    container.scrollLeft = scrollLeft - walk;
  };

  // Handle mouse up event to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave event to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Don't render if no comics
  if (!isLoading && comics.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 pb-3 border-b-4 border-red-600 inline-block uppercase">
              Top Thịnh Hành
            </h2>
            <p className="text-neutral-600 dark:text-white">
              Những truyện được xem nhiều nhất
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/comics?sort=views"
              className="px-6 py-2 bg-white dark:bg-black text-black dark:text-white font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-300 whitespace-nowrap"
            >
              Xem tất cả
            </a>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft -= 400;
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-orange-600 dark:hover:border-orange-600 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft += 400;
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-orange-600 dark:hover:border-orange-600 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!isLoading && comics.length > 0 ? (
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="flex gap-6 overflow-x-auto pb-4 scroll-smooth user-select-none"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {comics.map((comic: Comic, index: number) => (
            <div key={comic._id} className="flex-shrink-0 w-48 pointer-events-auto relative" draggable={false}>
              <ComicCard comic={comic} />
              {/* Ranking Badge */}
              <div className="absolute top-2 right-2 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Đang tải...</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Chưa có truyện nào</p>
        </div>
      )}
    </section>
  );
}
