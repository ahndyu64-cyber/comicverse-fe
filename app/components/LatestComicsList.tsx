'use client';

import { useEffect, useState, useRef } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

type LatestComicsListProps = {
  initialComics: Comic[];
};

export default function LatestComicsList({ initialComics }: LatestComicsListProps) {
  const [latestComics, setLatestComics] = useState<Comic[]>(initialComics);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  const COMICS_PER_PAGE = 9; // 3 rows × 3 columns
  const MAX_PAGES = 3;

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
      setCurrentPage(0); // Reset to first page when new data is fetched
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

  // Get current page comics
  const startIdx = currentPage * COMICS_PER_PAGE;
  const endIdx = startIdx + COMICS_PER_PAGE;
  const currentPageComics = latestComics.slice(startIdx, endIdx);
  const totalPages = Math.min(Math.ceil(latestComics.length / COMICS_PER_PAGE), MAX_PAGES);
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle drag to change pages
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const dragEndX = e.pageX;
    const dragDistance = dragStartX - dragEndX;
    const dragThreshold = 30; // Minimum drag distance to trigger page change

    // Drag right (dragDistance is negative) = go to previous page
    if (dragDistance < -dragThreshold) {
      handlePrevPage();
    }
    // Drag left (dragDistance is positive) = go to next page
    else if (dragDistance > dragThreshold) {
      handleNextPage();
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  return (
    <div className="lg:col-span-2">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 pb-3 border-b-4 border-red-600 inline-block uppercase">
              Truyện mới cập nhật
            </h2>
            <p className="text-neutral-600 dark:text-white">
              Những bộ truyện mới nhất vừa được đăng tải
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/comics"
              className="px-6 py-2 bg-white dark:bg-black text-black dark:text-white font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-300 whitespace-nowrap"
            >
              Xem tất cả
            </a>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:border-red-600 dark:hover:border-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {latestComics.length > 0 ? (
        <div
          ref={gridContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="user-select-none transition-all duration-500 ease-in-out"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            opacity: 1,
          }}
        >
          <div className="grid grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
            {currentPageComics.map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
          
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-10 h-10 rounded-full font-semibold transition-all duration-300 flex items-center justify-center ${
                    currentPage === idx
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-white dark:bg-black text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
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
