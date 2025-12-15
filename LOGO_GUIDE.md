# Comicverse Logo Guide

## Logo Components

The Comicverse branding consists of several logo implementations:

### 1. **Primary Logo Component** (`Logo.tsx`)
The main React component used in the navbar and header. Features:
- **Design**: Comic book speech bubble with gradient (purple to pink)
- **Icon**: SVG-based design with comic styling
- **Text**: Split "Comic" and "verse" with gradient text effect
- **Responsive**: Works well on all screen sizes
- **Interactive**: Hover effect with opacity transition

**Usage:**
```tsx
import Logo from '@/components/Logo';

export default function Header() {
  return <Logo />;
}
```

### 2. **Alternative Logo Styles** (`LogoStyles.tsx`)
Uncomment different options in `Logo.tsx` to use:

- **ComicPanelLogo**: 4-panel comic book grid design
- **MangaBubbleLogo**: Speech bubble with manga style
- **ComicCharacterLogo**: Character face with emotion
- **ActionLinesLogo**: Dynamic action lines background
- **MangaEyesLogo**: Manga-style eyes design

### 3. **SVG Logo Files**

#### Full Logo (`/public/logo.svg`)
- Size: 200x200px
- Includes: Full branding with text
- Use for: Social media, large displays, documents

#### Favicon (`/public/favicon.svg`)
- Size: 32x32px
- Includes: Icon only, optimized for browsers
- Use for: Browser tab, bookmarks, shortcuts

## Color Scheme

**Primary Colors:**
- Purple: `#a855f7`
- Pink: `#ec4899`
- Magenta: `#d946ef`

**Accent Colors:**
- Yellow (Comic dots): `#fbbf24`
- White: `#ffffff`

## Design Elements

1. **Comic Book Aesthetic**
   - Speech bubbles
   - Panel borders
   - Action lines
   - Comic dots

2. **Modern Gradient**
   - Purple to Pink gradient
   - Dynamic color transitions
   - Shadow effects

3. **Typography**
   - Bold, extrabold weights
   - Gradient text effect
   - Clear hierarchy

## Implementation

### In HTML/Meta Tags:
```html
<!-- Favicon -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/logo.svg">

<!-- Open Graph (Social Media) -->
<meta property="og:image" content="/logo.svg">
```

### In Next.js Layout:
```tsx
import Logo from '@/components/Logo';

export default function RootLayout() {
  return (
    <html>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <header>
          <Logo />
        </header>
      </body>
    </html>
  );
}
```

## Variations

**Light Mode**: Works perfectly on white/light backgrounds
**Dark Mode**: Automatically adapts with opacity transitions
**Responsive**: Scales from 40px to unlimited size

## Future Enhancements

Consider creating:
- PNG versions for email/documents
- Animated logo (CSS/Lottie)
- Logo variations for different platforms
- Dark mode specific versions
- Monochrome/single-color versions for printing
