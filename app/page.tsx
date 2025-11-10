import { Comic, getComics } from "./lib/api";
import ComicCard from "./components/ComicCard";

// Mock data for development when backend is unavailable
const mockComics: Comic[] = [
  {
    _id: "1",
    title: "Manga Demo 1",
    description: "Truyện demo 1",
    cover: "/file.svg",
    views: 100,
  },
  {
    _id: "2",
    title: "Manga Demo 2",
    description: "Truyện demo 2",
    cover: "/globe.svg",
    views: 200,
  },
];

async function getLatestComics() {
  try {
    const data = await getComics(1, 8);
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching latest comics:", error);
    // Return mock data in development when backend is unavailable
    if (process.env.NODE_ENV === "development") {
      return mockComics;
    }
    return [];
  }
}

async function getPopularComics() {
  try {
    // Thêm query parameter để lấy truyện phổ biến (sắp xếp theo lượt xem)
    const data = await getComics(1, 4);
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching popular comics:", error);
    // Return mock data in development when backend is unavailable
    if (process.env.NODE_ENV === "development") {
      return mockComics.slice(0, 2);
    }
    return [];
  }
}

export default async function HomePage() {
  const [latestComics, popularComics] = await Promise.all([
    getLatestComics(),
    getPopularComics(),
  ]);

  return (
    <main className="min-h-screen bg-[color:var(--bg)]">
      {/* Banner placeholder (hero removed) */}
      <section className="px-4 mt-8">
        <div className="site-container">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden h-64 flex items-center justify-center">
            {/* Replace with your banner image or promo content */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-200">Banner trắng</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Thêm hình ảnh hoặc thông điệp quảng bá ở đây</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Comics */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Truyện mới cập nhật</h2>
          <a
            href="/comics"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Xem tất cả
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {latestComics.map((comic: Comic) => (
            <ComicCard key={comic._id} comic={comic} />
          ))}
        </div>
      </section>

      {/* Popular Comics */}
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Truyện nổi bật</h2>
            <a
              href="/comics/popular"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Xem tất cả
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularComics.map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
          </div>
        </div>
      </section>
      {/* Genres removed from homepage (moved to /comics/genres if needed) */}
    </main>
  );
}