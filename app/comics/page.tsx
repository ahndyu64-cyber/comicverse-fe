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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        {/* Sidebar / Filters */}
        <aside className="order-2 lg:order-1 w-full lg:w-72 shrink-0">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Tìm kiếm</label>
              <div className="flex items-center gap-2">
                <input placeholder="Tìm tên tác giả hoặc truyện" className="w-full rounded-md border px-3 py-2 text-sm outline-none dark:bg-neutral-800" />
                <button className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">OK</button>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
              <h3 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Thể loại</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Hành động",
                  "Phiêu lưu",
                  "Tình cảm",
                  "Hài hước",
                  "Kinh dị",
                  "Fantasy",
                ].map((g) => (
                  <button key={g} className="rounded-full border px-3 py-1 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
              <h3 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Sắp xếp</h3>
              <select className="w-full rounded-md border px-3 py-2 text-sm outline-none dark:bg-neutral-800">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Danh sách truyện</h1>
                <div className="text-sm text-neutral-500">Hiện {comics.length} trong tổng số {total} truyện</div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {comics.map((comic) => (
                  <ComicCard key={comic._id} comic={comic} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 flex items-center justify-center">
                <nav className="inline-flex items-center gap-2 rounded-md bg-white p-2 shadow-sm dark:bg-neutral-900">
                  <button 
                    className="px-3 py-1 text-sm disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <button
                          className={`px-3 py-1 text-sm ${page === p ? 'bg-blue-600 text-white rounded' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  
                  <button 
                    className="px-3 py-1 text-sm disabled:opacity-50"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
