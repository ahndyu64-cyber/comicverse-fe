import { getComics, type Comic } from "./lib/comics";
import ComicCard from "./components/ComicCard";
import RecentFollowing from "./components/RecentFollowing";
import BannerSlider from "./components/BannerSlider";

// Mock data for development when backend is unavailable
const mockComics: Comic[] = [
  {
    _id: "1",
    title: "Manga Demo 1",
    description: "Truyện demo 1",
    cover: "/file.svg",
    slug: "manga-demo-1",
    authors: ["Author 1"],
    genres: [],
    status: "ongoing",
    chapters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "2",
    title: "Manga Demo 2",
    description: "Truyện demo 2",
    cover: "/globe.svg",
    slug: "manga-demo-2",
    authors: ["Author 2"],
    genres: [],
    status: "ongoing",
    chapters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function getLatestComics() {
  try {
    const data = await getComics(1, 30); // 5 hàng × 6 cột = 30 truyện
    return data?.items || [];
  } catch (error) {
    console.error("Error fetching latest comics:", error);
    // Return mock data in development when backend is unavailable
    if (process.env.NODE_ENV === "development") {
      return mockComics;
    }
    return [];
  }
}

export default async function HomePage() {
  const latestComics = await getLatestComics();

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Banner Slider */}
      <BannerSlider />

      {/* Recent Following Section */}
      <RecentFollowing />

      {/* Latest Comics */}
      <section id="latest" className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12">
          <div className="mb-4">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Truyện mới cập nhật
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Những bộ truyện mới nhất vừa được đăng tải
            </p>
          </div>
        </div>
        
        {latestComics.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {latestComics.map((comic: Comic) => (
                <ComicCard key={comic._id} comic={comic} />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <a
                href="/comics"
                className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:shadow-lg hover:bg-neutral-100 transition-all duration-300"
              >
                Xem thêm
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400">Chưa có truyện nào</p>
          </div>
        )}
      </section>

      {/* Call to Action removed per request */}
    </main>
  );
}