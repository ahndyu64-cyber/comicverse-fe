import { getComics, type Comic } from "./lib/comics";
import ComicCard from "./components/ComicCard";

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
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }} className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              ComicVerse
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8 opacity-90">
              Khám phá thế giới truyện tranh kỳ thú
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/comics"
                className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Khám phá truyện
              </a>
              <a
                href="#latest"
                className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                Xem mới cập nhật
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Comics */}
      <section id="latest" className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-neutral-900 mb-2">
                Truyện mới cập nhật
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Những bộ truyện mới nhất vừa được đăng tải
              </p>
            </div>
            <a
              href="/comics"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Xem tất cả
            </a>
          </div>
        </div>
        
        {latestComics.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {latestComics.map((comic: Comic) => (
              <ComicCard key={comic._id} comic={comic} />
            ))}
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