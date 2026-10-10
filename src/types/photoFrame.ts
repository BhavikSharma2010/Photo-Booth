import type { CSSProperties } from 'react';
import type { PhotoLayout } from './photoLayout';

/**
 * Frame styles for the printed card. Applied inside PhotoBoothPreview so
 * html-to-image bakes them into the download.
 *
 * Constraint: only border / background / border-radius / clip-path effects
 * belong in a frame — box-shadow clips at the capture node's bounds and
 * mask-image rasterizes unreliably through html-to-image's foreignObject
 * clone. Frames fully own the card's padding + rounding (as a per-layout
 * record, since strip and grid paddings differ and duplicate Tailwind
 * padding/radius classes resolve unpredictably) and the photo cells'
 * background + rounding, so no conflicting utilities ever coexist.
 *
 * 'auto' uses classic geometry; its surface is overridden at render time by
 * a pastel tint derived from the captured photos (see lib/photoColors) via
 * PhotoBoothPreview's surfaceColor prop.
 */
export type FrameStyle = 'classic' | 'auto' | 'charcoal' | 'soft' | 'gold' | 'deckle';

export interface FrameDefinition {
  label: string;
  /** Card-surface classes per layout — owns padding + rounding + surface. */
  card: Record<PhotoLayout, string>;
  /** Photo-cell classes — owns background + rounding. */
  tile: string;
  /** Caption-line text color classes (dark on light surfaces, light on dark). */
  caption: string;
  /** Inline style, used by deckle for its torn clip-path. */
  style?: CSSProperties;
}

/**
 * Jagged polygon standing in for a deckled (torn-paper) edge: ~2% jitter
 * around all four sides, deterministic so the on-screen preview and the
 * download always match.
 */
const DECKLE_CLIP_PATH = `polygon(
  0% 1.2%, 3% 0.4%, 7% 1.6%, 11% 0.2%, 15% 1.1%, 19% 0.5%, 23% 1.8%, 27% 0.3%,
  31% 1.2%, 35% 0.6%, 39% 1.7%, 43% 0.2%, 47% 1.4%, 51% 0.5%, 55% 1.6%,
  59% 0.3%, 63% 1.1%, 67% 0.6%, 71% 1.8%, 75% 0.4%, 79% 1.3%, 83% 0.5%,
  87% 1.6%, 91% 0.2%, 95% 1.2%, 98% 0.5%, 100% 1.5%,
  99.2% 4%, 100% 8%, 98.8% 12%, 99.8% 16%, 98.9% 20%, 100% 24%, 99.1% 28%,
  99.9% 32%, 98.8% 36%, 99.7% 40%, 99% 44%, 100% 48%, 98.9% 52%, 99.8% 56%,
  99% 60%, 100% 64%, 98.8% 68%, 99.6% 72%, 99% 76%, 100% 80%, 98.9% 84%,
  99.7% 88%, 99.1% 92%, 100% 96%, 99% 100%,
  96% 99%, 92% 99.8%, 88% 98.9%, 84% 99.7%, 80% 99%, 76% 100%, 72% 98.8%,
  68% 99.6%, 64% 99%, 60% 99.9%, 56% 98.9%, 52% 99.7%, 48% 99%, 44% 100%,
  40% 98.9%, 36% 99.8%, 32% 99.1%, 28% 99.9%, 24% 99%, 20% 100%, 16% 98.8%,
  12% 99.6%, 8% 99.1%, 4% 99.9%, 1% 99%,
  0.8% 96%, 0% 92%, 1.1% 88%, 0.2% 84%, 1% 80%, 0% 76%, 1.2% 72%, 0.3% 68%,
  1% 64%, 0.1% 60%, 1.1% 56%, 0.2% 52%, 1% 48%, 0% 44%, 1.2% 40%, 0.3% 36%,
  1% 32%, 0.1% 28%, 1.1% 24%, 0.2% 20%, 1% 16%, 0% 12%, 1.2% 8%, 0.4% 4%
)`;

/**
 * Solid fill behind a deckle download: the torn clip-path leaves transparent
 * area outside the card, which is invisible against the default white —
 * against zinc-900 the edge reads as a torn print. Used by handleDownload.
 */
export const DECKLE_DOWNLOAD_BG = '#18181b';

export const FRAME_STYLES: Record<FrameStyle, FrameDefinition> = {
  classic: {
    label: 'Classic',
    card: {
      'strip-3': 'bg-white p-3 gap-3 rounded-lg',
      'grid-4': 'bg-white p-2 gap-2 rounded-lg',
    },
    tile: 'bg-zinc-100 rounded',
    caption: 'text-zinc-700',
  },
  auto: {
    label: 'Auto',
    card: {
      'strip-3': 'bg-white p-3 gap-3 rounded-lg',
      'grid-4': 'bg-white p-2 gap-2 rounded-lg',
    },
    tile: 'bg-zinc-100 rounded',
    caption: 'text-zinc-700',
  },
  charcoal: {
    label: 'Charcoal',
    card: {
      'strip-3': 'bg-zinc-950 p-3 gap-3 rounded-lg',
      'grid-4': 'bg-zinc-950 p-2 gap-2 rounded-lg',
    },
    tile: 'bg-zinc-900 rounded',
    caption: 'text-zinc-300',
  },
  soft: {
    label: 'Soft',
    card: {
      'strip-3': 'bg-white p-4 gap-3 rounded-3xl',
      'grid-4': 'bg-white p-3 gap-2 rounded-3xl',
    },
    tile: 'bg-zinc-100 rounded-xl',
    caption: 'text-zinc-700',
  },
  gold: {
    label: 'Gold',
    card: {
      'strip-3': 'bg-white p-3 gap-3 rounded-lg border-2 border-amber-400',
      'grid-4': 'bg-white p-2 gap-2 rounded-lg border-2 border-amber-400',
    },
    tile: 'bg-zinc-100 rounded',
    caption: 'text-zinc-700',
  },
  deckle: {
    label: 'Deckle',
    card: {
      'strip-3': 'bg-white p-3 gap-3 rounded-none',
      'grid-4': 'bg-white p-2 gap-2 rounded-none',
    },
    tile: 'bg-zinc-100 rounded',
    caption: 'text-zinc-700',
    style: { clipPath: DECKLE_CLIP_PATH },
  },
};

/** Ordered labels driving the frame pill row in the result view. */
export const FRAME_OPTIONS: ReadonlyArray<{ value: FrameStyle; label: string }> = [
  { value: 'classic', label: 'Classic' },
  { value: 'auto', label: 'Auto' },
  { value: 'charcoal', label: 'Charcoal' },
  { value: 'soft', label: 'Soft' },
  { value: 'gold', label: 'Gold' },
  { value: 'deckle', label: 'Deckle' },
];
