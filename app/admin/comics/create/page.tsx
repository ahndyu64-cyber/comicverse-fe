"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAdminComic, getGenres } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import { hasAdminOrModeratorRole } from "../../../lib/auth";
import { uploadComicCover, validateImageFile } from "../../../lib/cloudinary";
import { useEffect } from "react";

type Comic = {
  title: string;
  author?: string;
  authors?: string[];
  description?: string;
  cover?: string;
  genres?: string[];
  status?: string;
};

export default function CreateComicPage() {
  const router = useRouter();
  const authContext = useAuth();
  const isAuthorized = hasAdminOrModeratorRole(authContext?.user);
  const isAuthLoading = authContext?.isLoading ?? true;
  
  const [isDark, setIsDark] = useState(false);

  // Dynamic style tag for dark mode CSS variables
  useEffect(() => {
    const styleId = 'comic-create-dark-vars';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        :root {
          --input-bg: #ffffff !important;
          --input-text: #111827 !important;
          --input-border: #e5e7eb !important;
          --label-text: #374151 !important;
          --genre-bg: #f9fafb !important;
          --genre-bg-selected: #dbeafe !important;
          --genre-text: #374151 !important;
        }
        html.dark {
          --input-bg: #000000 !important;
          --input-text: #f3f4f6 !important;
          --input-border: #374151 !important;
          --label-text: #f3f4f6 !important;
          --genre-bg: #1f2937 !important;
          --genre-bg-selected: #1e3a8a !important;
          --genre-text: #f3f4f6 !important;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --input-bg: #000000 !important;
            --input-text: #f3f4f6 !important;
            --input-border: #374151 !important;
            --label-text: #f3f4f6 !important;
            --genre-bg: #1f2937 !important;
            --genre-bg-selected: #1e3a8a !important;
            --genre-text: #f3f4f6 !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(hasDarkClass);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Set initial state
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [formData, setFormData] = useState<Comic>({
    title: "",
    author: "",
    description: "",
    cover: "",
    status: "ongoing",
  });

  useEffect(() => {
    // Wait for auth to be ready
    if (isAuthLoading) {
      return;
    }

    if (!isAuthorized) {
      setError("Bạn cần quyền quản lý truyện (Admin hoặc Uploader) để tạo truyện.");
      return;
    }
    loadGenres();
  }, [isAuthorized, isAuthLoading]);

  const loadGenres = async () => {
    try {
      const data = await getGenres();
      if (Array.isArray(data)) {
        setGenres(data.map((g: any) => g.name || g));
      }
    } catch (err) {
      console.error("Error loading genres:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 10);
    if (!validation.valid) {
      setError(validation.error || 'Lỗi xác thực file');
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Upload using cloudinary utility, forward JWT from auth context if available
      const jwt = authContext?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      // Debug: confirm token presence (only print a short prefix)
      console.log('uploadCover jwt present:', !!jwt, jwt ? `${jwt.slice(0,8)}...` : null);
      const uploadResult = await uploadComicCover(file, jwt ?? undefined);
      const imageUrl = uploadResult.secure_url || uploadResult.url;

      // Set cover in formData
      setFormData({ ...formData, cover: imageUrl });
      
      // Create preview from file
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Không thể tải lên ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError("Vui lòng nhập tiêu đề truyện");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = {
        ...formData,
        authors: formData.author ? [formData.author] : undefined,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      };

      console.log('[CreateComic] Submitting data:', data);

      const res = await createAdminComic(data);
      if (res === null) {
        setError("Bạn cần đăng nhập với quyền quản trị");
        return;
      }

      router.push("/admin/comics");
    } catch (err) {
      console.error("Error creating comic:", err);
      const errMsg = err instanceof Error ? err.message : "Không thể tạo truyện mới";
      
      // If 403 Forbidden with uploader role, show specific message
      if (errMsg.includes('403')) {
        setError("Quyền hạn không đủ. Vui lòng liên hệ với quản trị viên (Admin).");
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-black">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link 
            href="/admin/comics" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0284c7',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0369a1'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#0284c7'}
            className="dark:text-sky-400 dark:hover:text-sky-300"
          >
            <span>←</span>
            <span>Quay lại danh sách</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-4">Thêm truyện mới</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Tạo một truyện mới vào kho truyện của bạn</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            color: '#991b1b'
          }}>
            <p style={{ fontWeight: '600', margin: 0 }}>Lỗi: {error}</p>
          </div>
        )}

        {/* Form */}
        <div style={{
          backgroundColor: 'var(--input-bg)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Layout 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Form Section */}
              <div className="lg:col-span-2 p-8">
                {/* Tiêu đề */}
                <div className="mb-8">
                  <label htmlFor="title" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '8px' }}>
                    Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề truyện"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      fontSize: '16px',
                      color: 'var(--input-text)',
                      backgroundColor: 'var(--input-bg)',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Tác giả */}
                <div className="mb-8">
                  <label htmlFor="author" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '8px' }}>
                    Tác giả
                  </label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author || ""}
                    onChange={handleInputChange}
                    placeholder="Nhập tên tác giả"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      fontSize: '16px',
                      color: 'var(--input-text)',
                      backgroundColor: 'var(--input-bg)',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Mô tả */}
                <div className="mb-8">
                  <label htmlFor="description" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '8px' }}>
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Nhập mô tả truyện"
                    rows={5}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      fontSize: '16px',
                      color: 'var(--input-text)',
                      backgroundColor: 'var(--input-bg)',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Trạng thái */}
                <div className="mb-8">
                  <label htmlFor="status" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '8px' }}>
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--input-border)',
                      fontSize: '16px',
                      color: 'var(--input-text)',
                      backgroundColor: 'var(--input-bg)',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="ongoing">Đang cập nhật</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="paused">Tạm dừng</option>
                  </select>
                </div>

                {/* Thể loại */}
                {genres.length > 0 && (
                  <div className="mb-8">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '12px' }}>
                      Thể loại
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {genres.map((genre) => (
                        <label
                          key={genre}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: selectedGenres.includes(genre) ? 'var(--genre-bg-selected)' : 'var(--genre-bg)',
                            color: 'var(--genre-text)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--genre-bg-selected)'}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = selectedGenres.includes(genre) ? 'var(--genre-bg-selected)' : 'var(--genre-bg)';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre)}
                            onChange={() => handleGenreToggle(genre)}
                            disabled={loading}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#0ea5e9'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: 'var(--genre-text)', fontWeight: '500' }}>{genre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Preview */}
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '32px',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '16px' }}>
                  Chọn bìa truyện
                </h3>
                
                {/* File Input */}
                <label style={{
                  width: '100%',
                  maxWidth: '160px',
                  padding: '20px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: '#f9fafb',
                  marginBottom: '16px'
                }}
                onMouseEnter={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.borderColor = '#0ea5e9';
                    e.currentTarget.style.backgroundColor = '#dbeafe';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploading) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploading || loading}
                    style={{
                      display: 'none'
                    }}
                    id="cover-upload"
                  />
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    {uploading ? 'Đang tải lên...' : 'Chọn ảnh'}
                  </div>
                </label>

                {/* Preview */}
                {coverPreview || formData.cover ? (
                  <div style={{
                    width: '100%',
                    maxWidth: '160px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #0ea5e9',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <img
                      src={coverPreview || formData.cover}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '3/4',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ) : (
                  <span style={{
                    width: '100%',
                    maxWidth: '160px',
                    aspectRatio: '3/4',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    fontSize: '12px',
                    textAlign: 'center'
                  }}>
                    Chưa có ảnh
                  </span>
                )}
              </div>
            </div>

            {/* Footer - Buttons */}
            <div style={{
              padding: '24px 32px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#93c5fd' : '#0ea5e9',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#0284c7';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#0ea5e9';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {loading ? 'Đang tạo...' : 'Tạo truyện'}
              </button>
              <Link
                href="/admin/comics"
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: '1px solid #d1d5db',
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
