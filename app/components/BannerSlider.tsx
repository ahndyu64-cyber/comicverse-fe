"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Comic } from "../lib/api";

interface BannerSliderProps {
  comics: Comic[];
}

export default function BannerSlider({ comics }: BannerSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((current) =>
        current === comics.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [comics.length]);

  const nextSlide = () => {
    setCurrentSlide((current) =>
      current === comics.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((current) =>
      current === 0 ? comics.length - 1 : current - 1
    );
  };

  if (!comics.length) return null;

  return (
    <div className="relative h-[400px] w-full overflow-hidden">
      {/* Slides */}
      {comics.map((comic, index) => (
        <div
          key={comic._id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Banner Image */}
          <div className="relative h-full w-full">
            <Image
              src={comic.cover || "/placeholder-banner.jpg"}
              alt={comic.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-2 text-3xl font-bold">{comic.title}</h2>
              <p className="mb-4 max-w-xl text-sm opacity-90">
                {comic.description?.slice(0, 150)}...
              </p>
              <Link
                href={`/comics/${comic._id}`}
                className="inline-block rounded bg-blue-600 px-6 py-2 font-medium transition-colors hover:bg-blue-700"
              >
                Đọc ngay
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {comics.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentSlide
                ? "bg-white"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}