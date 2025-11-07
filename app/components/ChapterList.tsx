import Link from "next/link";
import { Chapter } from "../lib/api";

export default function ChapterList({ chapters, basePath }: { chapters?: Chapter[]; basePath: string }) {
  if (!chapters || chapters.length === 0) return <p className="text-sm text-neutral-500">Chưa có chương</p>;

  return (
    <ul className="flex max-h-64 flex-col gap-2 overflow-auto pr-2 text-sm">
      {chapters.map((c) => (
        <li key={c._id} className="flex items-center justify-between border-b py-2">
          <Link href={`${basePath}/${c._id}`} className="text-sm text-neutral-900 dark:text-neutral-50">
            {c.title}
          </Link>
          <span className="text-xs text-neutral-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "-"}</span>
        </li>
      ))}
    </ul>
  );
}
