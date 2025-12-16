import { use } from "react";
import Link from "next/link";
import ChapterList from "../../components/ChapterList";
import ComicActions from "../../components/ComicActions";
import { getComicById } from "../../lib/comics";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ComicDetail({ params }: Props) {
  // Unwrap params using React.use()
  const { id } = use(params);
  
  if (!id || typeof id !== 'string') {
    return <div className="p-8">ID truyện không hợp lệ</div>;
  }
  
  return <ComicDetailContent id={id} />;
}

async function ComicDetailContent({ id }: { id: string }) {
  let comic;
  try {
    comic = await getComicById(id);
    if (!comic) return <div className="p-8">Không tìm thấy truyện</div>;
  } catch (error) {
    console.error('Error fetching comic:', error);
    return <div className="p-8">Không thể tải thông tin truyện</div>;
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-white dark:bg-black">
      <div className="mx-auto max-w-5xl">
        {/* Header Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
            {/* Bìa truyện */}
            <div className="md:col-span-1">
              <div className="relative group">
                {comic.cover ? (
                  <img 
                    src={comic.cover} 
                    alt={comic.title} 
                    className="w-full rounded-xl shadow-xl object-cover aspect-[3/4] group-hover:shadow-2xl transition-shadow duration-300 border-4 border-purple-600"
                  />
                ) : (
                  <div className="w-full rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 aspect-[3/4] flex items-center justify-center">
                    <span className="text-neutral-500 dark:text-neutral-400">Không có ảnh bìa</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin truyện */}
            <div className="md:col-span-2 flex flex-col justify-start gap-6">
              {/* Tiêu đề */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-900 mb-2">
                  {comic.title}
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
              </div>

              {/* Thể loại */}
              {comic.genres && comic.genres.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Thể loại</span>
                  <div className="flex flex-wrap gap-2">
                    {comic.genres
                      .filter(genre => {
                        // Lọc bỏ thể loại trống hoặc không hợp lệ
                        if (typeof genre === 'string') {
                          return genre && genre.trim() !== '';
                        }
                        // Nếu là object, kiểm tra có name hoặc _id không
                        return genre && (genre.name || genre._id);
                      })
                      .map((genre, idx) => {
                        // Lấy tên thể loại (có thể là string hoặc object)
                        const genreName = typeof genre === 'string' ? genre : (genre.name || genre._id || '');
                        return genreName ? (
                          <Link 
                            key={idx}
                            href={`/comics?genre=${encodeURIComponent(genreName)}`}
                            className="px-4 py-2 bg-white dark:bg-white text-neutral-900 dark:text-neutral-900 text-sm font-medium rounded-full hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                          >
                            {genreName}
                          </Link>
                        ) : null;
                      })}
                  </div>
                </div>
              )}

              {/* Tác giả */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Tác giả</span>
                <p className="text-lg text-neutral-700 dark:text-neutral-300 font-semibold">
                  {(comic.authors && comic.authors.length > 0)
                    ? comic.authors.map((author, idx) => (
                        <span key={idx}>
                          {author}
                          {idx < comic.authors.length - 1 && <span>, </span>}
                        </span>
                      ))
                    : comic.author
                    ? comic.author
                    : "Đang cập nhật"}
                </p>
              </div>

              {/* Trạng thái */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Trạng thái</span>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                    comic.status === 'ongoing' 
                      ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      comic.status === 'ongoing' ? 'bg-blue-600' : 'bg-green-600'
                    }`}></span>
                    {comic.status === 'ongoing' ? 'Đang cập nhật' : 'Hoàn thành'}
                  </span>
                </div>
              </div>

              {/* Nút đọc từ đầu */}
              {comic.chapters && comic.chapters.length > 0 && (
                <ComicActions 
                  comicId={comic._id || ''} 
                  followCount={comic.follows || 0}
                  firstChapterId={comic.chapters[0]._id}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mô tả truyện */}
        {comic.description && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl mt-8 p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
              Mô tả
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-base">
              {comic.description}
            </p>
          </div>
        )}

        {/* Danh sách chương */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl mt-8 p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></span>
            Danh sách chương ({comic.chapters?.length || 0})
          </h2>
          <ChapterList chapters={comic.chapters} basePath={`/reader/${comic._id}`} />
        </div>
      </div>
    </div>
  );
}
