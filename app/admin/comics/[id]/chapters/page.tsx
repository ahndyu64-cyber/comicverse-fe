"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { API_BASE, getAdminComic, type Chapter } from "../../../../lib/api";
import { hasAdminOrModeratorRole, canManageComic } from "../../../../lib/auth";

export default function AdminChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const comicId = (params as any)?.id as string;
  const authContext = useAuth();
  const isAuthorized = hasAdminOrModeratorRole(authContext?.user);
  const isAuthLoading = authContext?.isLoading ?? true;

  const [comicTitle, setComicTitle] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteChapterTitle, setDeleteChapterTitle] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!comicId) return;
    
    // Wait for auth to be ready
    if (isAuthLoading) {
      return;
    }

    if (!isAuthorized) {
      setError("Bạn cần quyền quản lý truyện (Admin hoặc Uploader) để xem trang này.");
      setLoading(false);
      return;
    }
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comicId, isAuthorized, isAuthLoading]);

  async function loadChapters() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await getAdminComic(comicId);
      if (!data) {
        setError("Không thể tải truyện (cần đăng nhập hoặc truyện không tồn tại)");
        setChapters([]);
      } else {
        // Check if user can manage this comic
        if (!canManageComic(authContext?.user, data)) {
          setError("Bạn không có quyền quản lý chương của truyện này. Chỉ người tạo truyện hoặc Admin mới có thể quản lý.");
          setChapters([]);
          return;
        }
        setComicTitle(data.title || "");
        // Sort chapters by date (newest first), using the correct field name
        const sortedChapters = (data.chapters || []).sort((a, b) => {
          // Try to sort by date if available (chapters have 'date' field)
          const aDate = a.date || a.createdAt;
          const bDate = b.date || b.createdAt;
          if (aDate && bDate) {
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          }
          // Fallback: sort by ID to ensure consistent order
          return String(b._id || '').localeCompare(String(a._id || ''));
        });
        setChapters(sortedChapters);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function createChapter() {
    if (!newTitle.trim()) return alert("Tiêu đề chương không được để trống");
    setCreating(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE}/comics/${comicId}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.status === 401) {
        // Unauthorized — redirect to login with return path
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters`);
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `API error ${res.status}`);
      }
      setNewTitle("");
      await loadChapters();
    } catch (err: any) {
      console.error(err);
      alert("Không thể tạo chương: " + (err?.message || err));
    } finally {
      setCreating(false);
    }
  }

  async function startEdit(ch: Chapter) {
    setEditingId(ch._id || null);
    setEditingTitle(ch.title || "");
  }

  async function saveEdit(id: string) {
    if (!editingTitle.trim()) return alert("Tiêu đề chương không được để trống");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const chapterId = String(id || editingId || "").trim();
      const url = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;
      const payload = { title: editingTitle };

      // Try PATCH first, but if backend doesn't support PATCH we attempt a PUT fallback.
      let res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters`);
        return;
      }

      if (res.status === 404) {
        // Some backends expose PUT instead of PATCH for updates. Try a PUT fallback and surface both errors if it fails.
        console.warn(`[chapters] PATCH 404 for ${url}, trying PUT fallback`);
        res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        // Try to parse JSON error body, otherwise fallback to plain text
        let bodyText: string;
        try {
          const bodyJson = await res.json();
          bodyText = bodyJson?.message || JSON.stringify(bodyJson);
        } catch (e) {
          // Not JSON
          try {
            bodyText = await res.text();
          } catch (ee) {
            bodyText = String(ee || "(no body)");
          }
        }

        // Log detailed info to help debugging (URL, payload, status, body)
        console.error(`[chapters] Update failed`, { url, status: res.status, body: bodyText, payload });

        // Show a helpful alert to the admin
        alert(`Không thể cập nhật chương (HTTP ${res.status}): ${bodyText}`);

        throw new Error(`HTTP ${res.status}: ${bodyText}`);
      }
      setEditingId(null);
      setEditingTitle("");
      await loadChapters();
    } catch (err: any) {
      console.error(err);
      alert("Không thể cập nhật chương: " + (err?.message || err));
    }
  }

  async function removeChapter(id: string) {
    const chapter = chapters.find(c => c._id === id);
    console.log('Removing chapter:', { id, chapter, allChapters: chapters, chapterIndex: chapters.findIndex(c => c._id === id) });
    setDeleteChapterTitle(chapter?.title || "chương");
    setShowDeleteConfirm(id);
  }

  async function confirmRemoveChapter(id: string) {
    const targetChapter = chapters.find(c => c._id === id);
    const chapterIndex = chapters.findIndex(c => c._id === id);
    console.log('Confirming delete for chapter ID:', id, 'Chapter:', targetChapter, 'Index:', chapterIndex, 'All chapters:', chapters);
    
    // Verify we found the right chapter
    if (!targetChapter) {
      alert('Lỗi: Không tìm thấy chương để xóa');
      return;
    }
    
    setShowDeleteConfirm(null);
    setDeleteLoading(id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const chapterId = String(id).trim();
      const url = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;
      console.log('DELETE URL:', url, 'Target chapter:', targetChapter, 'Chapter index in array:', chapterIndex);

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.status === 401) {
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters`);
        return;
      }

      if (res.status === 404) {
        const txt = await res.text();
        throw new Error(`Chương không tồn tại (404): ${txt}`);
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      await loadChapters();
    } catch (err: any) {
      console.error(err);
      alert("Không thể xóa chương: " + (err?.message || err));
    } finally {
      setDeleteLoading(null);
    }
  }

  if (!comicId) return <div className="p-8">ID truyện không hợp lệ</div>;

  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-2 py-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-black p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý chương</h1>
          <p className="text-sm opacity-90">{comicTitle || '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/comics')} className="rounded-md bg-white/20 px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/30 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create column */}
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-black p-6 shadow">
          <h2 className="text-lg font-semibold mb-3 dark:text-white">Thêm chương mới</h2>
          <div className="flex gap-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Tiêu đề chương" className="flex-1 rounded-md border border-neutral-200 px-3 py-2 focus:ring-2 focus:ring-purple-200" />
            <button onClick={createChapter} disabled={creating} className="rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-semibold">{creating ? 'Đang tạo...' : 'Tạo'}</button>
          </div>
        </div>

        {/* List column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white dark:bg-black p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Danh sách chương ({chapters?.length || 0})</h3>
              <div className="text-sm text-neutral-500 dark:text-white">Quản lý, sửa hoặc xóa chương</div>
            </div>

            {loading ? (
              <div className="p-6">Đang tải...</div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : (
              <div className="space-y-3">
                {chapters && chapters.map((ch, index) => {
                  if (!ch._id) {
                    console.warn('Chapter missing _id at index:', index, ch);
                    return null;
                  }
                  return (
                  <div key={ch._id} className="flex items-center justify-between rounded-lg border bg-white dark:bg-black dark:border-neutral-800 p-4">
                    <div className="flex-1">
                      {editingId === ch._id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                      ) : (
                        <div className="font-medium text-sm dark:text-white">{ch.title}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {editingId === ch._id ? (
                        <>
                          <button onClick={() => saveEdit(ch._id!)} className="px-3 py-1.5 rounded-md bg-gradient-to-br from-green-100 to-green-50 text-green-700 text-sm font-semibold hover:from-green-200 hover:to-green-100 transition shadow-sm hover:shadow-md">Lưu</button>
                          <button onClick={() => { setEditingId(null); setEditingTitle(""); }} className="px-3 py-1.5 rounded-md bg-gradient-to-br from-neutral-100 to-neutral-50 text-neutral-700 text-sm font-semibold hover:from-neutral-200 hover:to-neutral-100 transition shadow-sm hover:shadow-md">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(ch)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 dark:text-white text-sm font-semibold hover:from-amber-200 hover:to-amber-100 transition shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            <span>Sửa</span>
                          </button>
                          <button onClick={() => router.push(`/admin/comics/${comicId}/chapters/${ch._id}`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700 dark:text-white text-sm font-semibold hover:from-sky-200 hover:to-sky-100 transition shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span>Mở</span>
                          </button>
                          <button onClick={() => removeChapter(ch._id!)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-br from-red-100 to-red-50 text-red-700 text-sm font-semibold hover:from-red-200 hover:to-red-100 transition shadow-sm hover:shadow-md">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Xóa</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

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
                Bạn có chắc chắn muốn xóa chương <span className="font-bold text-red-600 dark:text-red-400">"{deleteChapterTitle}"</span>?
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
                onClick={() => confirmRemoveChapter(showDeleteConfirm!)}
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
  );
}
