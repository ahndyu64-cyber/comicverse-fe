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
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-none shadow-sm"
              />
              <button className="rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">Tìm</button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-neutral-600">Sắp xếp:</label>
              <select className="rounded-md border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
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
        {comics.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-900 p-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <span className="text-3xl text-gray-400">—</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Không có truyện nào</h3>
            <p className="mt-1 text-gray-600">Bắt đầu bằng cách thêm truyện đầu tiên của bạn</p>
            <Link
              href="/admin/comics/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              <span className="text-lg">+</span>
              Tạo truyện mới
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {comics.map((comic) => {
              const statusBadge = getStatusBadge(comic.status);
              const comicId = comic._id || comic.id;
              
              // Debug: log comic ID
              if (!comicId) {
                console.warn('Comic has no ID:', comic);
              }
              
              return (
                <div
                  key={comicId}
                  className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-900 transition-transform transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {/* Cover */}
                  <div
                    className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100 cursor-pointer"
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
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
                        <div className="text-center">
                          <svg className="mx-auto mb-2 h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 19.5V5.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 3v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="text-sm text-gray-500">Không có ảnh</p>
                        </div>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute right-3 top-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        comic.status === 'ongoing' ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 dark:from-blue-900/30 dark:text-blue-200' :
                        comic.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 dark:from-green-900/30 dark:text-green-200' :
                        'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${comic.status === 'ongoing' ? 'bg-blue-600' : 'bg-green-600'}`}></span>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400">
                      {comic.title}
                    </h3>
                    {comic.author && (
                      <p className="mt-1 line-clamp-1 text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 mr-2">Tác giả</span>
                        <span className="font-medium text-neutral-900 dark:text-white">{comic.author}</span>
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <div>
                        <span className="text-neutral-700 dark:text-neutral-300">{comic.chapters ? `${comic.chapters.length} chương` : '0 chương'}</span>
                      </div>

                      {/* Actions: Edit, Add Chapter (uploaders only), Delete (admins only) */}
                      <div className="flex items-center gap-2">
                        {/* Edit & Add Chapter - Only for uploaders who own the comic */}
                        {canEditComic(authContext?.user, comic) ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/comics/${comic._id}/edit`); }}
                              className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            >
                              Sửa
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/admin/comics/${comic._id}/chapters`); }}
                              className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition"
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
                            className="inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {deleteLoading === comic._id ? "Xóa..." : "Xóa"}
                          </button>
                        )}

                        {/* No permissions message */}
                        {!canEditComic(authContext?.user, comic) && !canManageComic(authContext?.user, comic) && (
                          <span className="text-xs text-neutral-400 italic">Không có quyền quản lý</span>
                        )}
                      </div>
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
