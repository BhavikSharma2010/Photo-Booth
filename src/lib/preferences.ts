import { isCaptureGapChoice, isCountdownChoice, type TimerSettings } from '../types/timerSettings';

/**
 * Device-level booth preferences (timer, mute, caption), persisted to
 * localStorage. Creative choices (filter, frame) are deliberately NOT
 * persisted — those are per-set decisions, and defaulting to last-used would
 * surprise.
 *
 * Every failure path (private mode, quota, corrupt JSON) falls back to the
 * defaults; persistence is polish, never a failure path.
 */

const STORAGE_KEY = 'photobooth:settings';

/** Hard cap for the printed strip's caption text. */
export const MAX_CAPTION_LENGTH = 40;

export interface BoothPreferences extends TimerSettings {
  isMuted: boolean;
  /** Opt-in caption + date line printed on the strip. */
  isCaptionEnabled: boolean;
  captionText: string;
}

export const DEFAULT_PREFERENCES: BoothPreferences = {
  countdown: '3s',
  gap: '1.5s',
  isMuted: false,
  isCaptionEnabled: false,
  captionText: 'Virtual Photo Booth',
};

export const loadPreferences = (): BoothPreferences => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFERENCES;
    const record = parsed as Record<string, unknown>;
    return {
      countdown: isCountdownChoice(record.countdown) ? record.countdown : DEFAULT_PREFERENCES.countdown,
      gap: isCaptureGapChoice(record.gap) ? record.gap : DEFAULT_PREFERENCES.gap,
      isMuted: typeof record.isMuted === 'boolean' ? record.isMuted : DEFAULT_PREFERENCES.isMuted,
      isCaptionEnabled:
        typeof record.isCaptionEnabled === 'boolean'
          ? record.isCaptionEnabled
          : DEFAULT_PREFERENCES.isCaptionEnabled,
      captionText:
        typeof record.captionText === 'string' && record.captionText.trim().length > 0
          ? record.captionText.trim().slice(0, MAX_CAPTION_LENGTH)
          : DEFAULT_PREFERENCES.captionText,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const savePreferences = (preferences: BoothPreferences): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* Private mode / quota exceeded — preferences simply don't persist. */
  }
};
