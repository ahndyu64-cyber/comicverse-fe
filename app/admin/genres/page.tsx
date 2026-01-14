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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteGenreName, setDeleteGenreName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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
      const basePayload: any = { name: newGenre.name.trim() };
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
    const genre = genres.find(g => g._id === id);
    setDeleteGenreName(genre?.name || "thể loại");
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    setShowDeleteConfirm(null);
    setDeleteLoading(id);
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
    } finally {
      setDeleteLoading(null);
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
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-5xl px-0 sm:px-2 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý thể loại</h1>
              <p className="mt-1 text-gray-600 dark:text-white">Quản lý tất cả các thể loại truyện tranh</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/comics"
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 dark:bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 dark:hover:bg-purple-600 transition-all duration-300"
              >
                ← Quay lại
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all duration-300"
              >
                {showForm ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Huỷ
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Thêm thể loại mới
                  </>
                )}
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
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Thêm thể loại mới</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300">Tên thể loại *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Action, Hành động..."
                  value={newGenre.name}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-gray-900 dark:text-black placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-neutral-300">Mô tả</label>
                <textarea
                  placeholder="Mô tả về thể loại này..."
                  value={newGenre.description}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-gray-900 dark:text-black placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-all duration-300"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Genres Grid */}
        {genres.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-900 p-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                <span className="text-3xl text-gray-400">📚</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chưa có thể loại nào</h3>
            <p className="mt-2 text-gray-600 dark:text-neutral-400">Bắt đầu bằng cách thêm thể loại đầu tiên</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map((genre) => (
              <div
                key={genre._id}
                className="group rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-black p-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{genre.name}</h3>
                    {genre.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {genre.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-start gap-3">
                  <span className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-700">
                    Thể loại
                  </span>
                  <button
                    onClick={() => handleDelete(genre._id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-700 dark:text-red-700 px-3 py-1.5 text-xs font-semibold hover:from-red-200 hover:to-red-100 dark:hover:from-red-900/50 dark:hover:to-red-900/30 transition shadow-sm hover:shadow-md"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-xs rounded-xl bg-white dark:bg-black shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Xác nhận xóa
                </h2>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                <p className="text-neutral-700 dark:text-white text-sm">
                  Bạn có chắc chắn muốn xóa thể loại <span className="font-bold text-red-600 dark:text-red-400">"{deleteGenreName}"</span>?
                </p>
                <p className="text-neutral-500 dark:text-white text-xs mt-2">
                  Hành động này không thể hoàn tác.
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium text-sm transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={() => confirmDelete(showDeleteConfirm)}
                  disabled={deleteLoading === showDeleteConfirm}
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-400 disabled:to-red-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {deleteLoading === showDeleteConfirm ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}