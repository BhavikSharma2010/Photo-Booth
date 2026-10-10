import { useEffect, useRef, type RefObject } from 'react';

/** Max tilt (degrees) as the cursor reaches the hero's edges. */
const MAX_TILT_DEG = 8;

interface HeroStripProps {
  /** The hero section — pointer moves over it drive the parallax. */
  containerRef: RefObject<HTMLElement | null>;
}

/**
 * HeroStrip - Decorative mock photo strip floating beside the landing hero,
 * styled like the booth's real output (zero image assets). Tilts toward the
 * mouse via --tilt-x/--tilt-y CSS vars written by a rAF-throttled listener,
 * and bobs on a slow loop. aria-hidden, pointer-events-none, hidden on
 * small screens, and fully static under prefers-reduced-motion.
 */
export const HeroStrip = ({ containerRef }: HeroStripProps) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
        const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
        const strip = stripRef.current;
        if (!strip) return;
        strip.style.setProperty('--tilt-x', `${(-normalizedY * MAX_TILT_DEG).toFixed(2)}deg`);
        strip.style.setProperty('--tilt-y', `${(normalizedX * MAX_TILT_DEG).toFixed(2)}deg`);
      });
    };

    container.addEventListener('pointermove', handlePointerMove);
    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-[6%] top-1/2 -translate-y-1/2 hidden lg:block z-0"
    >
      {/* Bob loop on the outer wrapper; the 3D tilt lives on the inner card so
          the two transforms never conflict. */}
      <div className="strip-bob">
        <div
          ref={stripRef}
          className="w-[120px] rounded-lg bg-white p-3 gap-3 shadow-2xl flex flex-col"
          style={{
            transform:
              'perspective(700px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)) rotate(-4deg)',
          }}
        >
          {/* Mock tiles suggesting the filter looks: natural, vintage, B&W */}
          <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#d8c9b8] to-[#a08a6e]" />
          <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#c9ab7c] to-[#6e5335]" />
          <div className="aspect-[4/3] rounded bg-gradient-to-br from-[#e8e8e8] to-[#5f5f5f]" />
          <p className="text-center text-[8px] font-medium tracking-[0.25em] text-zinc-500">
            VIRTUAL PHOTO BOOTH
          </p>
        </div>
      </div>
    </div>
  );
};
