'use client';

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import type { Comic } from "../lib/comics";

function formatChapterDate(dateString?: string) {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Nếu dưới 1 phút
  if (diffMins < 1) {
    return "Vừa xong";
  }
  // Nếu dưới 1 giờ
  if (diffHours < 1) {
    return `${diffMins} phút trước`;
  }
  // Nếu dưới 24 giờ
  if (diffDays < 1) {
    return `${diffHours} giờ trước`;
  }

  // Mặc định hiển thị ngày đầy đủ
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function ComicCard({ comic }: { comic: Comic }) {
  return (
    <article className="group flex flex-col h-full rounded-lg overflow-hidden bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow">
      {/* Cover Image */}
      <div className="relative w-full h-64 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 select-none">
        {comic.cover ? (
          <Link href={`/comics/${comic._id}`} className="block w-full h-full" draggable={false}>
            <Image 
              src={comic.cover} 
              alt={comic.title} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
              draggable={false}
            />
          </Link>
        ) : (
          <Link href={`/comics/${comic._id}`} className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 text-neutral-500 dark:text-neutral-400" draggable={false}>
            <span className="text-sm text-center">No Cover Image</span>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 bg-white dark:bg-black min-h-0">
        {/* Title */}
        <Link href={`/comics/${comic._id}`} className="font-bold text-sm line-clamp-2 text-neutral-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex-shrink-0">
          {comic.title}
        </Link>

        {/* Latest Chapters List */}
        {comic.chapters && comic.chapters.length > 0 && (
          <div className="mt-auto pt-2 space-y-1 flex-shrink-0">
            {comic.chapters.slice(-2).reverse().map((chapter, idx) => (
              <Link
                key={chapter._id || idx}
                href={`/reader/${comic._id}/${chapter._id}`}
                className="flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 px-2 py-1.5 rounded transition-colors"
              >
                <span className="text-neutral-700 dark:text-white line-clamp-1 flex-1 font-medium">
                  {chapter.title || `Chap ${idx + 1}`}
                </span>
                <span className="text-neutral-500 dark:text-white whitespace-nowrap ml-2 text-xs flex-shrink-0">
                  {formatChapterDate(chapter.date)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default memo(ComicCard);
