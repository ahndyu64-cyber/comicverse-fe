import ComicCard from "../components/ComicCard";
import { getComics } from "../lib/api";

export default async function ComicsPage() {
  const res = await getComics(1, 24).catch(() => ({ data: [] }));
  // Normalize response to always be an array of comics.
  // Backend may return { data: [...] } or an array directly.
  let comics: any[] = [];
  if (Array.isArray(res)) {
    comics = res;
  } else if (res && Array.isArray((res as any).data)) {
    comics = (res as any).data;
  } else {
    comics = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Danh sách truyện</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comics.map((c: any) => (
          <ComicCard key={c._id} comic={c} />
        ))}
      </div>
    </div>
  );
}
