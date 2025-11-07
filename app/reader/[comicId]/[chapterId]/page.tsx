"use client";
import { useEffect, useState } from "react";
import { getChapterImages } from "../../../lib/api";
import Link from "next/link";

type Props = {
  params: { comicId: string; chapterId: string };
};

export default function ReaderPage({ params }: Props) {
  const { comicId, chapterId } = params;
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getChapterImages(comicId, chapterId)
      .then((res: any) => setImages(res?.data?.images || res?.images || []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [comicId, chapterId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/comics/${comicId}`} className="text-sm">
            ← Trở về
          </Link>
        </div>
        <div className="text-sm">Chương: {chapterId}</div>
      </div>

      {loading ? (
        <div>Đang tải ảnh...</div>
      ) : images.length === 0 ? (
        <div>Không có ảnh để hiển thị</div>
      ) : (
        <div className="flex flex-col gap-6">
          {images.map((src, i) => (
            <img key={i} src={src} alt={`page-${i + 1}`} className="w-full rounded" />
          ))}
        </div>
      )}
    </div>
  );
}
