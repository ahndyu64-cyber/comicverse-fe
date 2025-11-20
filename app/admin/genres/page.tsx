"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

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
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/categories`, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGenres(data || []);
        return;
      }
      
      // Fallback to localStorage if backend is down
      console.log('Backend categories endpoint failed, loading from localStorage');
      const storedGenres = JSON.parse(localStorage.getItem('categories') || '[]');
      setGenres(storedGenres);
    } catch (err) {
      console.error("Error loading categories:", err);
      // Fallback to localStorage
      const storedGenres = JSON.parse(localStorage.getItem('categories') || '[]');
      setGenres(storedGenres);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newGenre.name.trim()) {
      setError("Vui lòng nhập tên thể loại");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Create payload with different variations to handle different backend DTO requirements
      const basePayload = { name: newGenre.name.trim() };
      if (newGenre.description?.trim()) {
        basePayload.description = newGenre.description.trim();
      }
      
      console.log('API_BASE:', API_BASE);
      console.log('Token exists:', !!token);
      console.log('Sending payload:', basePayload);
      
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(basePayload),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          console.error('Backend error response:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Try to get text response if JSON fails
          try {
            const textError = await res.text();
            console.error('Backend text response:', textError);
            if (textError) {
              errorMessage = textError;
            }
          } catch (textErr) {
            console.error('Could not parse response:', textErr);
          }
        }
        
        // If backend fails, use localStorage fallback
        console.log('Backend failed, using localStorage fallback');
        const storedGenres = JSON.parse(localStorage.getItem('categories') || '[]');
        const newCategory = {
          _id: Date.now().toString(),
          ...basePayload
        };
        storedGenres.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(storedGenres));
        setGenres([...genres, newCategory]);
        setNewGenre({ name: "", description: "" });
        setShowForm(false);
        return;
      }
      
      const data = await res.json();
      setGenres([...genres, data]);
      setNewGenre({ name: "", description: "" });
      setShowForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tạo thể loại mới";
      console.error("Error creating genre:", err);
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thể loại này?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/categories/${id}`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        }
      );

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Ignore parse errors
        }
        
        // If backend fails, use localStorage fallback
        console.log('Backend delete failed, using localStorage fallback');
        const filteredGenres = genres.filter((genre) => genre._id !== id);
        localStorage.setItem('categories', JSON.stringify(filteredGenres));
        setGenres(filteredGenres);
        return;
      }
      
      const filteredGenres = genres.filter((genre) => genre._id !== id);
      localStorage.setItem('categories', JSON.stringify(filteredGenres));
      setGenres(filteredGenres);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa thể loại";
      console.error("Error deleting genre:", err);
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600">Đang tải danh sách thể loại...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý thể loại</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">Quản lý tất cả các thể loại truyện tranh</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/comics"
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-600 dark:bg-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-all duration-300"
              >
                ← Quay lại
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all duration-300"
              >
                {showForm ? "✕ Huỷ" : "+ Thêm thể loại mới"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Thêm thể loại mới</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Tên thể loại *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Action, Hành động..."
                  value={newGenre.name}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  placeholder="Mô tả về thể loại này..."
                  value={newGenre.description}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-md transition-all duration-300"
                >
                  Tạo thể loại
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-all duration-300"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Genres Grid */}
        {genres.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 p-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
                <span className="text-3xl text-gray-400">📚</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Chưa có thể loại nào</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Bắt đầu bằng cách thêm thể loại đầu tiên</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map((genre) => (
              <div
                key={genre._id}
                className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800 p-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{genre.name}</h3>
                    {genre.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {genre.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                    Thể loại
                  </span>
                  <button
                    onClick={() => handleDelete(genre._id)}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}