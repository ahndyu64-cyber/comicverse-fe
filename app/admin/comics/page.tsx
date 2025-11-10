"use client";
import { useEffect, useState } from "react";

type Comic = {
  _id: string;
  title: string;
  cover?: string;
  author?: string;
};

export default function AdminComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComics();
  }, []);

  const loadComics = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/comics`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load comics");
      const data = await res.json();
      setComics(data || []);
    } catch (err) {
      console.error("Error loading comics:", err);
      setError("Không thể tải danh sách truyện");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa truyện này?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/comics/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comic");
      setComics(comics.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting comic:", err);
      alert("Không thể xóa truyện");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Quản lý truyện</h1>

      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-600">{error}</div>}

      <div className="divide-y divide-gray-200">
        {comics.map((comic) => (
          <div key={comic._id} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {comic.cover && <img src={comic.cover} alt={comic.title} className="h-16 w-12 object-cover" />}
              <div>
                <div className="font-medium">{comic.title}</div>
                <div className="text-sm text-neutral-500">{comic.author}</div>
              </div>
            </div>
            <div>
              <button onClick={() => handleDelete(comic._id)} className="text-sm text-red-600 hover:underline">Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
