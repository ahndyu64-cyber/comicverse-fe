'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { hasAdminOrModeratorRole } from '../../lib/auth';
import { uploadFile } from '../../lib/cloudinary';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface Banner {
  _id: string;
  src: string;
  comicId: string;
  comicTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminBannersPage() {
  const router = useRouter();
  const authContext = useAuth();
  const isAuthorized = hasAdminOrModeratorRole(authContext?.user);
  const isAuthLoading = authContext?.isLoading ?? true;

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newComicId, setNewComicId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editComicId, setEditComicId] = useState('');
  const [comics, setComics] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [comicSearch, setComicSearch] = useState('');
  const [editComicSearch, setEditComicSearch] = useState('');

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthorized) {
      setError('Bạn cần quyền quản lý (Admin hoặc Uploader) để xem trang này.');
      setLoading(false);
      return;
    }
    loadBanners();
    loadComics();
  }, [isAuthorized, isAuthLoading]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      // Simulate loading from storage or use local state
      const savedBanners = localStorage.getItem('banners');
      if (savedBanners) {
        setBanners(JSON.parse(savedBanners));
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
      setError('Lỗi khi tải banner');
    } finally {
      setLoading(false);
    }
  };

  const loadComics = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/comics?limit=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setComics(Array.isArray(data) ? data : data.items || data.comics || []);
      }
    } catch (err) {
      console.error('Error loading comics:', err);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      alert('Vui lòng đăng nhập để upload banner');
      router.push('/auth/login');
      return;
    }

    if (!newBannerFile || !newComicId) {
      alert('Vui lòng chọn ảnh và truyện');
      return;
    }

    setSaving(true);
    try {
      const uploadResult = await uploadFile(newBannerFile, 'banner', token);
      
      if (uploadResult.url) {
        const newBanner: Banner = {
          _id: Date.now().toString(),
          src: uploadResult.url,
          comicId: newComicId,
          comicTitle: comics.find(c => c._id === newComicId)?.title,
          createdAt: new Date().toISOString(),
        };
        
        const updatedBanners = [...banners, newBanner];
        setBanners(updatedBanners);
        localStorage.setItem('banners', JSON.stringify(updatedBanners));
        
        setNewBannerFile(null);
        setNewComicId('');
        alert('Thêm banner thành công');
      } else {
        alert('Lỗi khi upload ảnh');
      }
    } catch (err) {
      console.error('Error adding banner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        alert('Token hết hạn, vui lòng đăng nhập lại');
        router.push('/auth/login');
      } else {
        alert('Lỗi khi thêm banner: ' + errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBanner = async (id: string) => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      alert('Vui lòng đăng nhập để cập nhật banner');
      router.push('/auth/login');
      return;
    }

    if (!editComicId && !editFile) {
      alert('Vui lòng chọn truyện hoặc ảnh mới');
      return;
    }

    setSaving(true);
    try {
      let newSrc = banners.find(b => b._id === id)?.src;

      if (editFile) {
        const uploadResult = await uploadFile(editFile, 'banner', token);
        if (uploadResult.url) {
          newSrc = uploadResult.url;
        } else {
          alert('Lỗi khi upload ảnh');
          setSaving(false);
          return;
        }
      }

      const updatedBanners = banners.map(banner => {
        if (banner._id === id) {
          return {
            ...banner,
            src: newSrc!,
            comicId: editComicId || banner.comicId,
            comicTitle: comics.find(c => c._id === (editComicId || banner.comicId))?.title,
            updatedAt: new Date().toISOString(),
          };
        }
        return banner;
      });
      
      setBanners(updatedBanners);
      localStorage.setItem('banners', JSON.stringify(updatedBanners));
      setEditingId(null);
      setEditFile(null);
      setEditComicId('');
      alert('Cập nhật banner thành công');
    } catch (err) {
      console.error('Error updating banner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        alert('Token hết hạn, vui lòng đăng nhập lại');
        router.push('/auth/login');
      } else {
        alert('Lỗi khi cập nhật banner: ' + errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;

    setDeleteLoading(id);
    try {
      const updatedBanners = banners.filter(b => b._id !== id);
      setBanners(updatedBanners);
      localStorage.setItem('banners', JSON.stringify(updatedBanners));
      alert('Xóa banner thành công');
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert('Lỗi khi xóa banner');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-sky-600"></div>
          </div>
          <p className="text-gray-600">Đang tải danh sách banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý Banner</h1>
              <p className="mt-1 text-gray-600 dark:text-neutral-400">Tổng cộng: <span className="font-semibold text-gray-900 dark:text-white">{banners.length}</span> banner</p>
            </div>
            <Link
              href="/admin/comics"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
            >
              ← Quay lại
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Add New Banner Form */}
        <div className="mb-8 rounded-lg bg-white dark:bg-neutral-900 p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Thêm banner mới</h2>
          <form onSubmit={handleAddBanner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Chọn ảnh banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewBannerFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-4 py-2 text-gray-900 dark:text-black bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {newBannerFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400">Tệp được chọn: {newBannerFile.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Chọn truyện</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm tên truyện..."
                  value={comicSearch}
                  onChange={(e) => setComicSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-4 py-2 text-gray-900 dark:text-black bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {comicSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-10">
                    {comics
                      .filter(c => c.title && c.title.toLowerCase().includes(comicSearch.toLowerCase()))
                      .map((comic) => (
                        <button
                          key={comic._id}
                          type="button"
                          onClick={() => {
                            setNewComicId(comic._id);
                            setComicSearch('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-900 dark:text-white transition-colors"
                        >
                          {comic.title}
                        </button>
                      ))}
                  </div>
                )}
                {newComicId && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Đã chọn: {comics.find(c => c._id === newComicId)?.title || newComicId}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !newBannerFile}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Đang thêm...' : 'Thêm banner'}
            </button>
          </form>
        </div>

        {/* Banners List */}
        <div className="rounded-lg bg-white dark:bg-neutral-900 shadow overflow-hidden">
          {banners.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-neutral-400">
              <p>Chưa có banner nào. Hãy thêm banner mới.</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-neutral-700">
              {banners.map((banner) => (
                <div key={banner._id} className="p-6">
                  {editingId === banner._id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Chọn ảnh mới (tuỳ chọn)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-4 py-2 text-gray-900 dark:text-black bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Chọn truyện</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm tên truyện..."
                            value={editComicSearch}
                            onChange={(e) => setEditComicSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 px-4 py-2 text-gray-900 dark:text-black bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {editComicSearch && (
                            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-10">
                              {comics
                                .filter(c => c.title && c.title.toLowerCase().includes(editComicSearch.toLowerCase()))
                                .map((comic) => (
                                  <button
                                    key={comic._id}
                                    type="button"
                                    onClick={() => {
                                      setEditComicId(comic._id);
                                      setEditComicSearch('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-900 dark:text-white transition-colors"
                                  >
                                    {comic.title}
                                  </button>
                                ))}
                            </div>
                          )}
                          {editComicId && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                Đã chọn: {comics.find(c => c._id === editComicId)?.title || editComicId}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateBanner(banner._id)}
                          disabled={saving}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <img src={banner.src} alt="banner" className="h-24 w-40 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-neutral-400">
                          <span className="font-semibold text-gray-900 dark:text-white">Truyện:</span> {banner.comicTitle || banner.comicId}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(banner._id);
                            setEditComicId(banner.comicId);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 px-3 py-1.5 text-sm font-semibold hover:from-amber-200 hover:to-amber-100 transition shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner._id)}
                          disabled={deleteLoading === banner._id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-red-100 to-red-50 text-red-700 px-3 py-1.5 text-sm font-semibold hover:from-red-200 hover:to-red-100 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {deleteLoading === banner._id ? 'Xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
