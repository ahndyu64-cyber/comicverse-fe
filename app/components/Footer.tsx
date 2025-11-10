export default function Footer(){
  return (
    <footer className="mt-12 border-t bg-white/80 dark:bg-neutral-900/80 dark:border-neutral-800">
      <div className="site-container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-gradient-to-br from-sky-500 to-indigo-600" />
            <div>
              <div className="font-semibold">ComicVerse</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400">Đọc truyện tranh online miễn phí</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <a href="/about" className="text-neutral-600 hover:text-sky-600 dark:text-neutral-300">Về chúng tôi</a>
            <a href="/contact" className="text-neutral-600 hover:text-sky-600 dark:text-neutral-300">Liên hệ</a>
            <a href="/terms" className="text-neutral-600 hover:text-sky-600 dark:text-neutral-300">Điều khoản</a>
          </nav>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">© {new Date().getFullYear()} ComicVerse. All rights reserved.</div>
      </div>
    </footer>
  )
}
