"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE, getChapterImages } from "../../../../../lib/api";
import { uploadChapterImage, validateImageFile } from "../../../../../lib/cloudinary";

export default function AdminChapterDetail() {
  const params = useParams() as any;
  const router = useRouter();
  const comicId = String(params?.id || "").trim();
  const chapterId = String(params?.chapterId || "").trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!comicId || !chapterId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comicId, chapterId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Some backends do not expose a dedicated GET /comics/:id/chapters/:chapterId endpoint.
      // Fetch the full comic and read the chapter from the embedded chapters array instead.
      const data: any = await (await import("../../../../../lib/api")).getAdminComic(comicId);
      if (!data) {
        setError("Không thể tải chương (cần đăng nhập hoặc truyện không tồn tại)");
        setTitle("");
        setImages([]);
      } else {
        const ch = (data.chapters || []).find((c: any) => String(c._id || c.id) === String(chapterId));
        if (!ch) {
          setError("Chương không tìm thấy trong truyện này.");
          setTitle("");
          setImages([]);
        } else {
          setTitle(ch.title || "");
          setImages(ch.images || []);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveTitle() {
    if (!title.trim()) return alert("Tiêu đề chương không được để trống");
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const url = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;
      const payload = { title };

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
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters/${chapterId}`);
        return;
      }

      if (res.status === 404) {
        // fallback to PUT
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
        let bodyText = "(no body)";
        try {
          const j = await res.json();
          bodyText = j?.message || JSON.stringify(j);
        } catch (e) {
          try { bodyText = await res.text(); } catch (e) {}
        }
        console.error("[chapters] saveTitle failed", { url, status: res.status, body: bodyText, payload });
        alert(`Không thể lưu tiêu đề (HTTP ${res.status}): ${bodyText}`);
        return;
      }

      setEditing(false);
      await load();
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi lưu: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  // Upload selected files to Cloudinary via backend and persist URLs to chapter
  async function uploadSelected() {
    if (selectedFiles.length === 0) return alert('Chưa chọn ảnh để tải lên');
    setUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      // Debug: show whether a token will be sent (don't print full token)
      try { console.log('[chapters] uploadSelected token present:', !!token, token ? `${String(token).slice(0,8)}...` : 'no token'); } catch {}
      const uploadedUrls: string[] = [];
      
      for (const file of selectedFiles) {
        // Validate file before upload
        const validation = validateImageFile(file, 10);
        if (!validation.valid) {
          throw new Error(validation.error || 'Lỗi xác thực file');
        }

        // Upload using cloudinary utility
        const uploadResult = await uploadChapterImage(file, token ?? undefined);
        const imageUrl = uploadResult.secure_url || uploadResult.url;
        uploadedUrls.push(imageUrl);
      }

      // Persist new images list on backend by updating the chapter
      const newImages = [...(images || []), ...uploadedUrls];
      const chapterUrl = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;
      const payload = { images: newImages };

      // Since backend does not support PUT /comics/:id/chapters/:chapterId,
      // we'll update the entire comic object instead
      console.log("[chapters] Attempting to save via chapter endpoint, fallback to comic update if needed");

      let res = await fetch(chapterUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      // PATCH 404 → try PUT
      if (res.status === 404) {
        console.warn("[chapters] PATCH 404, trying PUT with Bearer");
        res = await fetch(chapterUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      // PUT 404 → try POST
      if (res.status === 404) {
        console.warn("[chapters] PUT 404, trying POST with Bearer");
        res = await fetch(chapterUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      // Any 401 → try without Bearer prefix
      if (res.status === 401) {
        console.warn("[chapters] 401 with Bearer, trying raw token (no Bearer prefix)");
        res = await fetch(chapterUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401) {
        console.warn("[chapters] Still 401, trying POST with raw token");
        res = await fetch(chapterUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      // If chapter endpoint fails, try updating the entire comic with new chapter data
      if (!res.ok && (res.status === 404 || res.status === 401)) {
        console.warn("[chapters] Chapter update failed, falling back to comic update endpoint");
        
        // Fetch current comic to get all chapters, update the target chapter, and send back
        try {
          const comicData: any = await (await import("../../../../../lib/api")).getAdminComic(comicId);
          if (comicData && comicData.chapters) {
            const updatedChapters = (comicData.chapters || []).map((ch: any) =>
              String(ch._id || ch.id) === String(chapterId)
                ? { ...ch, images: newImages }
                : ch
            );
            const comicPayload = { ...comicData, chapters: updatedChapters };
            delete (comicPayload as any)._id; // Remove _id to avoid conflicts
            delete (comicPayload as any).id;

            const comicUrl = `${API_BASE}/comics/${comicId}`;
            res = await fetch(comicUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(comicPayload),
            });

            // If PUT fails, try PATCH
            if (!res.ok) {
              res = await fetch(comicUrl, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ chapters: updatedChapters }),
              });
            }
          }
        } catch (fallbackErr: any) {
          console.error("[chapters] Fallback comic update failed:", fallbackErr);
        }
      }

      if (res.status === 401) {
        console.warn("[chapters] All auth attempts failed - redirecting to login");
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters/${chapterId}`);
        return;
      }

      if (!res.ok) {
        let bodyText = "(no body)";
        try {
          const j = await res.json();
          bodyText = j?.message || JSON.stringify(j);
        } catch (e) {
          try { bodyText = await res.text(); } catch (e) {}
        }
        // Log chi tiết lỗi để debug dễ dàng
        console.error(`[chapters] save images failed: status=${res.status}, body=${bodyText}, token=${token ? "yes" : "no"}, payload size=${JSON.stringify(payload).length}`);
        alert(`Không thể lưu ảnh (HTTP ${res.status}): ${bodyText}`);
        return;
      }

      // success
      setImages(newImages);
      setSelectedFiles([]);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi tải ảnh: ' + (err?.message || err));
    } finally {
      setUploading(false);
    }
  }

  function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles((s) => [...s, ...files]);
    // reset input value to allow re-selecting the same file if needed
    e.currentTarget.value = '';
  }

  function removeSelected(index: number) {
    setSelectedFiles((s) => s.filter((_, i) => i !== index));
  }

  if (!comicId || !chapterId) return <div className="p-8">ID truyện hoặc chương không hợp lệ</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chương</h1>
          <div className="text-sm text-neutral-500">Truyện: {comicId} · Chương: {chapterId}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/admin/comics/${comicId}/chapters`)} className="rounded bg-neutral-100 px-3 py-2">Quay lại</button>
          <button onClick={() => router.push(`/admin/comics/${comicId}/edit`)} className="rounded bg-sky-100 px-3 py-2">Sửa truyện</button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow">
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                {editing ? (
                  <div className="flex gap-2">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-2 py-1" />
                    <button onClick={saveTitle} disabled={saving} className="px-3 py-1 rounded bg-amber-50 text-amber-700">{saving ? 'Đang lưu...' : 'Lưu'}</button>
                    <button onClick={() => { setEditing(false); load(); }} className="px-3 py-1 rounded bg-neutral-100">Hủy</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">{title || '—'}</h2>
                    <button onClick={() => setEditing(true)} className="px-3 py-1 rounded bg-amber-50 text-amber-700">Sửa tiêu đề</button>
                  </div>
                )}
              </div>
              <div className="text-sm text-neutral-400">{images?.length || 0} ảnh</div>
            </div>

            {/* Upload controls */}
            <div className="mb-4 flex items-start gap-4">
              <div>
                <input id="file-input" multiple type="file" accept="image/*" onChange={onSelectFiles} className="hidden" />
                <label htmlFor="file-input" className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm bg-neutral-50">Thêm ảnh</label>
              </div>
              <div className="flex-1">
                {selectedFiles.length > 0 ? (
                  <div className="mb-2">
                    <div className="text-sm font-medium">Ảnh đã chọn ({selectedFiles.length})</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="relative w-24 h-24 rounded overflow-hidden border">
                          <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                          <button onClick={() => removeSelected(i)} className="absolute top-1 right-1 rounded bg-red-600 text-white text-xs px-1">X</button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <button onClick={uploadSelected} disabled={uploading} className="px-3 py-1 rounded bg-green-600 text-white">{uploading ? 'Đang tải...' : 'Tải lên'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">Chưa chọn ảnh để tải lên.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images && images.length > 0 ? (
                images.map((src, i) => (
                  <div key={i} className="overflow-hidden rounded border">
                    <img src={src} alt={`img-${i}`} className="w-full h-40 object-cover" />
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral-500">Chưa có ảnh cho chương này.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
