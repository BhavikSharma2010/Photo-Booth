/**
 * How each photo fills its printed slot:
 * - 'cover' (default): fills the slot edge-to-edge; mismatched aspect is
 *   cropped (matters most on portrait phones, where the camera's tall frame
 *   loses its top/bottom in the 4:3 or 1:1 slots).
 * - 'contain': whole photo visible, letterboxed on the frame's photo-well
 *   color.
 */
export type PhotoFit = 'cover' | 'contain';

/** Ordered labels driving the photo-fit pill row in the result view. */
export const PHOTO_FIT_OPTIONS: ReadonlyArray<{ value: PhotoFit; label: string }> = [
  { value: 'cover', label: 'Crop' },
  { value: 'contain', label: 'Full' },
];
