"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './BannerSlider.module.css'

const AUTO_SLIDE_INTERVAL = 5000 // 5 seconds
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

interface Banner {
  _id: string
  src: string
  comicId: string
  comicTitle?: string
}

export default function BannerSlider() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    try {
      setLoading(true)
      // Try to load from API first
      try {
        const res = await fetch(`${API_BASE}/banners`)
        if (res.ok) {
          const data = await res.json()
          const apiBanners = Array.isArray(data) ? data : data.data || []
          if (apiBanners.length > 0) {
            setBanners(apiBanners)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to load banners from API, falling back to localStorage', err)
      }

      // Fallback to localStorage
      const savedBanners = localStorage.getItem('banners')
      if (savedBanners) {
        setBanners(JSON.parse(savedBanners))
      }
    } catch (err) {
      console.error('Error loading banners:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only auto-slide when not hovering and we have banners
    if (isHovered || banners.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % banners.length)
    }, AUTO_SLIDE_INTERVAL)

    return () => clearInterval(timer)
  }, [isHovered, banners.length])

  const goToPrevious = () => {
    if (banners.length === 0) return
    setCurrentIndex((current) => (current - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    if (banners.length === 0) return
    setCurrentIndex((current) => (current + 1) % banners.length)
  }

  const handleBannerClick = () => {
    if (banners.length === 0) return
    const banner = banners[currentIndex]
    if (banner.comicId) {
      router.push(`/comics/${banner.comicId}`)
    }
  }

  // Show loading state or empty state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.slider} style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#999' }}>Đang tải banner...</p>
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.slider} style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#999' }}>Chưa có banner nào</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.slider}>
        {banners.map((banner, index) => (
          <div
            key={banner._id}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
            onClick={handleBannerClick}
            style={{
              zIndex: index === currentIndex ? 1 : 0,
              cursor: banner.comicId ? 'pointer' : 'default'
            }}
          >
            <Image 
              src={banner.src} 
              alt={banner.comicTitle || `Banner slide ${index + 1}`}
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
        {banners.map((_, index) => (
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
