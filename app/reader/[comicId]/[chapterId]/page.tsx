"use client";
import { useEffect, useState, use } from "react";
import { getComicById } from "../../../lib/comics";
import { getComments, createComment, deleteComment } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";

type Props = {
  params: Promise<{ comicId: string; chapterId: string }>;
};

type Comment = {
  _id?: string;
  content: string;
  user?: {
    _id?: string;
    username: string;
    avatar?: string;
  };
  createdAt?: string;
  chapterId?: string;
  chapter?: {
    _id?: string;
    title?: string;
  };
};

export default function ReaderPage({ params }: Props) {
  const { comicId, chapterId } = use(params);
  const authContext = useAuth();
  const isAdmin = authContext?.user?.role === 'admin' || authContext?.user?.roles?.includes('admin');
  
  const [comic, setComic] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitingComment, setSubmitingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getComicById(comicId)
      .then((comicData) => {
        console.log('Comic data:', comicData);
        setComic(comicData);
        
        // Find the chapter in the comic's chapters array
        const chapter = comicData.chapters?.find((ch: any) => ch._id === chapterId);
        
        if (!chapter) {
          setError(`Không tìm thấy chương với ID: ${chapterId}`);
          setImages([]);
        } else {
          console.log('Chapter data:', chapter);
          setCurrentChapter(chapter);
          const imgs = chapter.images || [];
          setImages(imgs);
          setCurrentPage(0);
        }
      })
      .catch((err: any) => {
        console.error('Error loading comic:', err);
        setError(err.message || 'Không thể tải truyện');
        setImages([]);
      })
      .finally(() => setLoading(false));
  }, [comicId, chapterId]);

  // Load comments
  useEffect(() => {
    setLoadingComments(true);
    setAuthError(false);
    getComments(comicId)
      .then((res: any) => {
        setComments(res?.data || res || []);
        setAuthError(false);
      })
      .catch((err: any) => {
        console.error('Error loading comments:', err);
        // Check if error is 401 Unauthorized
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          setAuthError(true);
        }
        setComments([]);
      })
      .finally(() => setLoadingComments(false));
  }, [comicId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setCommentError('Vui lòng nhập nội dung bình luận');
      return;
    }

    setSubmitingComment(true);
    setCommentError(null);

    try {
      await createComment(comicId, commentText);
      setCommentText("");
      setCommentError(null);
      
      // Reload comments
      try {
        const res = await getComments(comicId);
        setComments(res?.data || res || []);
      } catch (err) {
        // Ignore comment reload errors
        console.error('Error reloading comments:', err);
      }
    } catch (err: any) {
      console.error('Error creating comment:', err);
      setCommentError(err.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.');
    } finally {
      setSubmitingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId);
      // Remove comment from list
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      alert('Không thể xóa bình luận. Vui lòng thử lại.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const chapterIndex = comic?.chapters?.findIndex((ch: any) => ch._id === chapterId) || 0;
  const previousChapter = chapterIndex > 0 ? comic?.chapters?.[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < (comic?.chapters?.length || 0) - 1 ? comic?.chapters?.[chapterIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900">
      {/* Header */}
      <div className="relative z-10 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/comics/${comicId}`} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition">
                <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Trở về
              </Link>
              <div className="h-6 w-px bg-neutral-700"></div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-black dark:text-white">{comic?.title || 'Đang tải...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Chapter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                  className="p-2 text-neutral-400 hover:text-purple-400 hover:bg-neutral-800 rounded-lg transition"
                  title="Danh sách chương"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showChapterDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg bg-white border border-gray-200 shadow-xl z-50">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-900">Danh sách chương ({comic?.chapters?.length || 0})</p>
                    </div>
                    <div className="space-y-1">
                      {comic?.chapters?.map((chapter: any) => (
                        <Link
                          key={chapter._id}
                          href={`/reader/${comicId}/${chapter._id}`}
                          onClick={() => setShowChapterDropdown(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            chapter._id === chapterId
                              ? 'bg-purple-600 text-white font-semibold'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chapter.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Previous Chapter Button */}
              {previousChapter && (
                <Link 
                  href={`/reader/${comicId}/${previousChapter._id}`}
                  className="p-2 text-neutral-400 hover:text-purple-400 hover:bg-neutral-800 rounded-lg transition"
                  title="Chương trước"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}

              <div className="text-center">
                <p className="text-sm font-bold text-purple-400">{currentChapter?.title || 'Đang tải...'}</p>
              </div>

              {/* Next Chapter Button */}
              {nextChapter && (
                <Link 
                  href={`/reader/${comicId}/${nextChapter._id}`}
                  className="p-2 text-neutral-400 hover:text-purple-400 hover:bg-neutral-800 rounded-lg transition"
                  title="Chương tiếp theo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-400">Đang tải chương...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-900/30 border border-red-700 p-8 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-red-400 mb-2">Lỗi</h3>
            <p className="text-red-300 mb-4">{error}</p>
            <p className="text-xs text-neutral-500">ComicId: {comicId} | ChapterId: {chapterId}</p>
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg bg-neutral-800/50 border border-neutral-700 p-12 text-center">
            <svg className="w-12 h-12 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-neutral-400">Chương này chưa có ảnh</p>
          </div>
        ) : (
          <>
            {/* Reader */}
            <div className="space-y-4">
              {images.map((src, i) => (
                <div key={i} className="flex justify-center">
                  <img 
                    src={src} 
                    alt={`page-${i + 1}`} 
                    className="max-w-2xl w-full rounded-lg shadow-2xl border border-neutral-800"
                    loading={i > 2 ? "lazy" : "eager"}
                  />
                </div>
              ))}
            </div>

            {/* Page Counter */}
            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-400">
                Trang <span className="font-bold text-purple-400">{images.length}</span> / <span className="font-bold text-purple-400">{images.length}</span>
              </p>
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 border-t border-neutral-800 bg-neutral-900/95 backdrop-blur pt-6">
              <div className="flex items-center justify-between gap-4">
                {previousChapter ? (
                  <Link 
                    href={`/reader/${comicId}/${previousChapter._id}`}
                    className="flex-1 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-purple-600/20 hover:from-purple-600/40 hover:to-purple-600/40 border border-purple-600/50 rounded-lg text-purple-400 transition group"
                  >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <div className="text-left">
                      <p className="text-xs text-neutral-500">Chương trước</p>
                      <p className="text-sm font-bold">{previousChapter.title}</p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1 px-4 py-3 bg-neutral-800/30 border border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm dark:text-white">Đây là chương đầu tiên</span>
                  </div>
                )}

                {nextChapter ? (
                  <Link 
                    href={`/reader/${comicId}/${nextChapter._id}`}
                    className="flex-1 flex items-center justify-end gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-purple-600/20 hover:from-purple-600/40 hover:to-purple-600/40 border border-purple-600/50 rounded-lg text-purple-400 transition group"
                  >
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Chương tiếp theo</p>
                      <p className="text-sm font-bold">{nextChapter.title}</p>
                    </div>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="flex-1 px-4 py-3 bg-neutral-800/30 border border-neutral-700 rounded-lg text-neutral-600 flex items-center justify-end gap-2">
                    <span className="text-sm dark:text-white">Đây là chương cuối cùng</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12 space-y-6">
              <div className="border-t border-neutral-800 pt-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-400 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"></path>
                    <path d="M15 13H5m10 0v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2m10 0H5"></path>
                  </svg>
                  Bình luận ({comments.length})
                </h2>

                {/* Comment Form */}
                {authError ? (
                  <div className="mb-8 rounded-lg bg-blue-900/30 border border-blue-700 p-6 text-center">
                    <svg className="w-12 h-12 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-blue-300 mb-4">Vui lòng đăng nhập để bình luận</p>
                    <Link href="/auth/login" className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition">
                      Đăng nhập
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
                    <div className="relative">
                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          setCommentText(e.target.value);
                          setCommentError(null);
                        }}
                        placeholder="Chia sẻ suy nghĩ của bạn..."
                        className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>
                    
                    {commentError && (
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {commentError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitingComment || !commentText.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
                    >
                      {submitingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                    </button>
                  </form>
                )}

                {/* Comments List */}
                {loadingComments ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-400">Đang tải bình luận...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-lg bg-neutral-800/30 border border-neutral-700 p-8 text-center">
                    <svg className="w-12 h-12 text-neutral-600 dark:text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-neutral-400 dark:text-white">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="rounded-lg bg-neutral-800/30 border border-neutral-700 p-4 hover:border-neutral-600 transition">
                        <div className="flex items-start gap-4">
                          {comment.user?.avatar ? (
                            <img 
                              src={comment.user.avatar} 
                              alt={comment.user.username}
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm">
                                {comment.user?.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-purple-400 dark:text-white">{comment.user?.username || 'Ẩn danh'}</p>
                                {comment.createdAt && (
                                  <span className="text-xs text-neutral-500 dark:text-white">
                                    {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteComment(comment._id!)}
                                  disabled={deletingCommentId === comment._id}
                                  className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 disabled:bg-neutral-800 text-red-400 hover:text-red-300 disabled:text-neutral-500 border border-red-700/50 rounded transition"
                                >
                                  {deletingCommentId === comment._id ? 'Đang xóa...' : 'Xóa'}
                                </button>
                              )}
                            </div>
                            {comment.chapter?.title && (
                              <p className="text-xs text-neutral-400 mb-2">
                                <span className="text-neutral-500">Chương:</span> {comment.chapter.title}
                              </p>
                            )}
                            <p className="text-neutral-300 dark:text-white break-words">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
