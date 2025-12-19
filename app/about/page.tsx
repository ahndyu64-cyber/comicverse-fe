export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-8">Về chúng tôi</h1>
        
        <div className="max-w-none text-neutral-700 dark:text-white space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">ComicVerse là gì?</h2>
            <p className="text-neutral-700 dark:text-white">
              ComicVerse là một nền tảng đọc truyện tranh online miễn phí, cung cấp một thư viện phong phú với hàng nghìn bộ truyện tranh từ các thể loại khác nhau. Chúng tôi cam kết mang đến trải nghiệm đọc truyện tuyệt vời cho độc giả trên khắp thế giới.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Sự mệnh của chúng tôi</h2>
            <p className="text-neutral-700 dark:text-white">
              Sứ mệnh của ComicVerse là giúp người yêu thích truyện tranh có thể dễ dàng tiếp cận và tận hưởng những bộ truyện yêu thích của họ mà không cần lo lắng về chi phí. Chúng tôi tin rằng mọi người đều xứng đáy có quyền truy cập vào các tác phẩm sáng tạo của các nhà tạo nội dung tài ba.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Tại sao chọn ComicVerse?</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-700 dark:text-white">
              <li>Thư viện truyện tranh rộng lớn với hàng nghìn bộ truyện</li>
              <li>Giao diện người dùng thân thiện và dễ sử dụng</li>
              <li>Cập nhật các chương mới thường xuyên</li>
              <li>Hỗ trợ chế độ tối/sáng</li>
              <li>Hoàn toàn miễn phí không có quảng cáo xâm phạm</li>
              <li>Cộng đồng độc giả năng động và tích cực</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Liên hệ với chúng tôi</h2>
            <p className="text-neutral-700 dark:text-white">
              Nếu bạn có bất kỳ câu hỏi, đề xuất hoặc phản hồi nào, vui lòng không ngần ngại <a href="/contact" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-semibold">liên hệ với chúng tôi</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
