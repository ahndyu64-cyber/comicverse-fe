'use client';

import React, { useState, useEffect } from 'react';
import ComicCard from "../components/ComicCard";
import { getComics, type Comic } from "../lib/comics";
import { useSearchParams } from 'next/navigation';
import { searchComics } from '../lib/api';

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const searchParams = useSearchParams();
  const q = searchParams?.get('q') || '';

  useEffect(() => {
    async function loadComics() {
      try {
        setError('');

        if (q) {
          // perform search
          const data: any = await searchComics(q);
          // If the backend search returned no results, try a local fallback
          // by fetching the first few pages and filtering client-side.
          const shouldFallback = (Array.isArray(data) && data.length === 0) || (data && data.items && data.items.length === 0);
          if (shouldFallback) {
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.debug('[client] search empty, running fallback local filter for', q);
            }
            // gather first N pages (limit 20 per page) to search locally
            const maxPages = 5;
            let accumulated: Comic[] = [];
            for (let p = 1; p <= maxPages; p++) {
              try {
                // getComics returns { items, total, page, limit }
                // @ts-ignore
                const pageData = await getComics(p, 20);
                if (!pageData || !pageData.items || pageData.items.length === 0) break;
                accumulated = accumulated.concat(pageData.items as Comic[]);
                if (pageData.total && accumulated.length >= pageData.total) break;
              } catch (err) {
                break;
              }
            }
            const qLower = q.toLowerCase();
            const filtered = accumulated.filter((c) => (c.title || '').toLowerCase().includes(qLower));
            if (filtered.length > 0) {
              setComics(filtered);
              setTotal(filtered.length);
              setTotalPages(1);
              setLoading(false);
              return;
            }
            // else continue and show empty
          }
          // normalize response: could be array or { items, total }
          if (Array.isArray(data)) {
            setComics(data as any[]);
            setTotal(data.length);
            setTotalPages(1);
          } else if (data?.items) {
            setComics(data.items);
            setTotal(data.total || data.items.length || 0);
            setTotalPages(Math.ceil((data.total || data.items.length || 0) / (data.limit || 20)));
          } else {
            // unknown format -> show empty
            console.warn('Unexpected search response:', data);
            setComics([]);
            setTotal(0);
            setTotalPages(0);
          }
        } else {
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
        }
      } catch (err: any) {
        setError(err.message);
        setComics([]);
      } finally {
        setLoading(false);
      }
    }

    loadComics();
  }, [page, q]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Compact Page Header (hero removed for cleaner layout) */}
      <div className="py-6 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Danh sách truyện</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Khám phá hàng ngàn bộ truyện yêu thích</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex w-full flex-col gap-8 lg:flex-row">
          {/* Sidebar / Compact Filters */}
          <aside className="order-2 lg:order-1 w-full lg:w-64 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-xl bg-white dark:bg-neutral-900 p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Bộ lọc</h3>
                  <button className="text-xs text-purple-600 hover:underline">Đặt lại</button>
                </div>

                <div className="mb-3">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Thể loại</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
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
                        className="text-xs px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Sắp xếp</label>
                  <select className="mt-2 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none">
                    <option value="new">Mới cập nhật</option>
                    <option value="popular">Nhiều lượt xem</option>
                    <option value="alpha">A → Z</option>
                  </select>
                </div>
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
                  {q ? (
                    <>
                      <p className="text-neutral-900 dark:text-white text-lg font-semibold">Không tìm thấy truyện cho "{q}"</p>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-2">Thử kiểm tra chính tả hoặc tìm với từ khóa khác.</p>
                    </>
                  ) : (
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">Không có truyện nào</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    {q ? (
                      <>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Kết quả tìm kiếm cho "{q}"</h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                          Hiện <span className="font-semibold text-purple-600 dark:text-purple-400">{comics.length}</span> {total ? <>/ <span className="font-semibold text-purple-600 dark:text-purple-400">{total}</span> </> : null} truyện
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Danh sách truyện</h2>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                          Hiện <span className="font-semibold text-purple-600 dark:text-purple-400">{comics.length}</span> / <span className="font-semibold text-purple-600 dark:text-purple-400">{total}</span> truyện
                        </p>
                      </>
                    )}
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
