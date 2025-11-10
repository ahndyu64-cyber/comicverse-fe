import { Comic, getComics } from "./lib/api";
import ComicCard from "./components/ComicCard";
import BannerSlider from "./components/BannerSlider";

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
    <main>
      {/* Banner Slider */}
      <BannerSlider comics={popularComics} />

      {/* Latest Comics */}
      <section className="mx-auto max-w-7xl px-4 py-8">
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

      {/* Categories/Genres Section */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold">Thể loại</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[
            "Hành động",
            "Phiêu lưu",
            "Tình cảm",
            "Hài hước",
            "Kinh dị",
            "Thể thao",
            "Học đường",
            "Đời thường",
            "Fantasy",
            "Sci-fi",
            "Shounen",
            "Shoujo",
          ].map((genre) => (
            <a
              key={genre}
              href={`/comics?genre=${encodeURIComponent(genre)}`}
              className="rounded-lg bg-white p-4 text-center shadow transition-shadow hover:shadow-md dark:bg-gray-800"
            >
              {genre}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}