"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  const handleSearch = () => {
    const q = (query || "").trim();
    setVisible(false);
    if (q) {
      router.push(`/comics?q=${encodeURIComponent(q)}`);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        aria-label="Open search"
        title="Tìm kiếm"
        className="p-2 rounded hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
          if (e.key === "Escape") {
            setVisible(false);
            setQuery("");
          }
        }}
        className="rounded-md border border-black/30 dark:border-white/30 bg-black/20 dark:bg-black/50 px-3 py-1 text-sm !text-black dark:!text-white placeholder-black/50 dark:placeholder-white/50 outline-none focus:bg-black/30 dark:focus:bg-black/60 focus:border-black/50 dark:focus:border-white/50 transition-colors"
        placeholder="Tìm kiếm truyện..."
      />
      <button
        onClick={handleSearch}
        aria-label="Search"
        className="ml-2 p-2 rounded hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-black dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </button>
      <button
        onClick={() => {
          setVisible(false);
          setQuery("");
        }}
        aria-label="Close search"
        className="ml-2 p-2 rounded hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-black dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
