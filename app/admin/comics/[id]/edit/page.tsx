"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../contexts/AuthContext";
import { getAdminComic, updateAdminComic, getGenres } from "../../../../lib/api";
import { hasAdminOrModeratorRole, canManageComic } from "../../../../lib/auth";

type Comic = {
  _id?: string;
  title: string;
  author?: string;
  description?: string;
  cover?: string;
  genres?: string[];
  status?: string;
};

export default function EditComicPage() {
  const router = useRouter();
  const params = useParams();
  const comicId = params.id as string;
  const authContext = useAuth();
  const isAuthorized = hasAdminOrModeratorRole(authContext?.user);
  const isAuthLoading = authContext?.isLoading ?? true;

  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      setError("Bạn cần quyền quản lý truyện (Admin hoặc Uploader) để chỉnh sửa truyện.");
      setLoading(false);
      return;
    }

    // Dynamic style tag for dark mode CSS variables
    const styleId = 'comic-edit-dark-vars';
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

    loadComicAndGenres();

    return () => observer.disconnect();
  }, [comicId, isAuthorized, isAuthLoading]);

  const loadComicAndGenres = async () => {
    try {
      const [comicData, genresData] = await Promise.all([
        getAdminComic(comicId),
        getGenres(),
      ]);

      if (comicData === null) {
        setError("Bạn cần đăng nhập với quyền quản trị");
        setLoading(false);
        return;
      }

      // Check if user can manage this comic
      if (!canManageComic(authContext?.user, comicData)) {
        setError("Bạn không có quyền chỉnh sửa truyện này. Chỉ người tạo truyện hoặc Admin mới có thể chỉnh sửa.");
        setLoading(false);
        return;
      }

      // Chuyển đổi authors (mảng) thành author (string)
      const formattedData = {
        ...comicData,
        author: Array.isArray(comicData.authors) && comicData.authors.length > 0 
          ? comicData.authors[0] 
          : (comicData.author || ""),
      };

      setFormData(formattedData);
      if (comicData.genres && Array.isArray(comicData.genres)) {
        setSelectedGenres(comicData.genres);
      }

      if (Array.isArray(genresData)) {
        setGenres(genresData.map((g: any) => g.name || g));
      }
    } catch (err) {
      console.error("Error loading comic:", err);
      setError("Không thể tải thông tin truyện");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to compress image
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if image is larger than 1200px width
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
      };
    });
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    // Compress image before upload
    const compressedFile = await compressImage(file);

    // Validate compressed file size (max 500KB)
    if (compressedFile.size > 500 * 1024) {
      setError('Kích thước ảnh không được vượt quá 500KB');
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Create FormData for file upload
      const formDataFile = new FormData();
      formDataFile.append('file', compressedFile);

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataFile,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Upload failed with status ${response.status}:`, errorData);
        throw new Error(`Upload failed: ${response.status} - ${errorData || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageUrl = data.url || data.path;

      // Set cover in formData
      setFormData({ ...formData, cover: imageUrl });
      
      // Create preview from file
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Không thể tải lên ảnh. Vui lòng thử lại.');
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

    setSubmitting(true);
    setError("");

    try {
      const data = {
        ...formData,
        authors: formData.author ? [formData.author] : undefined,
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      };

      const res = await updateAdminComic(comicId, data);
      if (res === null) {
        setError("Bạn cần đăng nhập với quyền quản trị");
        setSubmitting(false);
        return;
      }

      router.push("/admin/comics");
    } catch (err) {
      console.error("Error updating comic:", err);
      setError("Không thể cập nhật truyện");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid #d1d5db',
              borderTopColor: '#0ea5e9',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          <p style={{ color: '#4b5563' }}>Đang tải thông tin truyện...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'linear-gradient(to bottom right, #000000, #000000)' : 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'
    }}>
      <div style={{
        margin: '0 auto',
        maxWidth: '1280px',
        padding: '48px 16px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
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
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginTop: '16px' }} className="text-gray-900 dark:text-white">
            Chỉnh sửa truyện
          </h1>
          <p style={{ marginTop: '8px', fontSize: '18px' }} className="text-gray-600 dark:text-gray-300">
            Cập nhật thông tin truyện của bạn
          </p>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 0
            }}>
              {/* Form Section */}
              <div style={{ padding: '32px' }}>
                {/* Tiêu đề */}
                <div style={{ marginBottom: '32px' }}>
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
                    disabled={submitting}
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
                <div style={{ marginBottom: '32px' }}>
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
                    disabled={submitting}
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
                <div style={{ marginBottom: '32px' }}>
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
                    disabled={submitting}
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
                <div style={{ marginBottom: '32px' }}>
                  <label htmlFor="status" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '8px' }}>
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={submitting}
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
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--label-text)', marginBottom: '12px' }}>
                      Thể loại
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
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
                            disabled={submitting}
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
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Upload Ảnh Bìa
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
                    disabled={uploading || submitting}
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
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: '8px',
                  backgroundColor: submitting ? '#93c5fd' : '#0ea5e9',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#0284c7';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#0ea5e9';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
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
