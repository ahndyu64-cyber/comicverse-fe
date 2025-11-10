import ChapterList from "../../components/ChapterList";
import { getComicById } from "../../lib/comics";

type Props = {
  params: { id: string };
};

export default async function ComicDetail({ params }: Props) {
  // Ensure params is a valid object and id is a string before using
  if (!params?.id || typeof params.id !== 'string') {
    return <div className="p-8">ID truyện không hợp lệ</div>;
  }
  
  let comic;
  try {
    comic = await getComicById(params.id);
    if (!comic) return <div className="p-8">Không tìm thấy truyện</div>;
  } catch (error) {
    console.error('Error fetching comic:', error);
    return <div className="p-8">Không thể tải thông tin truyện</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-1/3">
          {comic.cover ? (
            <img src={comic.cover} alt={comic.title} className="w-full rounded" />
          ) : (
            <div className="h-64 w-full rounded bg-neutral-100 dark:bg-neutral-800" />
          )}
        </div>

        <div className="flex w-full flex-1 flex-col gap-3">
          <h1 className="text-2xl font-semibold">{comic.title}</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{comic.authors?.join(", ")}</p>
          <p className="text-sm text-neutral-700 dark:text-neutral-400">{comic.status || "Đang cập nhật"}</p>

          <div>
            <h3 className="mt-4 text-lg font-medium">Danh sách chương</h3>
            <ChapterList chapters={comic.chapters} basePath={`/reader/${comic._id}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
