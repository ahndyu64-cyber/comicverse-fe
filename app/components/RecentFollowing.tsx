'use client';

import { useEffect, useState } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

export default function RecentFollowing() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentFollowing() {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        // If no token or user, return empty
        if (!token || !user) {
          setIsLoading(false);
          return;
        }

        const userData = JSON.parse(user);
        const userId = userData.id || userData._id;

        if (!userId) {
          setIsLoading(false);
          return;
        }

        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

        // Get following comics
        const response = await fetch(`${API_BASE}/users/${userId}/following`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const followingComics = data.data || data || [];

        // Sort by creation date (newest first) and get top 4
        const recent = followingComics
          .sort((a: Comic, b: Comic) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 4);

        setComics(recent);
      } catch (error) {
        console.error('Error fetching recent following comics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentFollowing();
  }, []);

  // Don't render if no comics
  if (isLoading || comics.length === 0) {
    return null;
  }

  return (
    <section id="recent-following" className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold text-neutral-900 mb-2">
              Theo dõi gần đây
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Những truyện bạn theo dõi mới nhất
            </p>
          </div>
          <a
            href="/comics/following"
            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 transition-all duration-300"
          >
            Xem tất cả
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {comics.map((comic: Comic) => (
          <ComicCard key={comic._id} comic={comic} />
        ))}
      </div>
    </section>
  );
}
