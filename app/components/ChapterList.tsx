import Link from "next/link";
import { Chapter } from "../lib/api";

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

export default function ChapterList({ chapters, basePath }: { chapters?: Chapter[]; basePath: string }) {
  if (!chapters || chapters.length === 0) return <p className="text-sm text-neutral-500">Chưa có chương</p>;

  // Sắp xếp chapters theo thứ tự giảm dần (mới nhất ở trên)
  const sortedChapters = [...chapters].reverse();

  return (
    <ul className="flex max-h-64 flex-col gap-2 overflow-auto pr-2 text-sm">
      {sortedChapters.map((c) => (
        <li key={c._id} className="flex items-center justify-between border-b py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 px-2 rounded transition-colors">
          <Link href={`${basePath}/${c._id}`} className="text-sm text-neutral-900 dark:text-neutral-50 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors flex-1">
            {c.title}
          </Link>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap ml-4">
            {formatChapterDate(c.createdAt || (c as any).date)}
          </span>
        </li>
      ))}
    </ul>
  );
}
