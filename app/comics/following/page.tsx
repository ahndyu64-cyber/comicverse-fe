"use client";
import { useEffect, useState } from "react";
import { Comic, getFollowingComics } from "../../lib/api";
import ComicCard from "../../components/ComicCard";

export default function FollowingPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFollowingComics = async () => {
      try {
        // Lấy userId từ localStorage
        const userData = localStorage.getItem('userData');
        const userId = userData ? JSON.parse(userData).id : null;
        
        if (!userId) {
          console.error("User not logged in");
          return;
        }
        
        const data = await getFollowingComics(userId);
        setComics(data || []);
      } catch (err) {
        console.error("Error loading following comics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFollowingComics();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Truyện đang theo dõi</h1>
      
      {comics.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Bạn chưa theo dõi truyện nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {comics.map((comic) => (
            <ComicCard key={comic._id} comic={comic} />
          ))}
        </div>
      )}
    </div>
  );
}