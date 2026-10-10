/**
 * Timer settings for a capture session, chosen in the viewfinder's timer
 * popover and persisted (see lib/preferences).
 *
 * - CountdownChoice: "get ready" seconds shown before the first shot.
 * - CaptureGapChoice: pause between consecutive shots; 'instant' fires the
 *   whole set as a rapid burst (INSTANT_GAP_MS in useCaptureSession).
 */
export type CountdownChoice = 'off' | '3s' | '5s' | '10s';
export type CaptureGapChoice = 'instant' | '1.5s' | '3s';

export interface TimerSettings {
  countdown: CountdownChoice;
  gap: CaptureGapChoice;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  countdown: '3s',
  gap: '1.5s',
};

/** Ordered options driving the countdown pill group. */
export const COUNTDOWN_CHOICES: ReadonlyArray<{ value: CountdownChoice; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: '3s', label: '3s' },
  { value: '5s', label: '5s' },
  { value: '10s', label: '10s' },
];

/** Ordered options driving the between-photos pill group. */
export const GAP_CHOICES: ReadonlyArray<{ value: CaptureGapChoice; label: string }> = [
  { value: 'instant', label: 'Instant' },
  { value: '1.5s', label: '1.5s' },
  { value: '3s', label: '3s' },
];

/** Seconds shown on the countdown overlay per choice ('off' skips it). */
export const COUNTDOWN_SECONDS: Record<CountdownChoice, number> = {
  off: 0,
  '3s': 3,
  '5s': 5,
  '10s': 10,
};

/**
 * Pause between consecutive shots per choice. 'instant' is resolved by
 * useCaptureSession (double-rAF + settle floor) — the placeholder value here
 * is only for whitelist validation in lib/preferences.
 */
export const GAP_MS: Record<CaptureGapChoice, number> = {
  instant: 0,
  '1.5s': 1500,
  '3s': 3000,
};

/** Type guard for preferences loaded from localStorage. */
export const isCountdownChoice = (value: unknown): value is CountdownChoice =>
  typeof value === 'string' && value in COUNTDOWN_SECONDS;

/** Type guard for preferences loaded from localStorage. */
export const isCaptureGapChoice = (value: unknown): value is CaptureGapChoice =>
  typeof value === 'string' && value in GAP_MS;
