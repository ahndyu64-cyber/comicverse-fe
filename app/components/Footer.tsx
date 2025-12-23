export default function Footer(){
  return (
    <footer className="mt-12 border-t bg-white/80 dark:bg-neutral-900/80 dark:border-neutral-800">
      <div className="site-container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col items-center justify-center gap-1 sm:gap-4 sm:flex-row md:justify-between">
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-3 order-1 sm:order-1">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded bg-gradient-to-br from-sky-500 to-indigo-600" />
            <div className="text-center sm:text-left">
              <div className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-base">ComicVerse</div>
              <div className="text-[10px] sm:text-sm text-neutral-500 dark:text-white">Đọc truyện tranh online miễn phí</div>
            </div>
          </div>

          <span className="text-neutral-500 dark:text-white text-[10px] sm:text-sm order-3 sm:order-2">© 2025 ComicVerse</span>

          <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-4 text-[10px] sm:text-sm order-2 sm:order-3">
            <a href="/about" className="text-neutral-600 hover:text-sky-600 dark:text-white dark:hover:text-sky-400">Về chúng tôi</a>
            <span className="hidden sm:inline text-neutral-400">•</span>
            <a href="/contact" className="text-neutral-600 hover:text-sky-600 dark:text-white dark:hover:text-sky-400">Liên hệ</a>
            <span className="hidden sm:inline text-neutral-400">•</span>
            <a href="/terms" className="text-neutral-600 hover:text-sky-600 dark:text-white dark:hover:text-sky-400">Điều khoản</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
