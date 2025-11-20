"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminComics, deleteAdminComic } from "../../lib/api";
import { hasAdminOrModeratorRole, hasAdminRole, canManageComic, canEditComic } from "../../lib/auth";

type Comic = {
  _id: string;
  id?: string;
  title: string;
  cover?: string;
  author?: string;
  status?: string;
  description?: string;
  genres?: string[];
  chapters?: Array<{ _id?: string } | any>;
};

export default function AdminComicsPage() {
  const router = useRouter();
  const authContext = useAuth();
  const isAuthorized = hasAdminOrModeratorRole(authContext?.user);
  const isAuthLoading = authContext?.isLoading ?? true;
  
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("new");

  useEffect(() => {
    // Wait for auth to be ready
    if (isAuthLoading) {
      return;
    }

    // Check authorization before loading
    if (!isAuthorized) {
      setError("Bạn cần quyền quản lý truyện (Admin hoặc Uploader) để xem trang này.");
      setLoading(false);
      return;
    }
    loadComics();
  }, [isAuthorized, isAuthLoading]);

  const loadComics = async () => {
    try {
      const data = await getAdminComics();
      
      if (data === null) {
        setComics([]);
        setError("Bạn cần đăng nhập với quyền quản trị để xem danh sách truyện.");
        return;
      }

      // Normalize response shapes: API returns { items: [...], total, page, limit }
      let list: Comic[] = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray((data as any).items)) {
        list = (data as any).items;
      } else if (Array.isArray((data as any).comics)) {
        list = (data as any).comics;
      } else if (Array.isArray((data as any).data)) {
        list = (data as any).data;
      } else {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[admin/comics] unexpected getAdminComics() response:", data);
        }
      }

      setComics(list);
    } catch (err) {
      console.error("Error loading comics:", err);
      setError("Không thể tải danh sách truyện");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa truyện này?")) return;

    setDeleteLoading(id);
    try {
      const res = await deleteAdminComic(id);
      if (res === null) throw new Error("Failed to delete comic (unauthorized)");
      setComics(comics.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Error deleting comic:", err);
      alert("Không thể xóa truyện");
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      ongoing: { bg: "bg-blue-100", text: "text-blue-800", label: "Đang cập nhật" },
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Hoàn thành" },
      paused: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Tạm dừng" },
    };
    const config = statusConfig[status || "ongoing"] || statusConfig.ongoing;
    return { ...config, label: statusConfig[status || "ongoing"]?.label || "Đang cập nhật" };
  };

  // Filter and sort comics
  const filteredComics = comics.filter((comic) => {
    const query = searchQuery.toLowerCase();
    return (
      comic.title.toLowerCase().includes(query) ||
      (comic.author && comic.author.toLowerCase().includes(query))
    );
  });

  const sortedComics = [...filteredComics].sort((a, b) => {
    if (sortBy === "alpha") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "popular") {
      // Sort by number of chapters (as a proxy for popularity)
      return (b.chapters?.length || 0) - (a.chapters?.length || 0);
    }
    // Default: "new" - keep original order (typically newest first from API)
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600"></div>
          </div>
          <p className="text-gray-600">Đang tải danh sách truyện...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý truyện</h1>
              <p className="mt-1 text-gray-600">Tổng cộng: <span className="font-semibold text-gray-900">{comics.length}</span> truyện</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/genres"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-md"
              >
                ⚙ Quản lý thể loại
              </Link>
              <Link
                href="/admin/comics/create"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                + Thêm truyện mới
              </Link>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-1/2">
              <input
                placeholder="Tìm theo tiêu đề hoặc tác giả"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-600 dark:text-neutral-300">Sắp xếp:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition">
                <option value="new">Mới cập nhật</option>
                <option value="alpha">A → Z</option>
                <option value="popular">Nổi bật</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {sortedComics.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-900 p-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-3xl text-gray-400">—</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery ? "Không tìm thấy truyện" : "Không có truyện nào"}
            </h3>
            <p className="mt-1 text-gray-600">
              {searchQuery ? "Thử thay đổi từ khóa tìm kiếm" : "Bắt đầu bằng cách thêm truyện đầu tiên của bạn"}
            </p>
            {!searchQuery && (
              <Link
                href="/admin/comics/create"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                <span className="text-lg">+</span>
                Tạo truyện mới
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {sortedComics.map((comic) => {
              const statusBadge = getStatusBadge(comic.status);
              const comicId = comic._id || comic.id;
              
              // Debug: log comic ID
              if (!comicId) {
                console.warn('Comic has no ID:', comic);
              }
              
              return (
                <div
                  key={comicId}
                  className="group flex flex-col h-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Cover */}
                  <div
                    className="relative w-full h-56 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                      // Clicking the cover should navigate to the public comic detail page
                      e.stopPropagation();
                      if (comicId) router.push(`/comics/${comicId}`);
                    }}
                  >
                    {comic.cover ? (
                      <img
                        src={comic.cover}
                        alt={comic.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700">
                        <div className="text-center">
                          <svg className="mx-auto mb-2 h-8 w-8 text-neutral-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 19.5V5.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Không có ảnh</p>
                        </div>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute right-3 top-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        comic.status === 'ongoing' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 dark:from-blue-900/30 dark:to-blue-900/20 dark:text-blue-200' :
                        comic.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 dark:from-green-900/30 dark:to-green-900/20 dark:text-green-200' :
                        'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${comic.status === 'ongoing' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-3 min-h-0">
                    {/* Title */}
                    <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex-shrink-0 cursor-pointer"
                      onClick={() => comicId && router.push(`/comics/${comicId}`)}
                    >
                      {comic.title}
                    </h3>

                    {/* Author */}
                    {comic.author && (
                      <p className="mt-1.5 line-clamp-1 text-xs text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                        {comic.author}
                      </p>
                    )}

                    {/* Chapters count */}
                    <div className="mt-auto pt-2 text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                      <span className="font-medium">{comic.chapters ? `${comic.chapters.length} chương` : '0 chương'}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2 flex-shrink-0">
                      {/* Edit & Add Chapter - Only for uploaders who own the comic */}
                      {canEditComic(authContext?.user, comic) ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/comics/${comic._id}/edit`); }}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                          >
                            Sửa
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/comics/${comic._id}/chapters`); }}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition"
                          >
                            Thêm chương
                          </button>
                        </>
                      ) : null}

                      {/* Delete - Only for admins */}
                      {canManageComic(authContext?.user, comic) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(comic._id); }}
                          disabled={deleteLoading === comic._id}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading === comic._id ? "Xóa..." : "Xóa"}
                        </button>
                      )}

                      {/* No permissions message */}
                      {!canEditComic(authContext?.user, comic) && !canManageComic(authContext?.user, comic) && (
                        <span className="w-full text-xs text-neutral-400 italic text-center py-1">Không có quyền</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
