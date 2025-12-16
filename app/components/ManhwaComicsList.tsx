'use client';

import { useEffect, useState } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

export default function ManhwaComicsList() {
  const [manhwaComics, setManhwaComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManhwaComics = async () => {
      try {
        setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';
        
        const url = `${API_BASE}/comics?genres[]=Manhwa&page=1&limit=30`;
        console.log('[ManhwaComicsList] Fetching from:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('[ManhwaComicsList] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn('[ManhwaComicsList] Failed to fetch manhwa comics:', response.status, errorText);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('[ManhwaComicsList] Response data:', data);
        
        let comics = data.items || data.data || [];
        
        // Filter to ensure only Manhwa comics
        comics = comics.filter((comic: Comic) => {
          const genres = (comic.genres || []) as any[];
          return genres.some((g: any) => {
            const genreName = typeof g === 'string' ? g : g.name || g._id || '';
            return genreName.toLowerCase() === 'manhwa';
          });
        });
        
        console.log('[ManhwaComicsList] Comics found after filter:', comics.length);
        console.log('[ManhwaComicsList] Sample comics:', comics.slice(0, 3).map((c: Comic) => ({ title: c.title, genres: c.genres })));
        
        setManhwaComics(comics);
      } catch (error) {
        console.error('[ManhwaComicsList] Error fetching manhwa comics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManhwaComics();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2 pb-3 border-b-4 border-red-600 inline-block uppercase">
              Manhwa
            </h2>
            <p className="text-neutral-600 dark:text-white">
              Truyện Hàn Quốc mới nhất
            </p>
          </div>
          <a
            href="/comics?genres[]=Manhwa"
            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 transition-all duration-300 whitespace-nowrap"
          >
            Xem tất cả
          </a>
        </div>
      </div>

      {!isLoading && manhwaComics.length > 0 ? (
        <div>
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {manhwaComics.slice(0, 6).map((comic: Comic) => (
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
          <p className="text-neutral-600 dark:text-neutral-400">Chưa có truyện Manhwa nào</p>
        </div>
      )}
    </section>
  );
}
