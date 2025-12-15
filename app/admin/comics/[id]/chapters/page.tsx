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
        setChapters(data.chapters || []);
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
    if (!confirm("Bạn có chắc muốn xóa chương này?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const chapterId = String(id).trim();
      const url = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;

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
    }
  }

  if (!comicId) return <div className="p-8">ID truyện không hợp lệ</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-black p-6 text-white shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý chương</h1>
          <p className="text-sm opacity-90">{comicTitle || '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/comics')} className="rounded-md bg-white/20 px-3 py-2 text-sm">Quay lại</button>
          <button onClick={() => router.push(`/admin/comics/${comicId}/edit`)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-purple-700">Sửa truyện</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create column */}
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Thêm chương mới</h2>
          <div className="flex gap-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Tiêu đề chương" className="flex-1 rounded-md border border-neutral-200 px-3 py-2 focus:ring-2 focus:ring-purple-200" />
            <button onClick={createChapter} disabled={creating} className="rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-semibold">{creating ? 'Đang tạo...' : 'Tạo'}</button>
          </div>
        </div>

        {/* List column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Danh sách chương ({chapters?.length || 0})</h3>
              <div className="text-sm text-neutral-500">Quản lý, sửa hoặc xóa chương</div>
            </div>

            {loading ? (
              <div className="p-6">Đang tải...</div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : (
              <div className="space-y-3">
                {[...chapters].reverse().map((ch) => (
                  <div key={ch._id} className="flex items-center justify-between rounded-lg border bg-white dark:bg-neutral-900 p-4">
                    <div className="flex-1">
                      {editingId === ch._id ? (
                        <input className="w-full rounded-md border px-2 py-1" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                      ) : (
                        <div className="font-medium text-sm">{ch.title}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {editingId === ch._id ? (
                        <>
                          <button onClick={() => saveEdit(ch._id!)} className="px-3 py-1 rounded-md bg-amber-50 text-amber-700">Lưu</button>
                          <button onClick={() => { setEditingId(null); setEditingTitle(""); }} className="px-3 py-1 rounded-md bg-neutral-100">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(ch)} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-700">
                            <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20l7.5-1.5L20 9.5 15.232 5.232 4 20z" />
                            </svg>
                            <span className="text-sm">Sửa</span>
                          </button>
                          <button onClick={() => router.push(`/admin/comics/${comicId}/chapters/${ch._id}`)} className="px-3 py-1 rounded-md bg-sky-50 text-sky-700">Mở</button>
                          <button onClick={() => removeChapter(ch._id!)} className="px-3 py-1 rounded-md bg-red-50 text-red-700">Xóa</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
