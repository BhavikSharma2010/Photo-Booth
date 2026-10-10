import type { RefObject } from 'react';
import Webcam from 'react-webcam';
import type { PhotoLayout } from '../types/photoLayout';
import type {
  CaptureGapChoice,
  CountdownChoice,
  TimerSettings as TimerSettingsState,
} from '../types/timerSettings';
import { LayoutFormatToggle } from './ui/LayoutFormatToggle';
import { TimerSettings } from './ui/TimerSettings';
import { MuteButton } from './ui/MuteButton';
import { PoseOverlay } from './PoseOverlay';

/**
 * Viewfinder - Live camera, capture overlays, and the action bar. Pure
 * presentation: all booth state and callbacks are owned by CameraBooth.
 */
interface ViewfinderProps {
  webcamRef: RefObject<Webcam | null>;
  /** Bumping remounts the Webcam (re-runs getUserMedia) — see retryCamera. */
  cameraRetryKey: number;
  facingMode: 'user' | 'environment';
  layout: PhotoLayout;
  photos: string[];
  /** Total photos the current layout targets (drives empty slots + labels). */
  totalPhotos: number;
  /** Seconds remaining on the get-ready countdown; null when not counting. */
  countdown: number | null;
  /** 1-based shot being taken; null when idle (drives "Photo N of M"). */
  shotNumber: number | null;
  /** Current pose prompt shown under the countdown numeral. */
  pose: string;
  /** Bumped per shot to replay the flash animation. */
  flashKey: number;
  hasCameraError: boolean;
  /** True once the video has decoded its first frame (drives warm-up UI). */
  isCameraReady: boolean;
  isSessionActive: boolean;
  onUserMedia: (stream: MediaStream) => void;
  onUserMediaError: () => void;
  onRetryCamera: () => void;
  onFlipCamera: () => void;
  onLayoutChange: (layout: PhotoLayout) => void;
  onStartCapture: () => void;
  /** Timer preferences shown/edited in the popover. */
  timer: TimerSettingsState;
  onCountdownChange: (countdown: CountdownChoice) => void;
  onGapChange: (gap: CaptureGapChoice) => void;
  isMuted: boolean;
  onToggleMuted: () => void;
}

export const Viewfinder = ({
  webcamRef,
  cameraRetryKey,
  facingMode,
  layout,
  photos,
  totalPhotos,
  countdown,
  shotNumber,
  pose,
  flashKey,
  hasCameraError,
  isCameraReady,
  isSessionActive,
  onUserMedia,
  onUserMediaError,
  onRetryCamera,
  onFlipCamera,
  onLayoutChange,
  onStartCapture,
  timer,
  onCountdownChange,
  onGapChange,
  isMuted,
  onToggleMuted,
}: ViewfinderProps) => (
  <div className="relative w-full max-w-md h-[75dvh] max-h-[800px] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
    <Webcam
      key={cameraRetryKey}
      audio={false}
      screenshotFormat="image/jpeg"
      ref={webcamRef}
      videoConstraints={{ facingMode }}
      mirrored={facingMode === 'user'}
      onUserMedia={onUserMedia}
      onUserMediaError={onUserMediaError}
      className="w-full h-full object-cover"
    />

    {/* Camera-flash pulse on each shot */}
    {flashKey > 0 && (
      <div
        key={flashKey}
        aria-hidden="true"
        className="capture-flash absolute inset-0 bg-white pointer-events-none z-20 motion-reduce:hidden"
      />
    )}

    {/* Live rail: captured thumbs + remaining slots. Left-aligned so it can
        never collide with the timer/mute buttons at the top-right. */}
    <div className="absolute top-3 left-3 flex gap-2 z-30">
      {photos.map((photoUrl, index) => (
        <img
          key={index}
          src={photoUrl}
          alt={`Captured photo ${index + 1}`}
          className="w-12 h-9 rounded object-cover border border-white/40"
        />
      ))}
      {Array.from({ length: totalPhotos - photos.length }, (_, slot) => (
        <div
          key={`slot-${slot}`}
          className="w-12 h-9 rounded border-2 border-dashed border-white/30"
        />
      ))}
    </div>

    {/* Camera warm-up: visible until the first frame decodes */}
    {!isCameraReady && !hasCameraError && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/80">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin motion-reduce:animate-none"
        />
        <p className="text-sm">Starting camera…</p>
      </div>
    )}

    {/* Get-ready countdown, pose prompt, and shot counter */}
    <PoseOverlay countdown={countdown} pose={pose} shotNumber={shotNumber} totalShots={totalPhotos} />

    {/* Camera-permission failure: explain and offer a retry */}
    {hasCameraError && (
      <div
        role="alert"
        className="absolute inset-0 z-30 bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center gap-4 p-6"
      >
        <svg
          className="w-10 h-10 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <p className="text-white font-medium md:text-lg">
          Camera access is needed to start the booth
        </p>
        <p className="text-zinc-400 text-sm max-w-xs">
          Your photos never leave your device. Allow camera access in your browser, then try
          again.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onRetryCamera}
            className="bg-white text-zinc-950 font-medium px-8 py-3 rounded-full hover:bg-zinc-200 transition-colors w-full sm:w-auto"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onFlipCamera}
            className="bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-full font-medium transition-colors w-full sm:w-auto"
          >
            Switch camera
          </button>
        </div>
      </div>
    )}

    {/* Timer + mute pinned to the viewfinder's top-right (hidden while the
        error overlay owns the viewfinder). Fixed inset, so placement never
        depends on the action bar's height. */}
    {!hasCameraError && (
      <div className="absolute top-3 right-3 flex gap-2 z-30">
        <TimerSettings
          countdown={timer.countdown}
          gap={timer.gap}
          onCountdownChange={onCountdownChange}
          onGapChange={onGapChange}
          disabled={isSessionActive}
        />
        <MuteButton isMuted={isMuted} onToggle={onToggleMuted} />
      </div>
    )}

    {/* Action bar */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-3 grid grid-cols-3 items-center z-30">
      {/* Column 1: Layout toggle (3-photo strip / 4-photo grid) */}
      <div className="flex justify-start items-center">
        <LayoutFormatToggle
          currentLayout={layout}
          onLayoutChange={onLayoutChange}
          disabled={isSessionActive}
        />
      </div>

      {/* Column 2: Shutter — one click captures the whole set */}
      <div className="flex justify-center">
        <button
          type="button"
          id="booth-shutter"
          onClick={onStartCapture}
          disabled={isSessionActive || hasCameraError || !isCameraReady}
          aria-label={`Take photo ${Math.min(photos.length + 1, totalPhotos)} of ${totalPhotos}`}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:cursor-not-allowed disabled:opacity-70 mx-auto"
        />
      </div>

      {/* Column 3: Flip camera */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onFlipCamera}
          aria-label="Flip camera"
          className="text-white p-2 flex justify-end"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
);
