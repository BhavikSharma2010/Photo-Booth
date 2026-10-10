import { useCallback, useState } from 'react';

export interface AnnouncerApi {
  /** Current message; render it inside one aria-live="polite" region. */
  message: string;
  announce: (text: string) => void;
}

/**
 * Screen-reader announcements for capture events (countdown, progress,
 * cancellations). Pose prompts stay visual-only — announcing them would be
 * noise. Limitation: identical consecutive strings don't re-announce;
 * acceptable since messages within a session always differ.
 */
export const useAnnouncer = (): AnnouncerApi => {
  const [message, setMessage] = useState('');
  const announce = useCallback((text: string) => {
    setMessage(text);
  }, []);
  return { message, announce };
};
