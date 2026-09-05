import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { toJpeg } from 'html-to-image';
import type { PhotoLayout } from '../types/photoLayout';
import { FILTER_CLASSES, FILTER_OPTIONS, type PhotoFilter } from '../types/photoFilter';
import { LayoutFormatToggle } from './ui/LayoutFormatToggle';
import { PhotoBoothPreview } from './PhotoBoothPreview';

/** Seconds shown on the countdown overlay before the first capture. */
const CAPTURE_COUNTDOWN_SECONDS = 3;

/** How long each countdown number stays on screen. */
const COUNTDOWN_TICK_MS = 1000;

/** Pause between consecutive shots in an auto-capture session. */
const CAPTURE_GAP_MS = 1500;

/** How long the result view shows the empty printer slot before the strip ejects. */
const PRINT_EJECT_DELAY_MS = 2000;

/** Photos required per layout format — derived from the PhotoLayout type. */
const PHOTOS_PER_LAYOUT: Record<PhotoLayout, number> = {
  'strip-3': 3,
  'grid-4': 4,
};

/** Filename for the downloaded photo strip. */
const DOWNLOAD_FILENAME = 'virtual-photobooth.jpg';

/** Physical cue sounds, served from public/sounds/. */
const SOUND_BEEP = '/sounds/beep.mp3';
const SOUND_SHUTTER = '/sounds/shutter.mp3';
const SOUND_PRINT = '/sounds/print.mp3';

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Flips a captured frame horizontally so front-camera photos match the
 * mirrored live preview the user framed the shot with. Falls back to the
 * original frame if decoding fails — keeping the shot beats losing it.
 */
const mirrorScreenshot = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

/**
 * Creates one HTMLAudioElement per component mount and starts preloading its
 * asset. Cue files live in public/sounds/ and may not exist yet; a missing
 * asset simply fails to load and playCue swallows the rejection, so the booth
 * stays silent-but-stable until real files are dropped in.
 */
const useAudioCue = (src: string) => {
  const soundRef = useRef<HTMLAudioElement | null>(null);
  // Created post-mount, not during render: the earliest cue is a user click,
  // long after this effect runs, so preloading is never late.
  useEffect(() => {
    const sound = new Audio(src);
    soundRef.current = sound;
    // Stop a playing cue when the booth unmounts (e.g. exit mid-print).
    return () => {
      sound.pause();
      soundRef.current = null;
    };
  }, [src]);
  return soundRef;
};

/**
 * Plays a preloaded cue from the top. Restarts cleanly on rapid retriggers
 * and silently ignores autoplay restrictions, missing assets, and engines
 * that throw synchronously — audio is polish, never a failure path.
 */
const playCue = (sound: HTMLAudioElement | null) => {
  if (!sound) return;
  try {
    // Rewind first so retriggers restart instead of overlapping.
    sound.currentTime = 0;
    void sound.play().catch(() => {
      /* Autoplay policy or missing/unloadable asset — staying silent is correct. */
    });
  } catch {
    /* Defensive: some engines throw synchronously from the media API. */
  }
};

interface CameraBoothProps {
  onExit: () => void;
}

export const CameraBooth = ({ onExit }: CameraBoothProps) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [layout, setLayout] = useState<PhotoLayout>('strip-3');
  const [isDownloadError, setIsDownloadError] = useState(false);
  const [isCaptureSessionActive, setIsCaptureSessionActive] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<PhotoFilter>('none');
  const [isPrinting, setIsPrinting] = useState(true);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);

  const webcamRef = useRef<Webcam>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  // One preloaded Audio per cue, created once on mount.
  const beepSound = useAudioCue(SOUND_BEEP);
  const shutterSound = useAudioCue(SOUND_SHUTTER);
  const printSound = useAudioCue(SOUND_PRINT);

  // Stop an in-flight capture session if the booth unmounts mid-run.
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const isSetComplete = capturedPhotos.length === PHOTOS_PER_LAYOUT[layout];
  const filterClassName = FILTER_CLASSES[activeFilter];

  // Eject the strip PRINT_EJECT_DELAY_MS after the result view appears.
  // Keyed on isSetComplete (not mount): the booth stays mounted across
  // viewfinder/result switches, so a mount-only effect would fire too early.
  // isPrinting is armed true by the initial state and by resetBooth, so every
  // completed set starts hidden and this timer alone triggers the eject.
  useEffect(() => {
    if (!isSetComplete) return undefined;
    const timer = setTimeout(() => {
      // The eject slide starts on this flip — cue the printer sound with it.
      setIsPrinting(false);
      playCue(printSound.current);
    }, PRINT_EJECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isSetComplete, printSound]);

  const handleFlipCamera = () => {
    setFacingMode((mode) => (mode === 'user' ? 'environment' : 'user'));
  };

  // Bumping the key remounts the Webcam, which re-runs getUserMedia.
  // Aborting any in-flight session first keeps the dying capture loop from
  // hitting a not-yet-ready camera on the fresh mount.
  const retryCamera = () => {
    cancelRef.current = true;
    setCameraRetryKey((key) => key + 1);
    setHasCameraError(false);
  };

  const resetBooth = () => {
    setCapturedPhotos([]);
    setIsDownloadError(false);
    // Re-arm the print animation for the next set (effect runs post-paint).
    setIsPrinting(true);
  };

  const capturePhoto = async (): Promise<string | null> => {
    playCue(shutterSound.current);
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) return null;
    // Front-camera frames are flipped so the stored photo matches the
    // mirrored preview the user framed the shot with.
    return facingMode === 'user' ? mirrorScreenshot(screenshot) : screenshot;
  };

  /**
   * One click runs the whole session: 3-2-1 countdown, then a photo every
   * CAPTURE_GAP_MS until the set for the current layout is complete.
   */
  const startCapture = async () => {
    if (isCaptureSessionActive) return;

    const target = PHOTOS_PER_LAYOUT[layout];
    cancelRef.current = false;
    setIsCaptureSessionActive(true);

    try {
      for (let remaining = CAPTURE_COUNTDOWN_SECONDS; remaining > 0; remaining -= 1) {
        setCountdown(remaining);
        playCue(beepSound.current);
        await sleep(COUNTDOWN_TICK_MS);
        if (cancelRef.current) return;
      }
      setCountdown(null);

      for (let index = 0; index < target; index += 1) {
        if (index > 0) {
          await sleep(CAPTURE_GAP_MS);
          if (cancelRef.current) return;
        }
        const photo = await capturePhoto();
        if (cancelRef.current) return;
        if (photo) {
          // Capped at the target so a camera hiccup can never overflow the set.
          setCapturedPhotos((photos) =>
            photos.length < target ? [...photos, photo] : photos,
          );
          setFlashKey((key) => key + 1);
        }
      }
    } finally {
      setIsCaptureSessionActive(false);
      setCountdown(null);
    }
  };

  const handleDownload = async () => {
    const node = previewRef.current;
    if (!node) return;

    try {
      setIsDownloadError(false);
      const dataUrl = await toJpeg(node, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = DOWNLOAD_FILENAME;
      link.href = dataUrl;
      link.click();
    } catch {
      setIsDownloadError(true);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-b from-[#33291d] via-[#171411] to-black flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Exit back to the landing page */}
      <button
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

      {isSetComplete ? (
        /* Result & Download view */
        <div className="w-full max-w-md max-h-full overflow-y-auto flex flex-col items-center justify-center gap-8">
          {/* Printer slot: the card ejects downward out of it; overflow-hidden clips
              the card above the lip while printing (no top padding, so -translate-y-full
              hides exactly at the clip edge). Chrome stays outside the download target. */}
          <div className="relative z-10 w-full flex justify-center px-6 pb-6 overflow-hidden bg-zinc-900 border-t border-zinc-700/50">
            <div
              className={`w-full max-w-xs transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] motion-reduce:transition-none ${
                isPrinting ? '-translate-y-full' : 'translate-y-0'
              }`}
            >
              {/* Download target: the preview card */}
              <div ref={previewRef} className="w-full">
                <PhotoBoothPreview
                  photos={capturedPhotos}
                  layout={layout}
                  filterClassName={filterClassName}
                />
              </div>
            </div>
          </div>

          {/* Filter selection (outside previewRef so it is never baked into the download) */}
          <div
            role="group"
            aria-label="Photo filter"
            className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6 w-full px-4"
          >
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                aria-pressed={activeFilter === value}
                className={`text-sm sm:text-base px-5 py-2 sm:px-6 sm:py-2.5 rounded-full transition-colors ${
                  activeFilter === value
                    ? 'bg-white text-zinc-950 font-medium'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Final controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={resetBooth}
              disabled={isPrinting}
              className="bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-full font-medium transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
            >
              Retake
            </button>
            <button
              onClick={handleDownload}
              disabled={isPrinting}
              className="bg-white text-zinc-950 font-medium px-8 py-3 rounded-full hover:bg-zinc-200 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              Download
            </button>
          </div>

          {isDownloadError && (
            <p className="text-red-400 text-sm">Download failed — please try again.</p>
          )}
        </div>
      ) : (
        /* Viewfinder */
        <div className="relative w-full max-w-md h-[75dvh] max-h-[800px] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
          <Webcam
            key={cameraRetryKey}
            audio={false}
            screenshotFormat="image/jpeg"
            ref={webcamRef}
            videoConstraints={{ facingMode }}
            mirrored={facingMode === 'user'}
            onUserMedia={(stream) => {
              setHasCameraError(false);
              // Surface unplug / OS revocation mid-stream — request failures
              // reach onUserMediaError, but react-webcam has no track listener.
              stream.getVideoTracks().forEach((track) => {
                track.onended = () => setHasCameraError(true);
              });
            }}
            onUserMediaError={() => setHasCameraError(true)}
            className="w-full h-full object-cover"
          />

          {/* Camera-flash pulse on each shot */}
          {flashKey > 0 && (
            <div
              key={flashKey}
              className="capture-flash absolute inset-0 bg-white pointer-events-none z-20"
            />
          )}

          {/* Live rail: captured thumbs + remaining slots */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {capturedPhotos.map((photoUrl, index) => (
              <img
                key={index}
                src={photoUrl}
                alt={`Captured photo ${index + 1}`}
                className="w-12 h-9 rounded object-cover border border-white/40"
              />
            ))}
            {Array.from(
              { length: PHOTOS_PER_LAYOUT[layout] - capturedPhotos.length },
              (_, slot) => (
                <div
                  key={`slot-${slot}`}
                  className="w-12 h-9 rounded border-2 border-dashed border-white/30"
                />
              ),
            )}
          </div>

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-8xl md:text-9xl font-bold bg-black/40 backdrop-blur-sm z-20">
              {countdown}
            </div>
          )}

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
                Your photos never leave your device. Allow camera access in your
                browser, then try again.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={retryCamera}
                  className="bg-white text-zinc-950 font-medium px-8 py-3 rounded-full hover:bg-zinc-200 transition-colors w-full sm:w-auto"
                >
                  Try again
                </button>
                <button
                  onClick={handleFlipCamera}
                  className="bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-full font-medium transition-colors w-full sm:w-auto"
                >
                  Switch camera
                </button>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-3 grid grid-cols-3 items-center z-30">
            {/* Column 1: Layout toggle (3-photo strip / 4-photo grid) */}
            <div className="flex justify-start items-center">
              <LayoutFormatToggle currentLayout={layout} onLayoutChange={setLayout} />
            </div>

            {/* Column 2: Shutter — one click captures the whole set */}
            <div className="flex justify-center">
              <button
                onClick={startCapture}
                disabled={isCaptureSessionActive || hasCameraError}
                aria-label={`Take photo ${Math.min(capturedPhotos.length + 1, PHOTOS_PER_LAYOUT[layout])} of ${PHOTOS_PER_LAYOUT[layout]}`}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform mx-auto"
              />
            </div>

            {/* Column 3: Flip camera */}
            <div className="flex justify-end">
              <button
                onClick={handleFlipCamera}
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
      )}
    </div>
  );
};
