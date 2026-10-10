import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { toJpeg, toPng } from 'html-to-image';
import type { PhotoLayout } from '../types/photoLayout';
import { PHOTOS_PER_LAYOUT } from '../types/photoLayout';
import { FILTER_CLASSES, type PhotoFilter } from '../types/photoFilter';
import { DECKLE_DOWNLOAD_BG, type FrameStyle } from '../types/photoFrame';
import type { PhotoFit } from '../types/photoFit';
import type { CaptureGapChoice, CountdownChoice, TimerSettings } from '../types/timerSettings';
import { COUNTDOWN_SECONDS, GAP_MS } from '../types/timerSettings';
import { useCaptureSession } from '../hooks/useCaptureSession';
import { useAudioCues } from '../hooks/useAudioCues';
import { usePosePrompt } from '../hooks/usePosePrompt';
import { useCameraReady } from '../hooks/useCameraReady';
import { useAnnouncer } from '../hooks/useAnnouncer';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { loadPreferences, savePreferences, DEFAULT_PREFERENCES } from '../lib/preferences';
import { derivePhotoTint } from '../lib/photoColors';
import { Viewfinder } from './Viewfinder';
import { ResultView } from './ResultView';
import type { ShareStatus } from './ResultActions';

/** How long the result view shows the empty printer slot before the strip ejects. */
const PRINT_EJECT_DELAY_MS = 2000;

/** Must match the eject card's duration-[1500ms] transition in ResultView. */
const EJECT_DURATION_MS = 1500;

/** Per-tile stagger of the develop-in reveal; must match PhotoBoothPreview. */
const TILE_STAGGER_MS = 160;

/** How long each tile's develop-in animation runs. */
const TILE_DEVELOP_MS = 550;

/** Filename for the downloaded (and shared) photo strip. */
const DOWNLOAD_FILENAME = 'virtual-photobooth.jpg';

/** How long the share status line stays visible before clearing. */
const SHARE_STATUS_CLEAR_MS = 2500;

/**
 * Makes a captured frame match what the user saw in the live preview: the
 * viewfinder shows the raw camera frame center-cropped by object-cover to
 * the viewfinder box's shape, but getScreenshot returns the raw frame — so
 * without this, the saved photo is a different crop than the one that was
 * framed (and a 4:3 raw frame into 4:3 slots makes the Full/Crop toggle a
 * visual no-op). Crops to targetAspect (viewfinder client box), mirrors for
 * the front camera. targetAspect undefined or any decode failure keeps the
 * original frame — keeping the shot beats losing it.
 */
const processScreenshot = (
  dataUrl: string,
  targetAspect: number | undefined,
  shouldMirror: boolean,
): Promise<string> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      // Largest center crop matching targetAspect (object-cover math).
      let cropWidth = image.naturalWidth;
      let cropHeight = image.naturalHeight;
      if (targetAspect && Number.isFinite(targetAspect) && targetAspect > 0) {
        if (image.naturalWidth / image.naturalHeight > targetAspect) {
          cropWidth = Math.round(image.naturalHeight * targetAspect);
        } else {
          cropHeight = Math.round(image.naturalWidth / targetAspect);
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }
      const offsetX = (image.naturalWidth - cropWidth) / 2;
      const offsetY = (image.naturalHeight - cropHeight) / 2;
      if (shouldMirror) {
        context.translate(cropWidth, 0);
        context.scale(-1, 1);
      }
      context.drawImage(image, offsetX, offsetY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

interface CameraBoothProps {
  onExit: () => void;
}

export const CameraBooth = ({ onExit }: CameraBoothProps) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [layout, setLayout] = useState<PhotoLayout>('strip-3');
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('none');
  const [activeFrame, setActiveFrame] = useState<FrameStyle>('classic');
  // Presentational per-set choice like filter/frame — deliberately not persisted.
  const [photoFit, setPhotoFit] = useState<PhotoFit>('cover');
  /** Auto-frame surface tint derived from the captured photos (null = white). */
  const [autoTint, setAutoTint] = useState<string | null>(null);
  /** Set while redoing a single photo: the viewfinder replaces that slot only. */
  const [retakeSlot, setRetakeSlot] = useState<number | null>(null);
  const [isDownloadError, setIsDownloadError] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [isPrinting, setIsPrinting] = useState(true);
  /** True while the post-eject develop-in stagger is on screen. */
  const [isDeveloping, setIsDeveloping] = useState(false);
  /** Set once the last tile lands; unlocks Share/Download after the reveal. */
  const [revealDone, setRevealDone] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);

  // Read once per mount; mute, timer, and caption then live in their own states.
  const [initialPreferences] = useState(loadPreferences);
  const audio = useAudioCues(initialPreferences.isMuted);
  // Stable alias for effects and long-lived callbacks (play is useCallback'd).
  const { play: playCue } = audio;
  const posePrompt = usePosePrompt();
  const [timer, setTimer] = useState<TimerSettings>(initialPreferences);
  const [isCaptionEnabled, setIsCaptionEnabled] = useState(initialPreferences.isCaptionEnabled);
  const [captionText, setCaptionText] = useState(initialPreferences.captionText);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  // Read once: the reveal staging decision is fixed for the booth's lifetime.
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Under reduced motion nothing animates, so the reveal is instantly "done"
  // and the action buttons are never locked behind it.
  const isRevealDone = revealDone || prefersReducedMotion;

  useEffect(() => {
    savePreferences({
      countdown: timer.countdown,
      gap: timer.gap,
      isMuted: audio.isMuted,
      isCaptionEnabled,
      captionText,
    });
  }, [timer, audio.isMuted, isCaptionEnabled, captionText]);

  const handleCountdownChange = (countdown: CountdownChoice) => {
    setTimer((previous) => ({ ...previous, countdown }));
  };

  const handleGapChange = (gap: CaptureGapChoice) => {
    setTimer((previous) => ({ ...previous, gap }));
  };

  const webcamRef = useRef<Webcam>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Mirror of retakeSlot readable inside the async session callbacks. */
  const retakeSlotRef = useRef<number | null>(null);
  const wasPrintingRef = useRef(true);

  const isCameraReady = useCameraReady(webcamRef, cameraRetryKey);
  const announcer = useAnnouncer();
  const { announce } = announcer;

  const totalPhotos = PHOTOS_PER_LAYOUT[layout];
  const isSetComplete = capturedPhotos.length === totalPhotos;

  // Printed caption line: opt-in; an empty text falls back to the default.
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const activeCaption =
    isCaptionEnabled && capturedPhotos.length > 0
      ? {
          text: captionText.trim() || DEFAULT_PREFERENCES.captionText,
          dateLabel: todayLabel,
        }
      : null;
  // A camera error keeps the viewfinder (and its recovery actions) on screen
  // even when a finished set exists — otherwise the error overlay would hide
  // behind the result view with no way to retry.
  const isResultView = isSetComplete && retakeSlot === null && !hasCameraError;
  const filterClassName = FILTER_CLASSES[activeFilter];

  const handleFlipCamera = () => {
    setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'));
  };

  // Capture session: countdown ticks and shots flow through these callbacks.
  const session = useCaptureSession({
    onCapture: async () => {
      audio.play('shutter');
      const screenshot = webcamRef.current?.getScreenshot();
      if (!screenshot) return null;
      // The stored photo is cropped to the viewfinder's shape (what the user
      // framed, since the preview object-covers the same box) and front-camera
      // frames are flipped to match the mirrored preview.
      const video = webcamRef.current?.video;
      const targetAspect =
        video && video.clientWidth > 0 && video.clientHeight > 0
          ? video.clientWidth / video.clientHeight
          : undefined;
      return processScreenshot(screenshot, targetAspect, facingMode === 'user');
    },
    onCountdownTick: (secondsRemaining) => {
      posePrompt.advance();
      // The last tick carries the rising "Smile!" chime.
      audio.play(secondsRemaining === 1 ? 'beepFinal' : 'beep');
      announce(secondsRemaining === 1 ? 'Smile!' : String(secondsRemaining));
    },
    onPhotoCaptured: (photo, shotIndex) => {
      setFlashKey((key) => key + 1);
      posePrompt.advance();
      const slot = retakeSlotRef.current;
      if (slot === null) {
        announce(`Photo ${shotIndex + 1} of ${totalPhotos} captured`);
        // Capped at the target so a camera hiccup can never overflow the set.
        setCapturedPhotos((photos) =>
          photos.length < totalPhotos ? [...photos, photo] : photos,
        );
      } else {
        // Slot replace: length never changes, so isSetComplete stays true and
        // the result view returns with no second print animation.
        setCapturedPhotos((photos) =>
          photos.map((existing, index) => (index === slot ? photo : existing)),
        );
      }
    },
    onFinished: (completed) => {
      // Completed or cancelled: the slot is consumed either way — a cancelled
      // retake simply keeps the original photo.
      const slot = retakeSlotRef.current;
      retakeSlotRef.current = null;
      setRetakeSlot(null);
      if (slot !== null) {
        announce(completed ? `Photo ${slot + 1} updated` : 'Retake cancelled');
        // Focus the retaken slot's button once the result view has painted.
        requestAnimationFrame(() => {
          document.getElementById(`retake-hit-${slot}`)?.focus();
        });
      } else if (!completed) {
        announce('Capture cancelled');
      }
    },
  });
  const { cancel: cancelSession } = session;

  // Bumping the key remounts the Webcam, which re-runs getUserMedia.
  // Cancelling any in-flight session first keeps the dying capture loop from
  // hitting a not-yet-ready camera on the fresh mount.
  const retryCamera = () => {
    cancelSession();
    setCameraRetryKey((key) => key + 1);
    setHasCameraError(false);
  };

  // A camera dying mid-session (unplug / OS revocation) ends the loop —
  // otherwise it would silently burn through the remaining shots.
  useEffect(() => {
    if (hasCameraError) {
      cancelSession();
    }
  }, [hasCameraError, cancelSession]);

  const handleStartCapture = () => {
    // Priming inside the click gesture satisfies the autoplay policy, so the
    // countdown beeps that follow in timers are allowed to sound.
    audio.prime();
    posePrompt.restart();
    session.start({
      countdownSeconds: COUNTDOWN_SECONDS[timer.countdown],
      gapMs: GAP_MS[timer.gap],
      shots: retakeSlot === null ? totalPhotos : 1,
    });
  };

  const handleRetakeSlot = (index: number) => {
    // isRevealDone (not isDeveloping) closes the 1.5s window between the
    // eject and the develop timer, where a mid-animation retake would leave
    // the reveal chain running behind the viewfinder. True immediately under
    // reduced motion and after any completed reveal, so retakes still work.
    if (isPrinting || !isRevealDone) return;
    retakeSlotRef.current = index;
    setRetakeSlot(index);
    announce(`Retaking photo ${index + 1}`);
  };

  // Focus the shutter once the retake viewfinder has mounted.
  useEffect(() => {
    if (retakeSlot !== null) {
      document.getElementById('booth-shutter')?.focus();
    }
  }, [retakeSlot]);

  const resetBooth = () => {
    setCapturedPhotos([]);
    setIsDownloadError(false);
    setRetakeSlot(null);
    retakeSlotRef.current = null;
    // Re-arm the print + develop sequence for the next set (effects run post-paint).
    setIsPrinting(true);
    setIsDeveloping(false);
    setRevealDone(false);
  };

  // Eject the strip PRINT_EJECT_DELAY_MS after the result view appears.
  // Keyed on isSetComplete (not mount): the booth stays mounted across
  // viewfinder/result switches, so a mount-only effect would fire too early.
  // isPrinting is armed true by the initial state and by resetBooth, so every
  // completed set starts hidden and this timer alone triggers the eject.
  useEffect(() => {
    if (!isSetComplete) return undefined;
    const ejectTimer = setTimeout(() => {
      setIsPrinting(false);
      playCue('print');
      // Under reduced motion the reveal is instant, so "ready" is true now;
      // otherwise the usable set only exists once the develop-in finishes
      // (announced there), keeping the status honest while actions are locked.
      announce(prefersReducedMotion ? 'Your photo set is ready' : 'Your photo set is printing');
    }, PRINT_EJECT_DELAY_MS);
    return () => clearTimeout(ejectTimer);
  }, [isSetComplete, playCue, announce, prefersReducedMotion]);

  // Move focus to the result heading when the eject fires. Ref-guarded so a
  // retake completing (isPrinting already false) never steals focus back.
  useEffect(() => {
    if (wasPrintingRef.current && !isPrinting && retakeSlotRef.current === null) {
      headingRef.current?.focus();
    }
    wasPrintingRef.current = isPrinting;
  }, [isPrinting]);

  // Begin the per-tile develop-in stagger once the eject transform has
  // finished. A timer, not transitionend: motion-reduce:transition-none on
  // the eject means no event would fire under reduced motion (and this
  // effect is skipped there anyway).
  useEffect(() => {
    if (isPrinting || prefersReducedMotion) return undefined;
    const timer = setTimeout(() => setIsDeveloping(true), EJECT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isPrinting, prefersReducedMotion]);

  // Once the last tile finishes developing, end the reveal stage and unlock
  // Share/Download (belt and braces: the keyframe's `to` state also equals
  // the img's natural styles, so a capture after this point is always clean).
  useEffect(() => {
    if (!isDeveloping) return undefined;
    const total = (capturedPhotos.length - 1) * TILE_STAGGER_MS + TILE_DEVELOP_MS;
    const timer = setTimeout(() => {
      setIsDeveloping(false);
      setRevealDone(true);
      announce('Your photo set is ready');
    }, total);
    return () => clearTimeout(timer);
  }, [isDeveloping, capturedPhotos.length, announce]);

  // Auto-clear the share status line after a beat.
  useEffect(() => {
    if (shareStatus === 'idle') return undefined;
    const clearTimer = setTimeout(() => setShareStatus('idle'), SHARE_STATUS_CLEAR_MS);
    return () => clearTimeout(clearTimer);
  }, [shareStatus]);

  // Auto-frame tint: re-derived whenever the set changes (including after a
  // single-photo retake); white until it resolves or if sampling fails. No
  // empty-set reset needed — the tint is only rendered when a set exists,
  // and the next set's derivation replaces any stale value.
  useEffect(() => {
    if (capturedPhotos.length === 0) return undefined;
    let isCancelled = false;
    void derivePhotoTint(capturedPhotos).then((tint) => {
      if (!isCancelled) {
        setAutoTint(tint);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [capturedPhotos]);

  /** Renders the printed card exactly as it downloads (no capture UI). */
  const renderStripDataUrl = async (mimeType: 'image/jpeg' | 'image/png'): Promise<string> => {
    const node = previewRef.current;
    if (!node) throw new Error('Preview not ready');
    const options = {
      quality: 0.95,
      // Deckle's torn clip-path leaves transparent area outside the card;
      // against the dark fill the edge reads as a torn print.
      backgroundColor: activeFrame === 'deckle' ? DECKLE_DOWNLOAD_BG : '#ffffff',
      // Retake hit buttons are capture-UI, never print-UI.
      filter: (element: HTMLElement) =>
        !(element instanceof HTMLElement && element.dataset.photoHit === 'true'),
    };
    return mimeType === 'image/jpeg' ? toJpeg(node, options) : toPng(node, options);
  };

  const handleDownload = async () => {
    // Blur first so a keyboard focus ring never bakes into the JPEG.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      setIsDownloadError(false);
      const dataUrl = await renderStripDataUrl('image/jpeg');
      const link = document.createElement('a');
      link.download = DOWNLOAD_FILENAME;
      link.href = dataUrl;
      link.click();
    } catch {
      setIsDownloadError(true);
    }
  };

  const handleShare = async () => {
    try {
      // Native share sheet (mobile) with the strip as an image file.
      const dataUrl = await renderStripDataUrl('image/jpeg');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], DOWNLOAD_FILENAME, { type: 'image/jpeg' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Virtual Photo Booth', text: 'My photo strip!' });
        setShareStatus('shared');
        announce('Strip shared');
        return;
      }
      // Desktop fallback: copy a PNG to the clipboard for pasting anywhere.
      const pngDataUrl = await renderStripDataUrl('image/png');
      const pngBlob = await (await fetch(pngDataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      setShareStatus('copied');
      announce('Copied to clipboard');
    } catch (error) {
      // Closing the share sheet is a cancel, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus('error');
      announce('Sharing failed');
    }
  };

  useKeyboardShortcuts(
    {
      phase: isResultView ? 'result' : 'viewfinder',
      isSessionActive: session.isActive,
      isRetakePending: retakeSlot !== null,
      isCameraReady,
      hasCameraError,
      isPrinting,
      isRevealing: !isPrinting && !isRevealDone,
    },
    {
      onStartCapture: handleStartCapture,
      onExit,
      onRetakeAll: resetBooth,
      onCancelPending: cancelSession,
    },
  );

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-b from-[#1C1B1A] via-[#141312] to-black flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative isolate">
      {/* Soft top glow for depth on the charcoal backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]"
      />
      {/* Exit back to the landing page */}
      <button
        type="button"
        onClick={onExit}
        aria-label="Back to start"
        className="absolute top-4 left-4 z-40 text-white/70 hover:text-white p-2 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Screen-reader announcements for capture events */}
      <div aria-live="polite" role="status" className="sr-only">
        {announcer.message}
      </div>

      {isResultView ? (
        <ResultView
          photos={capturedPhotos}
          layout={layout}
          filterClassName={filterClassName}
          activeFilter={activeFilter}
          activeFrame={activeFrame}
          surfaceColor={activeFrame === 'auto' ? autoTint ?? undefined : undefined}
          caption={activeCaption}
          isCaptionEnabled={isCaptionEnabled}
          captionText={captionText}
          onCaptionEnabledChange={setIsCaptionEnabled}
          onCaptionTextChange={setCaptionText}
          photoFit={photoFit}
          onPhotoFitChange={setPhotoFit}
          isPrinting={isPrinting}
          isDeveloping={isDeveloping}
          // Locked from the eject start until the last tile lands, so the
          // download/share capture never samples a mid-animation card.
          isRevealing={!isPrinting && !isRevealDone}
          isDownloadError={isDownloadError}
          shareStatus={shareStatus}
          previewRef={previewRef}
          headingRef={headingRef}
          onFilterChange={setActiveFilter}
          onFrameChange={setActiveFrame}
          onRetakeSlot={handleRetakeSlot}
          onRetakeAll={resetBooth}
          onShare={handleShare}
          onDownload={handleDownload}
        />
      ) : (
        <Viewfinder
          webcamRef={webcamRef}
          cameraRetryKey={cameraRetryKey}
          facingMode={facingMode}
          layout={layout}
          photos={capturedPhotos}
          totalPhotos={totalPhotos}
          countdown={session.countdown}
          shotNumber={session.shotNumber}
          pose={posePrompt.pose}
          flashKey={flashKey}
          hasCameraError={hasCameraError}
          isCameraReady={isCameraReady}
          isSessionActive={session.isActive}
          onUserMedia={(stream) => {
            setHasCameraError(false);
            // Surface unplug / OS revocation mid-stream — request failures
            // reach onUserMediaError, but react-webcam has no track listener.
            stream.getVideoTracks().forEach((track) => {
              track.onended = () => setHasCameraError(true);
            });
          }}
          onUserMediaError={() => setHasCameraError(true)}
          onRetryCamera={retryCamera}
          onFlipCamera={handleFlipCamera}
          onLayoutChange={setLayout}
          onStartCapture={handleStartCapture}
          timer={timer}
          onCountdownChange={handleCountdownChange}
          onGapChange={handleGapChange}
          isMuted={audio.isMuted}
          onToggleMuted={audio.toggleMuted}
        />
      )}
    </div>
  );
};
