"use client";
import { useEffect, useState } from "react";

interface Genre {
  _id: string;
  name: string;
  description?: string;
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenre, setNewGenre] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/genres`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load genres");
      const data = await res.json();
      setGenres(data || []);
    } catch (err) {
      console.error("Error loading genres:", err);
      setError("Không thể tải danh sách thể loại");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/genres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGenre),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create genre");
      
      const data = await res.json();
      setGenres([...genres, data]);
      setNewGenre({ name: "", description: "" });
    } catch (err) {
      console.error("Error creating genre:", err);
      setError("Không thể tạo thể loại mới");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thể loại này?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/genres/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete genre");
      
      setGenres(genres.filter((genre) => genre._id !== id));
    } catch (err) {
      console.error("Error deleting genre:", err);
      setError("Không thể xóa thể loại");
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Quản lý thể loại</h1>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm">Tên thể loại</label>
          <input
            type="text"
            required
            value={newGenre.name}
            onChange={(e) =>
              setNewGenre({ ...newGenre, name: e.target.value })
            }
            className="w-full rounded border p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Mô tả</label>
          <textarea
            value={newGenre.description}
            onChange={(e) =>
              setNewGenre({ ...newGenre, description: e.target.value })
            }
            className="w-full rounded border p-2"
            rows={3}
          />
        </div>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Thêm thể loại
        </button>
      </form>

      <div className="divide-y divide-gray-200">
        {genres.map((genre) => (
          <div
            key={genre._id}
            className="flex items-center justify-between py-4"
          >
            <div>
              <h3 className="font-medium">{genre.name}</h3>
              {genre.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {genre.description}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(genre._id)}
              className="text-sm text-red-600 hover:underline"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}