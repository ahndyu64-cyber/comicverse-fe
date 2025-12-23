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
  const [comicTitle, setComicTitle] = useState("");
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
        setComicTitle("");
        setTitle("");
        setImages([]);
      } else {
        const ch = (data.chapters || []).find((c: any) => String(c._id || c.id) === String(chapterId));
        if (!ch) {
          setError("Chương không tìm thấy trong truyện này.");
          setComicTitle("");
          setTitle("");
          setImages([]);
        } else {
          setComicTitle(data.title || "");
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

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savingImages, setSavingImages] = useState(false);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isMobileDragging, setIsMobileDragging] = useState(false);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const gridColumns = 2; // Number of columns in the grid

  function removeSelected(index: number) {
    setSelectedFiles((s) => s.filter((_, i) => i !== index));
  }

  function handleSelectedFileDragStart(index: number) {
    setDraggedFileIndex(index);
  }

  function handleSelectedFileDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleSelectedFileDrop(e: React.DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFileIndex === null || draggedFileIndex === targetIndex) return;

    setSelectedFiles((files) => {
      const newFiles = [...files];
      const draggedFile = newFiles[draggedFileIndex];
      
      // Remove from source
      newFiles.splice(draggedFileIndex, 1);
      
      // Adjust target index if dragging from before to after
      let insertIndex = targetIndex;
      if (draggedFileIndex < targetIndex) {
        insertIndex = targetIndex - 1;
      }
      
      // Insert at target
      newFiles.splice(insertIndex, 0, draggedFile);
      
      return newFiles;
    });
    setDraggedFileIndex(null);
  }

  function handleSelectedFileDragEnd() {
    setDraggedFileIndex(null);
  }

  async function saveImagesToBackend(newImages: string[]) {
    setSavingImages(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const chapterUrl = `${API_BASE}/comics/${comicId}/chapters/${chapterId}`;
      const payload = { images: newImages };

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
        res = await fetch(chapterUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(payload),
        });
      }

      // If chapter endpoint fails, try updating the entire comic
      if (!res.ok && (res.status === 404 || res.status === 401)) {
        const comicData: any = await (await import("../../../../../lib/api")).getAdminComic(comicId);
        if (comicData && comicData.chapters) {
          const updatedChapters = (comicData.chapters || []).map((ch: any) =>
            String(ch._id || ch.id) === String(chapterId)
              ? { ...ch, images: newImages }
              : ch
          );
          const comicPayload = { ...comicData, chapters: updatedChapters };
          delete (comicPayload as any)._id;
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
      }

      if (res.status === 401) {
        alert('Bạn cần đăng nhập để thực hiện hành động này.');
        router.push(`/auth/login?redirect=/admin/comics/${comicId}/chapters/${chapterId}`);
        return false;
      }

      if (!res.ok) {
        let bodyText = "(no body)";
        try {
          const j = await res.json();
          bodyText = j?.message || JSON.stringify(j);
        } catch (e) {
          try { bodyText = await res.text(); } catch (e) {}
        }
        alert(`Không thể lưu ảnh (HTTP ${res.status}): ${bodyText}`);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu ảnh: ' + (err?.message || err));
      return false;
    } finally {
      setSavingImages(false);
    }
  }

  function removeImage(index: number) {
    setImages((imgs) => {
      const newImgs = imgs.filter((_, i) => i !== index);
      // Save to backend
      saveImagesToBackend(newImgs);
      return newImgs;
    });
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setImages((imgs) => {
      const newImgs = [...imgs];
      const [draggedImg] = newImgs.splice(draggedIndex, 1);
      newImgs.splice(targetIndex, 0, draggedImg);
      // Save to backend
      saveImagesToBackend(newImgs);
      return newImgs;
    });
    setDraggedIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  function moveImageUp(index: number) {
    if (index <= 0) return;
    setImages((imgs) => {
      const newImgs = [...imgs];
      [newImgs[index], newImgs[index - 1]] = [newImgs[index - 1], newImgs[index]];
      saveImagesToBackend(newImgs);
      return newImgs;
    });
  }

  function moveImageDown(index: number) {
    if (index >= images.length - 1) return;
    setImages((imgs) => {
      const newImgs = [...imgs];
      [newImgs[index], newImgs[index + 1]] = [newImgs[index + 1], newImgs[index]];
      saveImagesToBackend(newImgs);
      return newImgs;
    });
  }

  function moveImageToStart(index: number) {
    if (index <= 0) return;
    setImages((imgs) => {
      const newImgs = [...imgs];
      const [img] = newImgs.splice(index, 1);
      newImgs.unshift(img);
      saveImagesToBackend(newImgs);
      return newImgs;
    });
  }

  function moveImageToEnd(index: number) {
    if (index >= images.length - 1) return;
    setImages((imgs) => {
      const newImgs = [...imgs];
      const [img] = newImgs.splice(index, 1);
      newImgs.push(img);
      saveImagesToBackend(newImgs);
      return newImgs;
    });
  }

  function handleMobileTouchStart(index: number, e: React.TouchEvent<HTMLDivElement>) {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    
    // Start long press timer
    const timer = setTimeout(() => {
      setTouchDragIndex(index);
      setIsMobileDragging(true);
    }, 300); // 300ms long press
    
    setLongPressTimer(timer);
  }

  function handleMobileTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (touchDragIndex === null || !isMobileDragging) return;
    
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = touchStartY - currentY;
    const deltaX = currentX - touchStartX;
    
    // Determine dominant direction
    const absDeltaY = Math.abs(deltaY);
    const absDeltaX = Math.abs(deltaX);
    
    // Move up if swiped down (negative deltaY, dominant Y)
    if (absDeltaY > absDeltaX && deltaY > 50 && touchDragIndex > gridColumns - 1) {
      moveImageUp(touchDragIndex);
      setTouchDragIndex(touchDragIndex - gridColumns);
      setTouchStartY(currentY);
      setTouchStartX(currentX);
    }
    // Move down if swiped up (positive deltaY, dominant Y)
    else if (absDeltaY > absDeltaX && deltaY < -50 && touchDragIndex < images.length - gridColumns) {
      moveImageDown(touchDragIndex);
      setTouchDragIndex(touchDragIndex + gridColumns);
      setTouchStartY(currentY);
      setTouchStartX(currentX);
    }
    // Move left if swiped right (positive deltaX, dominant X)
    else if (absDeltaX > absDeltaY && deltaX > 50 && touchDragIndex % gridColumns !== 0) {
      moveImageUp(touchDragIndex);
      setTouchDragIndex(touchDragIndex - 1);
      setTouchStartY(currentY);
      setTouchStartX(currentX);
    }
    // Move right if swiped left (negative deltaX, dominant X)
    else if (absDeltaX > absDeltaY && deltaX < -50 && touchDragIndex % gridColumns !== gridColumns - 1 && touchDragIndex < images.length - 1) {
      moveImageDown(touchDragIndex);
      setTouchDragIndex(touchDragIndex + 1);
      setTouchStartY(currentY);
      setTouchStartX(currentX);
    }
  }

  function handleMobileTouchEnd() {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setTouchDragIndex(null);
    setIsMobileDragging(false);
  }

  if (!comicId || !chapterId) return <div className="p-8">ID truyện hoặc chương không hợp lệ</div>;

  return (
    <div className="mx-auto max-w-5xl px-0 sm:px-2 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Chương</h1>
          <div className="text-sm text-neutral-500 dark:text-white">{comicTitle || '—'} · {title || '—'}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/admin/comics/${comicId}/chapters`)} className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-white px-3 py-2 flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-black p-6 shadow">
        {loading ? (
          <div className="dark:text-white">Đang tải...</div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                {editing ? (
                  <div className="flex gap-2">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-2 py-1 bg-white dark:bg-black dark:text-white dark:border-neutral-600" />
                    <button onClick={saveTitle} disabled={saving} className="px-3 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-white">{saving ? 'Đang lưu...' : 'Lưu'}</button>
                    <button onClick={() => { setEditing(false); load(); }} className="px-3 py-1 rounded bg-neutral-100 dark:bg-neutral-800 dark:text-white">Hủy</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold dark:text-white">{title || '—'}</h2>
                    <button onClick={() => setEditing(true)} className="px-3 py-1 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-white">Sửa tiêu đề</button>
                  </div>
                )}
              </div>
              <div className="text-sm text-neutral-400 dark:text-white">{images?.length || 0} ảnh</div>
            </div>

            {/* Upload controls */}
            <div className="mb-4">
              <div className="mb-3">
                <input id="file-input" multiple type="file" accept="image/*" onChange={onSelectFiles} className="hidden" />
                <label htmlFor="file-input" className="inline-flex items-center gap-2 cursor-pointer rounded-md border px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white">Thêm ảnh</label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mb-4 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                  <div className="text-sm font-medium mb-3 dark:text-white">Ảnh đã chọn ({selectedFiles.length})</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => handleSelectedFileDragStart(i)}
                        onDragOver={handleSelectedFileDragOver}
                        onDrop={(e) => handleSelectedFileDrop(e, i)}
                        onDragEnd={handleSelectedFileDragEnd}
                        className={`relative w-full h-40 rounded overflow-hidden border dark:border-neutral-700 group cursor-move transition-all ${
                          draggedFileIndex === i ? 'opacity-50 scale-95 border-blue-500' : 'hover:border-blue-500'
                        }`}
                      >
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                        <button onClick={() => removeSelected(i)} className="absolute top-1 right-1 rounded bg-red-600 text-white text-xs px-1.5 py-0.5 hover:bg-red-700 transition-colors">×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={uploadSelected} disabled={uploading} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition">{uploading ? 'Đang tải...' : 'Tải lên'}</button>
                </div>
              )}
            </div>

            <div className="border-t dark:border-neutral-700 pt-4">
              <div className="text-sm font-medium mb-3 dark:text-white">Ảnh đã tải lên ({images?.length || 0})</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images && images.length > 0 ? (
                  images.map((src, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, i)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleMobileTouchStart(i, e)}
                      onTouchMove={handleMobileTouchMove}
                      onTouchEnd={handleMobileTouchEnd}
                      className={`relative overflow-hidden rounded border dark:border-neutral-700 group transition-all ${
                        draggedIndex === i ? 'opacity-50 scale-95 border-blue-500' : 'hover:border-blue-500'
                      } ${touchDragIndex === i ? 'ring-2 ring-blue-500 scale-95' : ''}`}
                      style={{ touchAction: 'none' }}
                    >
                      <img src={src} alt={`img-${i}`} className="w-full h-40 object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-2 left-2 p-1.5 rounded bg-red-600 hover:bg-red-700 text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        title="Xóa ảnh"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 3v1H5v2h1v13a2 2 0 002 2h8a2 2 0 002-2V6h1V4h-4V3H9zm0 5h2v8H9V8zm4 0h2v8h-2V8z" />
                        </svg>
                      </button>
                      
                      {/* Mobile long-press hint */}
                      {isMobileDragging && touchDragIndex === i && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 md:hidden">
                          <span className="text-white text-xs font-semibold bg-blue-600 px-2 py-1 rounded">Kéo để di chuyển</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-sm text-neutral-500 dark:text-white text-center py-8">Chưa có ảnh cho chương này.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
