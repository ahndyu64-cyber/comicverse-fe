import ChapterList from "../../components/ChapterList";
import { getComic } from "../../lib/api";

type Props = {
  params: { id: string };
};

export default async function ComicDetail({ params }: Props) {
  const { id } = params;
  const res = await getComic(id).catch(() => null);
  const comic = res?.data || res || null;

  if (!comic) return <div className="p-8">Không tìm thấy truyện</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-1/3">
          {comic.cover ? (
            // @ts-ignore - next/image requires static width/height but backend may return remote urls; rely on layout
            <img src={comic.cover} alt={comic.title} className="w-full rounded" />
          ) : (
            <div className="h-64 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
          )}
        </div>

        <div className="flex w-full flex-1 flex-col gap-3">
          <h1 className="text-2xl font-semibold">{comic.title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{comic.author}</p>
          <p className="text-sm text-neutral-700 dark:text-neutral-400">{comic.status}</p>

          <div>
            <h3 className="mt-4 text-lg font-medium">Danh sách chương</h3>
            <ChapterList chapters={comic.chapters} basePath={`/reader/${comic._id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
