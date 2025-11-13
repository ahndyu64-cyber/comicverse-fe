'use client';

import React, { useState, useEffect } from 'react';
import ComicCard from "../components/ComicCard";
import { getComics, type Comic } from "../lib/comics";

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadComics() {
      try {
        setError('');
        const data = await getComics(page);
        console.log('Comics API response:', data);
        
        if (data?.items) {
          setComics(data.items);
          setTotal(data.total);
          setTotalPages(Math.ceil(data.total / data.limit));
        } else {
          console.warn('Invalid response format:', data);
          setComics([]);
          setTotal(0);
          setTotalPages(0);
        }
      } catch (err: any) {
        setError(err.message);
        setComics([]);
      } finally {
        setLoading(false);
      }
    }

    loadComics();
  }, [page]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }} className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Danh sách truyện</h1>
          <p className="text-lg text-white/90">Khám phá hàng ngàn bộ truyện yêu thích</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex w-full flex-col gap-8 lg:flex-row">
          {/* Sidebar / Filters */}
          <aside className="order-2 lg:order-1 w-full lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Search removed per design request */}

              {/* Genres */}
              <div className="rounded-xl bg-white dark:bg-neutral-900 p-5 shadow-md">
                <h3 className="mb-4 text-sm font-bold text-neutral-900 dark:text-white">Thể loại</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Hành động",
                    "Phiêu lưu",
                    "Tình cảm",
                    "Hài hước",
                    "Kinh dị",
                    "Fantasy",
                  ].map((g) => (
                    <button 
                      key={g} 
                      className="rounded-full border-2 border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 dark:hover:border-purple-500 transition-colors duration-300"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="rounded-xl bg-white dark:bg-neutral-900 p-5 shadow-md">
                <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-white">Sắp xếp</h3>
                <select className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none transition-colors focus:border-purple-500">
                  <option value="new">Mới cập nhật</option>
                  <option value="popular">Nhiều lượt xem</option>
                  <option value="alpha">A → Z</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <section className="order-1 lg:order-2 flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
                  <p className="text-neutral-600 dark:text-neutral-400">Đang tải truyện...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-8">
                  <p className="text-red-600 dark:text-red-400 font-semibold">Lỗi: {error}</p>
                </div>
              </div>
            ) : comics.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-neutral-600 dark:text-neutral-400 text-lg">Không có truyện nào</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Kết quả tìm kiếm</h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                      Hiện <span className="font-semibold text-purple-600 dark:text-purple-400">{comics.length}</span> / <span className="font-semibold text-purple-600 dark:text-purple-400">{total}</span> truyện
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {comics.map((comic) => (
                    <ComicCard key={comic._id} comic={comic} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center">
                    <nav className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-neutral-900 p-2 shadow-lg">
                      <button 
                        className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        ← Trước
                      </button>
                      
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                          .map((p, i, arr) => (
                            <React.Fragment key={p}>
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span className="px-2 text-neutral-500">...</span>
                              )}
                              <button
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                                  page === p 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                                    : 'text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400'
                                }`}
                                onClick={() => setPage(p)}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>
                      
                      <button 
                        className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Sau →
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
