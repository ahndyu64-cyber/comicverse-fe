'use client';

import { useEffect, useState, useRef } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

export default function ManhuaComicsList() {
  const [manhuaComics, setManhuaComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchManhuaComics = async () => {
      try {
        setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
        
        const url = `${API_BASE}/comics?genres[]=Manhua&page=1&limit=100`;
        console.log('[ManhuaComicsList] Fetching from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('[ManhuaComicsList] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('[ManhuaComicsList] Failed to fetch manhua comics:', response.status, errorText);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('[ManhuaComicsList] Response data:', data);
        
        let comics = data.items || data.data || [];
        
        // Filter to ensure only Manhua comics
        comics = comics.filter((comic: Comic) => {
          const genres = (comic.genres || []) as any[];
          return genres.some((g: any) => {
            const genreName = typeof g === 'string' ? g : g.name || g._id || '';
            return genreName.toLowerCase() === 'manhua';
          });
        });
        
        console.log('[ManhuaComicsList] Comics found after filter:', comics.length);
        console.log('[ManhuaComicsList] Sample comics:', comics.slice(0, 3).map((c: Comic) => ({ title: c.title, genres: c.genres })));
        
        // Sort by most recent update first, then limit to maximum 15 comics
        const sortedComics = comics
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt || 0).getTime();
            const dateB = new Date(b.updatedAt || 0).getTime();
            return dateB - dateA; // Newest first
          })
          .slice(0, 15);
        
        setManhuaComics(sortedComics);
      } catch (error) {
        console.error('[ManhuaComicsList] Error fetching manhua comics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManhuaComics();
  }, []);

  // Initialize scroll position to the start of actual content
  useEffect(() => {
    if (scrollContainerRef.current && manhuaComics.length > 0) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [manhuaComics]);

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

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 pb-3 border-b-4 border-red-600 inline-block uppercase">
              Manhua
            </h2>
            <p className="text-neutral-600 dark:text-white">
              Truyện Trung Quốc mới nhất
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/comics?genres[]=Manhua"
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
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300"
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
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!isLoading && manhuaComics.length > 0 ? (
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
          {manhuaComics.map((comic: Comic) => (
            <div key={comic._id} className="flex-shrink-0 w-48 pointer-events-auto" draggable={false}>
              <ComicCard comic={comic} />
            </div>
          ))}
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Đang tải...</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">Chưa có truyện Manhua nào</p>
        </div>
      )}
    </section>
  );
}
