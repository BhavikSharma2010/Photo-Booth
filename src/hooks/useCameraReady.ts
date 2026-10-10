import { useEffect, useState } from 'react';
import type Webcam from 'react-webcam';

/** Poll interval while waiting for the first decoded video frame. */
const READY_POLL_MS = 120;

/** Give up polling; the camera-error overlay then governs the viewfinder. */
const READY_TIMEOUT_MS = 4000;

/**
 * Camera warm-up detection. react-webcam's onUserMedia fires when the stream
 * attaches but before the first frame decodes, so gating on it alone would
 * still show a black frame — poll the video element until it has pixels.
 *
 * Readiness is recorded as the retryKey it was achieved for, so bumping the
 * key (Webcam remount) derives a fresh `false` without resetting state
 * inside the effect.
 */
export const useCameraReady = (
  webcamRef: React.RefObject<Webcam | null>,
  retryKey: number,
): boolean => {
  const [readyKey, setReadyKey] = useState<number | null>(null);
  const isReady = readyKey === retryKey;

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        setReadyKey(retryKey);
        clearInterval(interval);
        return;
      }
      if (Date.now() - startedAt > READY_TIMEOUT_MS) {
        clearInterval(interval);
      }
    }, READY_POLL_MS);
    return () => clearInterval(interval);
  }, [webcamRef, retryKey]);

  return isReady;
};
