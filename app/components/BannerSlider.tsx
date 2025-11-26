"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './BannerSlider.module.css'

const BANNERS = [
  { src: '/banner.jpg', comicId: '691a91aea632ed16b50391e1' },
  { src: '/banner1.jpg', comicId: '691a968ea632ed16b5039484' },
  { src: '/banner2.jpg', comicId: '691a963aa632ed16b503944b' },
  { src: '/banner3.jpg', comicId: '691a95c3a632ed16b5039403' },
  { src: '/banner4.jpg', comicId: '691a96dea632ed16b50394c5' },
  { src: '/banner5.jpg', comicId: '691a954ba632ed16b50393da' },
  { src: '/banner6.jpg', comicId: '691ace2a343f4c9f7ed205e6' }
]

const AUTO_SLIDE_INTERVAL = 5000 // 5 seconds

export default function BannerSlider() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    // Only auto-slide when not hovering
    if (isHovered) return

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % BANNERS.length)
    }, AUTO_SLIDE_INTERVAL)

    return () => clearInterval(timer)
  }, [isHovered])

  const goToPrevious = () => {
    setCurrentIndex((current) => (current - 1 + BANNERS.length) % BANNERS.length)
  }

  const goToNext = () => {
    setCurrentIndex((current) => (current + 1) % BANNERS.length)
  }

  const handleBannerClick = () => {
    const banner = BANNERS[currentIndex]
    if (banner.comicId) {
      router.push(`/comics/${banner.comicId}`)
    }
  }

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.slider}>
        {BANNERS.map((banner, index) => (
          <div
            key={banner.src}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
            onClick={handleBannerClick}
            style={{
              zIndex: index === currentIndex ? 1 : 0,
              cursor: banner.comicId ? 'pointer' : 'default'
            }}
          >
            <Image 
              src={banner.src} 
              alt={`Banner slide ${index + 1}`}
              fill
              className={styles.image}
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        ))}
        
        {/* Navigation Buttons */}
        <button
          className={styles.navButton}
          onClick={goToPrevious}
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          className={`${styles.navButton} ${styles.right}`}
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5L15.75 12l-7.5 7.5" />
          </svg>
        </button>
      </div>
      
      {/* Indicators */}
      <div className={styles.indicators}>
        {BANNERS.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
