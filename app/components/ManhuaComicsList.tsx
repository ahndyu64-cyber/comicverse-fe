'use client';

import { useEffect, useState } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

export default function ManhuaComicsList() {
  const [manhuaComics, setManhuaComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManhuaComics = async () => {
      try {
        setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
        
        const url = `${API_BASE}/comics?genres[]=Manhua&page=1&limit=30`;
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
        
        setManhuaComics(comics);
      } catch (error) {
        console.error('[ManhuaComicsList] Error fetching manhua comics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManhuaComics();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Manhua
            </h2>
            <p className="text-neutral-600 dark:text-white">
              Truyện Trung Quốc mới nhất
            </p>
          </div>
          <a
            href="/comics?genres[]=Manhua"
            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 transition-all duration-300 whitespace-nowrap"
          >
            Xem tất cả
          </a>
        </div>
      </div>

      {!isLoading && manhuaComics.length > 0 ? (
        <div>
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {manhuaComics.slice(0, 6).map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
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
