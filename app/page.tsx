import Link from "next/link";
import Image from "next/image";
import { getComics, type Comic } from "./lib/comics";
import ComicCard from "./components/ComicCard";
import RecentFollowing from "./components/RecentFollowing";
import TopTrendingComicsList from "./components/TopTrendingComicsList";
import BannerSlider from "./components/BannerSlider";
import HotComicsList from "./components/HotComicsList";
import LatestComicsList from "./components/LatestComicsList";
import ManhuaComicsList from "./components/ManhuaComicsList";
import ManhwaComicsList from "./components/ManhwaComicsList";

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
    const data = await getComics(1, 30, 'latest'); // Sort by latest updates
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
  
  // Filter and sort comics by followers count for hot comics (only comics with followers)
  // This is used as initial data for HotComicsList component
  const hotComics = [...latestComics]
    .filter((comic) => (comic.followersCount || 0) > 0)
    .sort((a, b) => {
      const aFollowers = a.followersCount || 0;
      const bFollowers = b.followersCount || 0;
      return bFollowers - aFollowers;
    });

  return (
    <main className="min-h-screen bg-white dark:bg-black">
      {/* Banner Slider */}
      <BannerSlider />

      {/* Recent Following Section */}
      <RecentFollowing />

      {/* Top Trending Section */}
      <TopTrendingComicsList />

      {/* Latest Comics and Hot Comics */}
      <section id="latest-and-hot" className="mx-auto max-w-7xl px-0 sm:px-2 py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
          {/* Latest Comics - 2/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-2">
            <LatestComicsList initialComics={latestComics} />
          </div>

          {/* Hot Comics - 1/3 width on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            <HotComicsList initialComics={hotComics.length > 0 ? hotComics : latestComics} />
          </div>
        </div>
      </section>

      {/* Manhua Section */}
      <ManhuaComicsList />

      {/* Manhwa Section */}
      <ManhwaComicsList />

      {/* Call to Action removed per request */}
    </main>
  );
}