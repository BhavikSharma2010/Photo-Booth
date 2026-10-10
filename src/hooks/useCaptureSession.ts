import { useCallback, useEffect, useRef, useState } from 'react';

/** How long each countdown number stays on screen. */
const COUNTDOWN_TICK_MS = 1000;

/**
 * Floor between 'instant'-mode shots: two shutter clicks/flashes stay
 * perceptibly distinct, and the async front-camera mirror (~40-120ms,
 * awaited inside onCapture) can never eat the whole gap.
 */
const MIN_SHOT_SETTLE_MS = 250;

export interface CaptureSessionOptions {
  /** "Get ready" seconds before the first shot (0 skips the countdown). */
  countdownSeconds: number;
  /** Pause between consecutive shots; <= 0 means instant-burst cadence. */
  gapMs: number;
  /** Number of shots this session targets (full set, or 1 for a retake). */
  shots: number;
}

export interface CaptureSessionCallbacks {
  /** Grabs one frame (webcam screenshot + mirror). Null = camera hiccup. */
  onCapture: () => Promise<string | null>;
  /** Fired once per countdown second remaining. */
  onCountdownTick: (secondsRemaining: number) => void;
  /** Fired after each successful capture. */
  onPhotoCaptured: (photo: string, shotIndex: number) => void;
  /** Session over; false means cancelled (or ended by unmount). */
  onFinished: (completed: boolean) => void;
}

export interface CaptureSessionApi {
  isActive: boolean;
  /** Seconds remaining on the "get ready" countdown; null when not counting. */
  countdown: number | null;
  /** 1-based index of the shot being (or just) taken; null when idle. */
  shotNumber: number | null;
  start: (options: CaptureSessionOptions) => void;
  cancel: () => void;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Two animation frames — guarantees the keyed flash overlay paints before
 *  the next instant shot remounts it. */
const doubleRaf = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const sleepGap = async (gapMs: number) => {
  if (gapMs > 0) {
    await sleep(gapMs);
    return;
  }
  await doubleRaf();
  await sleep(MIN_SHOT_SETTLE_MS);
};

/**
 * Countdown + shot-loop state machine for one capture session. Callbacks are
 * read through a ref, so the async loop always sees fresh closures without
 * ever restarting mid-run; start() snapshots its options, so settings edited
 * mid-session cannot tear it.
 */
export const useCaptureSession = (callbacks: CaptureSessionCallbacks): CaptureSessionApi => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotNumber, setShotNumber] = useState<number | null>(null);

  const callbacksRef = useRef(callbacks);
  const cancelRef = useRef(false);
  const isActiveRef = useRef(false);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Stop an in-flight session if the booth unmounts mid-run.
  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    [],
  );

  // Stable: closes only over refs and setState functions.
  const runSession = useCallback(async ({ countdownSeconds, gapMs, shots }: CaptureSessionOptions) => {
    try {
      for (let remaining = countdownSeconds; remaining > 0; remaining -= 1) {
        setCountdown(remaining);
        callbacksRef.current.onCountdownTick(remaining);
        await sleep(COUNTDOWN_TICK_MS);
        if (cancelRef.current) return;
      }
      setCountdown(null);

      for (let index = 0; index < shots; index += 1) {
        if (index > 0) {
          await sleepGap(gapMs);
          if (cancelRef.current) return;
        }
        setShotNumber(index + 1);
        const photo = await callbacksRef.current.onCapture();
        if (cancelRef.current) return;
        if (photo) {
          callbacksRef.current.onPhotoCaptured(photo, index);
        }
      }
    } finally {
      const completed = !cancelRef.current;
      isActiveRef.current = false;
      setIsActive(false);
      setCountdown(null);
      setShotNumber(null);
      callbacksRef.current.onFinished(completed);
    }
  }, []);

  const start = useCallback(
    (options: CaptureSessionOptions) => {
      if (isActiveRef.current) return;
      cancelRef.current = false;
      isActiveRef.current = true;
      setIsActive(true);
      void runSession(options);
    },
    [runSession],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { isActive, countdown, shotNumber, start, cancel };
};
