/** Photo filter options for the finished set: 'none' (raw), 'vintage' (warm faded film), 'bw' (high-contrast mono). */
export type PhotoFilter = 'none' | 'vintage' | 'bw';

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
};

/** Ordered labels driving the filter pill row in CameraBooth. */
export const FILTER_OPTIONS: ReadonlyArray<{ value: PhotoFilter; label: string }> = [
  { value: 'none', label: 'Original' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'bw', label: 'B&W' },
];
