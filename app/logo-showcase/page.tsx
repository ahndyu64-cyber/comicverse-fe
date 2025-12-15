import Logo, { LogoIcon, LogoText } from "../components/Logo";
import { ComicPanelLogo, MangaBubbleLogo, ComicCharacterLogo, ActionLinesLogo, MangaEyesLogo } from "../components/LogoStyles";

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-black text-white mb-4">Comicverse Logo Gallery</h1>
          <p className="text-xl text-slate-300">All logo variations and implementation examples</p>
        </div>

        {/* Main Logo */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Primary Logo</h2>
          <div className="bg-white rounded-lg p-12 flex items-center justify-center shadow-2xl">
            <Logo />
          </div>
        </div>

        {/* Logo Variations */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Logo Variations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Icon Sizes */}
            <div className="bg-white rounded-lg p-8 shadow-xl">
              <h3 className="font-bold text-gray-800 mb-4">Icon Sizes</h3>
              <div className="flex gap-4 items-center">
                <LogoIcon className="w-6 h-6" />
                <LogoIcon className="w-8 h-8" />
                <LogoIcon className="w-10 h-10" />
                <LogoIcon className="w-12 h-12" />
                <LogoIcon className="w-16 h-16" />
              </div>
            </div>

            {/* Text Only */}
            <div className="bg-white rounded-lg p-8 shadow-xl flex items-center justify-center">
              <h3 className="font-bold text-gray-800 mb-4">Text Only</h3>
              <LogoText />
            </div>

            {/* Icon Only */}
            <div className="bg-white rounded-lg p-8 shadow-xl flex items-center justify-center">
              <h3 className="font-bold text-gray-800 mb-4">Icon Only</h3>
              <LogoIcon className="w-16 h-16" />
            </div>
          </div>
        </div>

        {/* Alternative Designs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Alternative Designs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
              <h3 className="font-bold text-gray-800 text-center text-sm">Comic Panel</h3>
              <ComicPanelLogo />
            </div>

            <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
              <h3 className="font-bold text-gray-800 text-center text-sm">Manga Bubble</h3>
              <MangaBubbleLogo />
            </div>

            <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
              <h3 className="font-bold text-gray-800 text-center text-sm">Character</h3>
              <ComicCharacterLogo />
            </div>

            <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
              <h3 className="font-bold text-gray-800 text-center text-sm">Action Lines</h3>
              <ActionLinesLogo />
            </div>

            <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4">
              <h3 className="font-bold text-gray-800 text-center text-sm">Manga Eyes</h3>
              <MangaEyesLogo />
            </div>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">Dark Mode</h2>
          <div className="bg-gray-900 rounded-lg p-12 flex items-center justify-center shadow-2xl">
            <Logo />
          </div>
        </div>

        {/* Usage Guide */}
        <div className="bg-slate-700 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Usage Examples</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Import Main Logo</h3>
              <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
{`import Logo from '@/components/Logo';

export default function Header() {
  return <Logo />;
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Import Icon Only</h3>
              <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
{`import { LogoIcon } from '@/components/Logo';

export default function Favicon() {
  return <LogoIcon className="w-8 h-8" />;
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Import Text Only</h3>
              <pre className="bg-slate-900 p-4 rounded overflow-auto text-sm">
{`import { LogoText } from '@/components/Logo';

export default function Footer() {
  return <LogoText />;
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">SVG Files</h3>
              <p className="mb-2">Full Logo: <code className="bg-slate-900 px-2 py-1 rounded">/public/logo.svg</code></p>
              <p>Favicon: <code className="bg-slate-900 px-2 py-1 rounded">/public/favicon.svg</code></p>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="bg-purple-600 h-32"></div>
              <div className="bg-slate-700 p-3 text-white text-sm font-mono">
                #a855f7
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="bg-pink-600 h-32"></div>
              <div className="bg-slate-700 p-3 text-white text-sm font-mono">
                #ec4899
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="bg-magenta-500 h-32" style={{ backgroundColor: '#d946ef' }}></div>
              <div className="bg-slate-700 p-3 text-white text-sm font-mono">
                #d946ef
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="bg-yellow-300 h-32"></div>
              <div className="bg-slate-700 p-3 text-white text-sm font-mono">
                #fbbf24
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl">
              <div className="bg-white h-32"></div>
              <div className="bg-slate-700 p-3 text-white text-sm font-mono">
                #ffffff
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
