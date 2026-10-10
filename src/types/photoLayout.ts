/**
 * Photo layout format type for the photo booth
 * - 'strip-3': Classic 3-photo vertical strip layout
 * - 'grid-4': Modern 2x2 grid layout (4 photos)
 */
export type PhotoLayout = 'strip-3' | 'grid-4';

/** Photos required per layout format — derived from the PhotoLayout type. */
export const PHOTOS_PER_LAYOUT: Record<PhotoLayout, number> = {
  'strip-3': 3,
  'grid-4': 4,
};
