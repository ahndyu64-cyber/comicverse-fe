"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchComics, getComics } from "../lib/api";
import { getComics as getComicsLib } from "../lib/comics";

interface Comic {
  _id: string;
  title: string;
  cover?: string;
  coverImage?: string;
  thumbnail?: string;
  slug?: string;
}

export default function SearchBox() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Comic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Search for comics as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const data = await searchComics(query.trim());
        console.log('[SearchBox] searchComics response:', data);
        
        // Handle various response formats
        let comicList: Comic[] = [];
        if (Array.isArray(data)) {
          comicList = data;
        } else if (data?.items && Array.isArray(data.items)) {
          comicList = data.items;
        } else if (data?.data && Array.isArray(data.data)) {
          comicList = data.data;
        } else if (data?.comics && Array.isArray(data.comics)) {
          comicList = data.comics;
        } else if (typeof data === 'object' && data !== null) {
          // Try to extract comics from object
          const foundArray = Object.values(data).find(v => Array.isArray(v));
          comicList = foundArray || [];
        }
        
        // If search returns empty, try fallback local search
        if (comicList.length === 0) {
          console.log('[SearchBox] No results from API, trying fallback local search');
          try {
            // Try fetching first few pages and filter locally
            const maxPages = 3;
            let accumulated: Comic[] = [];
            for (let p = 1; p <= maxPages; p++) {
              try {
                // @ts-ignore
                const pageData = await getComicsLib(p, 20);
                if (!pageData || !pageData.items || pageData.items.length === 0) break;
                accumulated = accumulated.concat(pageData.items as Comic[]);
              } catch (err) {
                break;
              }
            }
            
            const qLower = query.trim().toLowerCase();
            const filtered = accumulated.filter((c) => 
              (c.title || '').toLowerCase().includes(qLower)
            );
            comicList = filtered;
            console.log('[SearchBox] Fallback search found:', comicList.length, 'results');
          } catch (err) {
            console.error('[SearchBox] Fallback search failed:', err);
          }
        }
        
        console.log('[SearchBox] final comicList:', comicList);
        
        // Limit to 5 results
        setResults(comicList.slice(0, 5));
      } catch (error) {
        console.error('Error searching comics:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery?: string) => {
    const q = (searchQuery || query || "").trim();
    setVisible(false);
    setQuery("");
    setResults([]);
    if (q) {
      router.push(`/comics?q=${encodeURIComponent(q)}`);
    }
  };

  const handleSelectComic = (comic: Comic) => {
    setVisible(false);
    setQuery("");
    setResults([]);
    router.push(`/comics/${comic._id}`);
  };

  const getCoverImage = (comic: Comic): string => {
    return comic.cover || comic.coverImage || comic.thumbnail || "";
  };

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        aria-label="Open search"
        title="Tìm kiếm"
        className="p-2 rounded hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative">
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
            setResults([]);
          }
        }}
        className="rounded-md border border-black/30 dark:border-white/30 bg-black/20 dark:bg-black/50 px-4 py-2 text-sm !text-black dark:!text-white placeholder-black/50 dark:placeholder-white/50 outline-none focus:bg-black/30 dark:focus:bg-black/60 focus:border-black/50 dark:focus:border-white/50 transition-colors w-80"
        placeholder="Tìm kiếm truyện..."
      />

      {/* Dropdown Results */}
      {query.trim() && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 left-0 w-96 max-h-[600px] overflow-y-auto rounded-md border border-black/20 dark:border-white/20 bg-white dark:bg-neutral-900 shadow-lg z-50"
        >
          {isSearching ? (
            <div className="p-8 text-center text-lg text-neutral-500 dark:text-neutral-400">
              Đang tìm kiếm...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-black/10 dark:divide-white/10">
              {results.map((comic) => (
                <button
                  key={comic._id}
                  onClick={() => handleSelectComic(comic)}
                  className="w-full text-left px-8 py-6 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-6"
                >
                  {getCoverImage(comic) && (
                    <img
                      src={getCoverImage(comic)}
                      alt={comic.title}
                      className="h-28 w-20 rounded object-cover flex-shrink-0"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-neutral-900 dark:text-white truncate">
                      {comic.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-lg text-neutral-500 dark:text-neutral-400">
              Không tìm thấy truyện nào
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setVisible(false);
          setQuery("");
          setResults([]);
        }}
        aria-label="Close search"
        className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded hover:bg-white/20 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-black dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
