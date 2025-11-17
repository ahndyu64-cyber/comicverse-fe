'use client';

import React, { useState, useEffect } from 'react';
import ComicCard from "../components/ComicCard";
import { getComics, type Comic } from "../lib/comics";
import { useSearchParams } from 'next/navigation';
import { searchComics } from '../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

interface Category {
  _id: string;
  name: string;
  description?: string;
}

const SORT_OPTIONS = [
  { value: 'new', label: 'Mới cập nhật' },
  { value: 'popular', label: 'Nhiều lượt xem' },
  { value: 'alpha', label: 'A → Z' },
];

export default function ComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('new');
  const [showFilters, setShowFilters] = useState(true);

  const searchParams = useSearchParams();
  const q = searchParams?.get('q') || '';

  // Load categories from backend
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : data.items || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([]);
      }
    }
    loadCategories();
  }, []);

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

  // Apply client-side filters and sorting
  const visibleComics = React.useMemo(() => {
    let items = comics.slice();
    if (selectedGenres.length > 0) {
      // Get category names for the selected IDs
      const selectedCategoryNames = selectedGenres
        .map(id => categories.find(c => c._id === id)?.name)
        .filter(Boolean) as string[];
      
      items = items.filter(c => 
        (c.genres || []).some((g: string) => 
          selectedCategoryNames.some(name => 
            g.toLowerCase() === name.toLowerCase()
          )
        )
      );
    }
    if (sortBy === 'alpha') {
      items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'popular') {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return items;
  }, [comics, selectedGenres, sortBy, categories]);

  const handleResetFilters = () => {
    setSelectedGenres([]);
    setSortBy('new');
    setPage(1);
  };

  const toggleGenre = (genre: string) => {
    setPage(1);
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900">
      {/* Page Header */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/50 backdrop-blur-sm sticky top-20 z-20">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                {q ? `Tìm kiếm: "${q}"` : 'Danh sách truyện'}
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {q 
                  ? `Tìm thấy ${visibleComics.length} truyện`
                  : `${visibleComics.length} / ${total} truyện`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="md:w-56 shrink-0">
            <div className="sticky top-40 space-y-4">
              {/* Filter Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-900 text-sm uppercase tracking-wide">Bộ lọc</h3>
                  {(selectedGenres.length > 0 || sortBy !== 'new') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 dark:hover:text-purple-400 transition-colors"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {/* Genre Filter */}
                <div className="mb-5 pb-5 border-b border-neutral-200 dark:border-neutral-800">
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-3 uppercase tracking-wider">Thể loại</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.length > 0 ? (
                      categories.map((category) => {
                        const active = selectedGenres.includes(category._id);
                        return (
                          <button
                            key={category._id}
                            onClick={() => toggleGenre(category._id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                              active
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-neutral-500">Không có thể loại</p>
                    )}
                  </div>
                </div>

                {/* Sort Filter */}
                <div>
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-3 uppercase tracking-wider">Sắp xếp</p>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedGenres.length > 0 || sortBy !== 'new') && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                    <span className="block mb-2">Bộ lọc đang áp dụng:</span>
                    {selectedGenres.length > 0 && (
                      <span>Thể loại: <strong>{selectedGenres.join(', ')}</strong></span>
                    )}
                    {selectedGenres.length > 0 && sortBy !== 'new' && <br />}
                    {sortBy !== 'new' && (
                      <span>Sắp xếp: <strong>{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</strong></span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1">
            {loading ? (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="group cursor-wait">
                      <div className="aspect-[2/3] bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700 rounded-xl animate-pulse"></div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600/30 border-t-purple-600"></div>
                    <span className="font-medium">Đang tải truyện...</span>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-8">
                  <div className="text-4xl mb-3">⚠️</div>
                  <p className="text-red-700 dark:text-red-300 font-semibold">Lỗi tải dữ liệu</p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
                </div>
              </div>
            ) : visibleComics.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-5xl mb-3">🔍</div>
                  {q ? (
                    <>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Không tìm thấy truyện cho "{q}"
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Thử kiểm tra chính tả hoặc tìm với từ khóa khác.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                        Không có truyện nào
                      </h2>
                      {selectedGenres.length > 0 && (
                        <p className="text-neutral-600 dark:text-neutral-400">
                          Thử xóa bộ lọc thể loại
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {visibleComics.map((comic) => (
                    <div key={comic._id} className="group">
                      <ComicCard comic={comic} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center">
                    <nav className="inline-flex items-center gap-1 rounded-xl bg-white dark:bg-neutral-900 p-2 shadow-lg border border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Trước
                      </button>

                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                          .map((p, i, arr) => (
                            <React.Fragment key={p}>
                              {i > 0 && arr[i - 1] !== p - 1 && (
                                <span className="px-2 text-neutral-400">...</span>
                              )}
                              <button
                                onClick={() => setPage(p)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                  page === p
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          ))}
                      </div>

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
