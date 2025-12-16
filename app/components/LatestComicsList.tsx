'use client';

import { useMemo } from 'react';
import type { Comic } from '../lib/comics';
import ComicCard from './ComicCard';

type LatestComicsListProps = {
  initialComics: Comic[];
};

export default function LatestComicsList({ initialComics }: LatestComicsListProps) {
  // Memoize the initial comics to prevent re-render on parent updates
  const frozenComics = useMemo(() => initialComics, []);
  
  // This component ONLY displays latest comics, does not update on follow/unfollow
  // The data is frozen on first render
  
  return (
    <div className="lg:col-span-2">
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
            Truyện mới cập nhật
          </h2>
          <p className="text-neutral-600 dark:text-white">
            Những bộ truyện mới nhất vừa được đăng tải
          </p>
        </div>
      </div>
      
      {frozenComics.length > 0 ? (
        <div>
          <div className="grid grid-cols-3 gap-6">
            {frozenComics.slice(0, 9).map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <a
              href="/comics"
              className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 transition-all duration-300"
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
