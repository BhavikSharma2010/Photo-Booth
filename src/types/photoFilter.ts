/**
 * Photo filter options for the finished set:
 * - 'none' (raw), 'vintage' (warm faded film), 'bw' (high-contrast mono),
 * - 'sunny' (golden warmth), 'cool' (crisp blue cast), 'faded' (washed pastel).
 */
export type PhotoFilter = 'none' | 'vintage' | 'bw' | 'sunny' | 'cool' | 'faded';

/**
 * Tailwind filter utilities per look, applied to the preview wrapper in
 * PhotoBoothPreview and baked into the download via html-to-image.
 * Record<PhotoFilter, string> forces an entry per union member.
 * Note: when adding a filter here, also add it to FILTER_OPTIONS below.
 */
export const FILTER_CLASSES: Record<PhotoFilter, string> = {
  none: '',
  vintage: 'sepia-[.85] saturate-[.75] contrast-[1.1] brightness-[.9] hue-rotate-[-15deg]',
  bw: 'grayscale contrast-[1.2] brightness-[.95]',
  sunny: 'sepia-[.35] saturate-[1.4] brightness-[1.08] contrast-[1.02]',
  cool: 'saturate-[1.15] hue-rotate-[12deg] contrast-[1.05]',
  faded: 'saturate-[.6] contrast-[.85] brightness-[1.1] sepia-[.15]',
};

/** Ordered labels driving the filter pill row in the result view. */
export const FILTER_OPTIONS: ReadonlyArray<{ value: PhotoFilter; label: string }> = [
  { value: 'none', label: 'Original' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'bw', label: 'B&W' },
  { value: 'sunny', label: 'Sunny' },
  { value: 'cool', label: 'Cool' },
  { value: 'faded', label: 'Faded' },
];
