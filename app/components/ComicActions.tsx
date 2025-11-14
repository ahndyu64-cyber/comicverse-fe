'use client';

import FollowButton from './FollowButton';

type ComicActionsProps = {
  comicId: string;
  followCount: number;
  firstChapterId?: string;
};

export default function ComicActions({ comicId, followCount, firstChapterId }: ComicActionsProps) {
  if (!firstChapterId) {
    return <FollowButton comicId={comicId} initialFollows={followCount} />;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <a 
        href={`/reader/${comicId}/${firstChapterId}`}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl flex-1 sm:flex-initial"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z"></path>
          <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z"></path>
        </svg>
        Đọc từ đầu
      </a>
      <div className="flex-1 sm:flex-initial">
        <FollowButton comicId={comicId} initialFollows={followCount} />
      </div>
    </div>
  );
}
