import type { PhotoLayout } from '../types/photoLayout';
import type { FrameStyle } from '../types/photoFrame';
import { FRAME_STYLES } from '../types/photoFrame';
import type { PhotoFit } from '../types/photoFit';

/**
 * PhotoBoothPreview - The printed card: photos in the chosen layout, dressed
 * in the chosen frame. Lives entirely inside the html-to-image download
 * target, so anything rendered here is baked into the JPEG — which is why
 * the decorative shadow lives on a wrapper in ResultView instead.
 */
interface PhotoBoothPreviewProps {
  photos: string[];
  layout: PhotoLayout;
  /** Resolved Tailwind filter utilities applied to the card (see FILTER_CLASSES). */
  filterClassName: string;
  /** Frame owning the card's surface, padding, rounding, and tile styling. */
  frame: FrameStyle;
  /**
   * Overrides the card's background color (the Auto frame's derived tint).
   * Inline styles rasterize reliably through html-to-image, so the tint
   * bakes into the download.
   */
  surfaceColor?: string;
  /** Optional printed line under the photos: «text» • «date». */
  caption?: StripCaption | null;
  /** How each photo fills its slot; undefined = 'cover' (edge-to-edge crop). */
  fit?: PhotoFit;
  /**
   * While true, photos play the staggered develop-in animation (reveal after
   * the print eject). Never true while html-to-image runs — CameraBooth gates
   * downloads until the reveal completes.
   */
  isDeveloping?: boolean;
  /**
   * When provided, each photo gains a transparent retake hit button (a
   * sibling overlay of the img, excluded from downloads via its
   * data-photo-hit attribute — see handleDownload in CameraBooth).
   */
  onSlotClick?: (index: number) => void;
}

/** Caption + date stamp printed at the bottom of the card. */
export interface StripCaption {
  text: string;
  dateLabel: string;
}

/** Per-tile delay of the develop-in stagger; must match CameraBooth's timer. */
const TILE_STAGGER_MS = 160;

/** Glossy plastic sheen over the printed card. Rendered after the photos so it
 *  paints above them; lives inside the html-to-image target so downloads keep it. */
const glossOverlay = (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-50 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-80 mix-blend-overlay"
  />
);

interface PhotoTileProps {
  photoUrl: string;
  index: number;
  tileClassName: string;
  aspectClassName: string;
  /** While true, this tile plays the develop-in animation after its stagger delay. */
  isDeveloping: boolean;
  fit: PhotoFit;
  onSlotClick?: (index: number) => void;
}

const PhotoTile = ({
  photoUrl,
  index,
  tileClassName,
  aspectClassName,
  isDeveloping,
  fit,
  onSlotClick,
}: PhotoTileProps) => (
  <div className={`relative overflow-hidden ${aspectClassName} ${tileClassName}`}>
    <img
      src={photoUrl}
      alt={`Captured photo ${index + 1}`}
      className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${
        isDeveloping ? 'tile-develop' : ''
      }`}
      style={isDeveloping ? { animationDelay: `${index * TILE_STAGGER_MS}ms` } : undefined}
    />
    {onSlotClick && (
      <button
        type="button"
        id={`retake-hit-${index}`}
        data-photo-hit="true"
        aria-label={`Retake photo ${index + 1}`}
        onClick={() => onSlotClick(index)}
        // Undeveloped tiles aren't retakable yet (invisible overlay, so no
        // visual change); focus lands here only after the reveal completes.
        disabled={isDeveloping}
        className="absolute inset-0 z-10 rounded-[inherit] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      />
    )}
  </div>
);

export const PhotoBoothPreview = ({
  photos,
  layout,
  filterClassName,
  frame,
  surfaceColor,
  caption,
  fit = 'cover',
  isDeveloping = false,
  onSlotClick,
}: PhotoBoothPreviewProps) => {
  const frameDefinition = FRAME_STYLES[frame];
  const isStrip = layout === 'strip-3';

  return (
    <div
      className={`
        photoPreviewContainer
        relative overflow-hidden mx-auto
        ${isStrip ? 'flex flex-col' : 'grid grid-cols-2'}
        ${isStrip ? 'result-card-strip' : 'result-card-grid'}
        ${frameDefinition.card[layout]}
        ${filterClassName}
      `}
      style={{ ...frameDefinition.style, backgroundColor: surfaceColor }}
    >
      {photos.map((photoUrl, index) => (
        <PhotoTile
          key={index}
          photoUrl={photoUrl}
          index={index}
          tileClassName={frameDefinition.tile}
          aspectClassName={isStrip ? 'aspect-[4/3]' : 'aspect-square'}
          isDeveloping={isDeveloping}
          fit={fit}
          onSlotClick={onSlotClick}
        />
      ))}
      {caption && (
        <p
          className={`text-center font-mono text-[8px] sm:text-[9px] tracking-[0.18em] uppercase whitespace-nowrap overflow-hidden ${frameDefinition.caption}`}
        >
          {caption.text} • {caption.dateLabel}
        </p>
      )}
      {glossOverlay}
    </div>
  );
};
