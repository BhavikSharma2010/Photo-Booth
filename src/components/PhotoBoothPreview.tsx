import type { PhotoLayout } from '../types/photoLayout';

/**
 * PhotoBoothPreview - Displays captured photos
 * Centered with proper mobile spacing (w-[85%] max-w-xs)
 * Retake/download controls live in the parent component.
 */
interface PhotoBoothPreviewProps {
  photos: string[];
  layout: PhotoLayout;
  /** Resolved Tailwind filter utilities applied to the wrapper (see FILTER_CLASSES). */
  filterClassName: string;
}

/** Glossy plastic sheen over the printed card. Rendered after the photos so it
 *  paints above them; lives inside the html-to-image target so downloads keep it. */
const glossOverlay = (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-50 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-80 mix-blend-overlay"
  />
);

export const PhotoBoothPreview = ({ photos, layout, filterClassName }: PhotoBoothPreviewProps) => {
  // 3-Photo Strip Layout
  if (layout === 'strip-3') {
    return (
      <div
        className={`
          photoPreviewContainer
          relative overflow-hidden mx-auto
          flex flex-col bg-white
          p-3 gap-3
          w-[min(85%,272px,24.4dvh)]
          rounded-lg
          shadow-2xl
          ${filterClassName}
        `}
      >
        {photos.map((photoUrl, index) => (
          <div key={index} className="aspect-[4/3] bg-zinc-100 overflow-hidden rounded">
            <img
              src={photoUrl}
              alt={`Captured photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {glossOverlay}
      </div>
    );
  }

  // 4-Photo Grid Layout
  return (
    <div
      className={`
        photoPreviewContainer
        relative overflow-hidden mx-auto
        grid grid-cols-2 bg-white
        p-2 gap-2
        w-[min(85%,272px,55dvh)]
        rounded-lg
        shadow-2xl
        ${filterClassName}
      `}
    >
      {photos.map((photoUrl, index) => (
        <div key={index} className="aspect-square bg-zinc-100 overflow-hidden rounded">
          <img
            src={photoUrl}
            alt={`Captured photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {glossOverlay}
    </div>
  );
};
