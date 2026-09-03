import type { PhotoLayout } from '../types/photoLayout';

/**
 * PhotoBoothPreview - Displays captured photos
 * Centered with proper mobile spacing (w-[85%] max-w-xs)
 * Retake/download controls live in the parent component.
 */
interface PhotoBoothPreviewProps {
  photos: string[];
  layout: PhotoLayout;
}

export const PhotoBoothPreview = ({ photos, layout }: PhotoBoothPreviewProps) => {
  // 3-Photo Strip Layout
  if (layout === 'strip-3') {
    return (
      <div
        className="
          photoPreviewContainer
          flex flex-col bg-white
          p-3 gap-3
          w-[min(85%,272px,24.4dvh)]
          rounded-lg
          shadow-2xl
        "
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
      </div>
    );
  }

  // 4-Photo Grid Layout
  return (
    <div
      className="
        photoPreviewContainer
        grid grid-cols-2 bg-white
        p-2 gap-2
        w-[min(85%,272px,55dvh)]
        rounded-lg
        shadow-2xl
      "
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
    </div>
  );
};
