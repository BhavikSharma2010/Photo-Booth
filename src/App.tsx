import { useState } from 'react';
import { CameraBooth } from './components/CameraBooth';
// BACKUP: topographic contour backdrop (replaced by the photo background).
// Restore by uncommenting this and the backdrop block below.
// import { TOPOGRAPHY_BG } from './lib/patterns';

/*
 * BACKUP: Seamless botanical line-art tile (inline SVG data URI) — replaced by
 * the photo background. Restore by uncommenting this block and the botanical
 * backdrop block in the JSX below.
 *
 * Delicate charcoal outlines, no fills — a floral print like line-art
 * fabric. Motifs crossing a tile edge are duplicated via <use> offsets
 * (± tile size) so the pattern wraps invisibly when tiled.
 *
const BOTANICAL_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" viewBox="0 0 280 280">
  <defs>
    <g id="botanical-sprig">
      <path d="M280 58 C 256 72 250 96 260 116 C 268 132 262 152 246 164"/>
      <path d="M262 116 C 250 112 242 102 242 90 C 254 94 260 104 262 116 Z"/>
      <path d="M256 140 C 266 136 276 138 282 146 C 274 154 262 150 256 140 Z"/>
      <path d="M246 164 C 240 156 240 146 246 138 C 252 146 252 156 246 164 Z"/>
    </g>
    <g id="botanical-bloom">
      <path d="M180 26 C 172 14 172 2 180 -8 C 188 2 188 14 180 26 Z"/>
      <path d="M180 26 C 168 22 158 14 154 2 C 166 4 176 12 180 26 Z"/>
      <path d="M180 26 C 192 22 202 14 206 2 C 194 4 184 12 180 26 Z"/>
      <circle cx="180" cy="30" r="2.4"/>
    </g>
  </defs>
  <g fill="none" stroke="#1C1B1A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M86 192 C 66 170 62 138 84 120 C 100 132 104 166 86 192 Z"/>
    <path d="M86 192 C 108 178 130 176 146 188 C 138 206 110 204 86 192 Z"/>
    <path d="M86 192 C 104 200 118 214 120 230 C 102 232 88 214 86 192 Z"/>
    <path d="M86 192 C 64 186 44 190 34 202 C 48 216 74 208 86 192 Z"/>
    <path d="M86 192 C 72 172 58 164 44 164 C 48 182 68 190 86 192 Z"/>
    <g fill="#1C1B1A" stroke="none">
      <circle cx="79" cy="187" r="1.6"/>
      <circle cx="90" cy="185" r="1.6"/>
      <circle cx="86" cy="197" r="1.6"/>
      <circle cx="75" cy="196" r="1.6"/>
      <circle cx="93" cy="194" r="1.6"/>
    </g>
    <path d="M12 282 C 32 252 20 222 42 198 C 60 178 56 152 72 134"/>
    <path d="M42 198 C 32 188 30 174 38 164 C 50 172 52 188 42 198 Z"/>
    <path d="M56 154 C 66 148 76 150 82 158 C 74 166 62 164 56 154 Z"/>
    <path d="M72 134 C 66 124 68 112 76 106 C 84 114 82 126 72 134 Z"/>
    <circle cx="212" cy="212" r="3"/>
    <circle cx="222" cy="219" r="3"/>
    <circle cx="208" cy="223" r="3"/>
    <path d="M238 244 C 228 230 230 212 244 202 C 256 214 252 234 238 244 Z"/>
    <path d="M250 252 C 258 246 268 246 274 252 C 268 260 256 260 250 252 Z"/>
    <path d="M158 84 C 154 76 156 66 163 61 C 170 68 167 78 158 84 Z"/>
    <path d="M163 61 C 168 58 174 58 178 61"/>
    <path d="M40 44 C 52 50 58 62 56 76 C 44 72 38 60 40 44 Z"/>
    <path d="M56 76 C 68 72 80 74 86 82 C 76 90 62 86 56 76 Z"/>
    <path d="M110 40 C 122 30 136 30 144 40 C 150 48 146 58 138 60 C 132 62 128 56 132 52"/>
    <use href="#botanical-sprig"/>
    <use href="#botanical-sprig" x="-280"/>
    <use href="#botanical-bloom"/>
    <use href="#botanical-bloom" y="280"/>
  </g>
</svg>`;

const BOTANICAL_BG = `url("data:image/svg+xml,${encodeURIComponent(BOTANICAL_TILE_SVG)}")`;
*/

function App() {
  const [isBoothActive, setIsBoothActive] = useState(false);

  const handleStartBooth = () => {
    setIsBoothActive(true);
  };

  return (
    <div
      className="w-full min-h-[100dvh] flex flex-col relative overflow-hidden bg-[#F7F5EB] bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1776715139302-281f91c0c9ca?w=1920&auto=format&fit=crop&q=80')",
      }}
    >
      {!isBoothActive ? (
        <>
          {/* BACKUP: Topographic contour backdrop (replaced by the photo background) */}
          {/* <div
            aria-hidden="true"
            className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-20 mix-blend-multiply"
            style={{ backgroundImage: TOPOGRAPHY_BG }}
          /> */}

          {/* BACKUP: Botanical line-art backdrop (replaced by the photo background) */}
          {/* <div
            aria-hidden="true"
            className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-15 mix-blend-multiply"
            style={{ backgroundImage: BOTANICAL_BG, backgroundSize: '280px 280px' }}
          /> */}

          {/* Cozy frosted overlay — blends the photo into the beige theme, keeps text legible */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#F7F5EB]/65 backdrop-blur-[2px] pointer-events-none z-0"
          />

          {/* Header */}
          <header className="w-full relative z-10 px-6 py-5 flex justify-between items-center border-b border-[#2C2A29]/10">
            <h1 className="text-[#2C2A29] font-bold text-lg md:text-xl">Virtual Photo Booth</h1>
            <a
              href="#"
              className="text-[#2C2A29]/70 hover:text-[#2C2A29] text-sm font-medium transition-colors"
            >
              About
            </a>
          </header>

          {/* Hero Section */}
          {/*
           * ══════════════════════════════════════════════════════════════════════════
           * THEME OPTIONS - Copy & paste to test different aesthetics
           * ══════════════════════════════════════════════════════════════════════════
           *
           * APPLIED - Warm Beige (with warm scenery photo backdrop)
           * Main Wrapper: bg-[#F7F5EB]
           * Text: text-[#2C2A29]
           * Secondary: text-[#2C2A29]/70
           * Border: border-[#2C2A29]/10
           * (CTA button intentionally kept on its charcoal style)
           *
           * Alternate - Soft Greige
           * Main Wrapper: bg-[#EBE9E4]
           * Text: text-[#1C1B1A]
           * Secondary: text-[#1C1B1A]/70
           * Border: border-[#1C1B1A]/10
           */}
          <section className="flex-grow flex flex-col items-center justify-center relative z-10 text-center px-4">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-[#2C2A29] mb-6">
              Capture the moment.
            </h2>
            <p className="text-[#2C2A29]/70 text-lg md:text-xl max-w-xl mx-auto mb-10 font-light">
              Classic 3-photo strips and 4-photo grids. Processed privately on your device.
            </p>
            <button
              onClick={handleStartBooth}
              className="
                bg-[#1C1B1A] text-[#EBE9E4]
                px-10 py-4 rounded-full
                text-xl
                border-2 border-[#1C1B1A]
                hover:bg-transparent hover:text-[#1C1B1A]
                transition-all duration-300
                shadow-xl
                hover:shadow-none
                active:scale-95
              "
            >
              Frame the Moment
            </button>
          </section>

          {/* Footer */}
          <footer className="w-full relative z-10 py-6 text-center text-[#2C2A29]/70 text-sm">
            © 2026 Virtual Photo Booth | Built by Bhavik
          </footer>
        </>
      ) : (
        <CameraBooth onExit={() => setIsBoothActive(false)} />
      )}
    </div>
  );
}

export default App;
