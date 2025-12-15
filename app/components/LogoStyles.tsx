// Alternative Logo Styles - Uncomment to use different designs

// Option 1: Comic Book Panel Design
export const ComicPanelLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-lg shadow-lg transform -rotate-3"></div>
    <div className="absolute inset-1 bg-white rounded-lg"></div>
    <div className="relative z-10 grid grid-cols-2 gap-0.5">
      <div className="w-3.5 h-3.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-sm"></div>
      <div className="w-3.5 h-3.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-sm"></div>
      <div className="w-3.5 h-3.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-sm"></div>
      <div className="w-3.5 h-3.5 bg-gradient-to-br from-pink-500 to-red-500 rounded-sm"></div>
    </div>
  </div>
);

// Option 2: Manga-style Speech Bubble
export const MangaBubbleLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <svg className="w-full h-full" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      {/* Speech bubble shape */}
      <defs>
        <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Main bubble */}
      <path
        d="M 6 6 L 28 6 Q 34 6 34 12 L 34 24 Q 34 30 28 30 L 12 30 L 8 35 L 10 30 L 8 30 Q 2 30 2 24 L 2 12 Q 2 6 8 6 Z"
        fill="url(#bubbleGradient)"
        stroke="#ffffff"
        strokeWidth="0.5"
      />
      {/* Comic dots */}
      <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
      <circle cx="20" cy="18" r="2.5" fill="#ffffff" />
      <circle cx="28" cy="18" r="2.5" fill="#ffffff" />
    </svg>
  </div>
);

// Option 3: Comic Character Face
export const ComicCharacterLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg"></div>
    <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  </div>
);

// Option 4: Action Lines Design
export const ActionLinesLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg"></div>
    
    {/* Action lines background */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="10" x2="35" y2="10" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
      <line x1="8" y1="20" x2="32" y2="20" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
      <line x1="5" y1="30" x2="35" y2="30" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
    </svg>
    
    {/* Center text */}
    <div className="relative z-10 flex items-center justify-center">
      <span className="text-lg font-black text-white drop-shadow-lg">C</span>
    </div>
  </div>
);

// Option 5: Manga Eyes Design
export const MangaEyesLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-lg shadow-lg"></div>
    <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
      {/* Left eye */}
      <ellipse cx="7" cy="10" rx="2" ry="3" fill="currentColor" />
      <circle cx="7" cy="10" r="1.2" fill="black" />
      
      {/* Right eye */}
      <ellipse cx="17" cy="10" rx="2" ry="3" fill="currentColor" />
      <circle cx="17" cy="10" r="1.2" fill="black" />
      
      {/* Smile */}
      <path d="M 7 16 Q 12 18 17 16" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);
