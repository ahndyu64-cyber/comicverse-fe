import Link from "next/link";
import Image from "next/image";
import { Comic } from "../lib/api";

export default function ComicCard({ comic }: { comic: Comic }) {
  return (
    <article className="flex w-full gap-4 rounded-md border bg-white p-3 shadow-sm dark:bg-neutral-900">
      <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded">
        {comic.cover ? (
          <Image src={comic.cover} alt={comic.title} width={160} height={220} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm text-neutral-500 dark:bg-neutral-800">
            No cover
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <Link href={`/comics/${comic._id}`} className="font-semibold">
          {comic.title}
        </Link>
        <p className="text-sm text-neutral-500">{comic.author || "--"}</p>
        <div className="mt-auto flex items-center justify-between text-xs text-neutral-500">
          <span>{comic.latestChapter || "0"}</span>
          <span>{comic.updatedAt ? new Date(comic.updatedAt).toLocaleDateString() : "-"}</span>
        </div>
      </div>
    </article>
  );
}
