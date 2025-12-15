import Link from "next/link";

/**
 * Enhanced Logo Component with Multiple Design Options
 * Default: Modern Comic Book Style
 * 
 * Features:
 * - Gradient purple to pink color scheme
 * - Comic book aesthetic with speech bubble
 * - Responsive design
 * - Dark mode support
 * - Hover animations
 */

export default function Logo() {
  return (
    <Link 
      href="/" 
      className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity duration-300"
      aria-label="Comicverse - Home"
    >
      {/* Logo Icon Container */}
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        {/* Gradient Background - Black in light mode, White in dark mode */}
        <div className="absolute inset-0 bg-black dark:bg-white rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"></div>
        
        {/* Comic Book Content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {/* Speech Bubble SVG Icon - White in light mode, Black in dark mode */}
          <svg
            className="w-5 h-5 text-white dark:text-black drop-shadow-lg"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Main icon - Comic speech bubble */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>

          {/* Comic Effect - Accent Dots - Yellow in light mode, Dark gray in dark mode */}
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-yellow-300 dark:bg-gray-400 rounded-full opacity-70"></div>
          <div className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-yellow-300 dark:bg-gray-400 rounded-full opacity-50"></div>
        </div>
      </div>

      {/* Text Logo - Black in light mode, White in dark mode */}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-black text-black dark:text-white">
          Comic
        </span>
        <span className="text-sm font-black text-black dark:text-white">
          verse
        </span>
      </div>
    </Link>
  );
}

/**
 * Simplified Logo Icon (for use in other places)
 * Can be used as favicon, app icon, etc.
 */
export function LogoIcon({ className = "w-8 h-8" }) {
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      <div className="absolute inset-0 bg-black dark:bg-white rounded-lg shadow-lg"></div>
      <svg
        className="w-5 h-5 text-white dark:text-black relative z-10 drop-shadow-lg"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
      </svg>
    </div>
  );
}

/**
 * Text-Only Logo
 * For situations where icon is not needed
 */
export function LogoText() {
  return (
    <Link href="/" className="group hover:opacity-80 transition-opacity">
      <span className="text-xl font-black text-black dark:text-white">
        Comicverse
      </span>
    </Link>
  );
}
