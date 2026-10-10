import type { RefObject } from 'react';
import type { PhotoLayout } from '../types/photoLayout';
import type { PhotoFilter } from '../types/photoFilter';
import type { FrameStyle } from '../types/photoFrame';
import type { PhotoFit } from '../types/photoFit';
import { MAX_CAPTION_LENGTH } from '../lib/preferences';
import { PhotoBoothPreview, type StripCaption } from './PhotoBoothPreview';
import { FilterPicker } from './ui/FilterPicker';
import { FramePicker } from './ui/FramePicker';
import { PhotoFitPicker } from './ui/PhotoFitPicker';
import { ResultActions, type ShareStatus } from './ResultActions';

/**
 * ResultView - The finished set: printer slot with the eject animation, the
 * download target (preview card), filter/frame pickers, caption toggle, and
 * final actions.
 *
 * Layout: the outer column scrolls; an inner my-auto wrapper centers the
 * content when there's room. justify-center on a scroll container would
 * make the top unreachable, and without shrink-0 flexbox compresses the
 * printer-slot wrapper — whose overflow-hidden then clips the card — so
 * every child is shrink-0 and overflow becomes plain scrolling instead.
 */
interface ResultViewProps {
  photos: string[];
  layout: PhotoLayout;
  /** Resolved filter utilities for the card (see FILTER_CLASSES). */
  filterClassName: string;
  activeFilter: PhotoFilter;
  activeFrame: FrameStyle;
  /** Auto-frame surface tint derived from the photos (lib/photoColors). */
  surfaceColor?: string;
  /** Printed caption + date line; null/undefined when the user opted out. */
  caption?: StripCaption | null;
  isCaptionEnabled: boolean;
  captionText: string;
  onCaptionEnabledChange: (enabled: boolean) => void;
  onCaptionTextChange: (text: string) => void;
  /** How photos fill their slots (Crop = cover, Full = contain). */
  photoFit: PhotoFit;
  onPhotoFitChange: (fit: PhotoFit) => void;
  isPrinting: boolean;
  /** True while the develop-in stagger is on screen (drives the animation). */
  isDeveloping: boolean;
  /**
   * True from the eject until the reveal completes: keeps the action buttons
   * disabled so html-to-image can never capture mid-animation.
   */
  isRevealing: boolean;
  isDownloadError: boolean;
  shareStatus: ShareStatus;
  /** Download target — CameraBooth owns the ref for handleDownload. */
  previewRef: RefObject<HTMLDivElement | null>;
  /** Focus lands here when the set completes (see focus choreography). */
  headingRef: RefObject<HTMLHeadingElement | null>;
  onFilterChange: (filter: PhotoFilter) => void;
  onFrameChange: (frame: FrameStyle) => void;
  onRetakeSlot: (index: number) => void;
  onRetakeAll: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export const ResultView = ({
  photos,
  layout,
  filterClassName,
  activeFilter,
  activeFrame,
  surfaceColor,
  caption,
  isCaptionEnabled,
  captionText,
  onCaptionEnabledChange,
  onCaptionTextChange,
  photoFit,
  onPhotoFitChange,
  isPrinting,
  isDeveloping,
  isRevealing,
  isDownloadError,
  shareStatus,
  previewRef,
  headingRef,
  onFilterChange,
  onFrameChange,
  onRetakeSlot,
  onRetakeAll,
  onShare,
  onDownload,
}: ResultViewProps) => (
  <div className="w-full max-w-md max-h-full overflow-y-auto no-scrollbar flex flex-col">
    <div className="my-auto flex w-full flex-col items-center gap-5 py-4">
      {/* Focus target announced to screen readers when the set completes. */}
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Your photo set is ready
      </h2>

      {/* Printer slot: the card ejects downward out of it; overflow-hidden clips
          the card above the lip while printing (no top padding, so -translate-y-full
          hides exactly at the clip edge). Chrome stays outside the download target. */}
      <div className="relative z-10 w-full shrink-0 flex justify-center px-6 pb-6 overflow-hidden bg-zinc-900 border-t border-zinc-700/50">
        <div
          className={`w-full max-w-xs transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none ${
            isPrinting ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          {/* Decorative shadow — deliberately OUTSIDE the download target:
              box-shadow clips at the capture node's bounds in html-to-image. */}
          <div className="shadow-2xl rounded-lg">
            <div ref={previewRef} className="w-full">
              <PhotoBoothPreview
                photos={photos}
                layout={layout}
                filterClassName={filterClassName}
                frame={activeFrame}
                surfaceColor={surfaceColor}
                caption={caption}
                fit={photoFit}
                isDeveloping={isDeveloping}
                onSlotClick={onRetakeSlot}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pickers + caption editor (outside previewRef so they are never baked
          into the output), each a single-line horizontal scroller or simple row. */}
      <div className="w-full shrink-0 flex flex-col gap-3 px-4">
        <div className="w-full">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">Filter</p>
          <FilterPicker value={activeFilter} onChange={onFilterChange} />
        </div>
        <div className="w-full">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">Frame</p>
          <FramePicker value={activeFrame} onChange={onFrameChange} />
        </div>
        <div className="w-full">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">Photo fit</p>
          <PhotoFitPicker value={photoFit} onChange={onPhotoFitChange} />
        </div>
        <div className="w-full">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">Caption</p>
          <div className="flex items-center gap-2">
            {/* Opt-in: off by default, so no text appears unless asked for. */}
            <button
              type="button"
              onClick={() => onCaptionEnabledChange(!isCaptionEnabled)}
              aria-pressed={isCaptionEnabled}
              className={`shrink-0 px-3 py-2.5 rounded-full text-xs sm:text-sm transition-colors ${
                isCaptionEnabled
                  ? 'bg-white text-zinc-950 font-medium'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isCaptionEnabled ? 'On' : 'Off'}
            </button>
            {isCaptionEnabled && (
              <input
                type="text"
                value={captionText}
                onChange={(event) => onCaptionTextChange(event.target.value)}
                maxLength={MAX_CAPTION_LENGTH}
                placeholder="Virtual Photo Booth"
                aria-label="Caption text"
                className="flex-1 min-w-0 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-white/60"
              />
            )}
          </div>
          {isCaptionEnabled && (
            <p className="text-[11px] text-zinc-500 mt-1 px-1">
              Prints under your photos with today&apos;s date.
            </p>
          )}
        </div>
      </div>

      <div className="w-full shrink-0 flex flex-col items-center">
        <ResultActions
          isPrinting={isPrinting}
          isRevealing={isRevealing}
          isDownloadError={isDownloadError}
          shareStatus={shareStatus}
          onRetakeAll={onRetakeAll}
          onShare={onShare}
          onDownload={onDownload}
        />
      </div>
    </div>
  </div>
);
