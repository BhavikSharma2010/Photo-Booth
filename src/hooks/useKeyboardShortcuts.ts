import { useEffect } from 'react';

export interface ShortcutState {
  phase: 'viewfinder' | 'result';
  isSessionActive: boolean;
  /** A single-photo retake is armed but maybe not started yet. */
  isRetakePending: boolean;
  isCameraReady: boolean;
  hasCameraError: boolean;
  isPrinting: boolean;
  /** Eject/develop reveal still running — matches the Retake button's lock. */
  isRevealing: boolean;
}

export interface ShortcutHandlers {
  onStartCapture: () => void;
  /** Esc chain: active session/retake → cancel; otherwise exit the booth. */
  onExit: () => void;
  onRetakeAll: () => void;
  /** Cancels whatever capture is pending; the session's onFinished handles cleanup. */
  onCancelPending: () => void;
}

/**
 * Booth keyboard shortcuts: Space/Enter starts a capture (viewfinder),
 * R retakes the whole set (result), Esc cancels a pending capture or exits.
 * Guards: never fires inside form fields, never with modifier keys held
 * (Ctrl+R stays a reload), and Space/Enter is skipped when a button has
 * focus so the native click doesn't double-fire.
 */
export const useKeyboardShortcuts = (state: ShortcutState, handlers: ShortcutHandlers): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target;
      let isButtonLike = false;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
        isButtonLike = tagName === 'BUTTON' || target.getAttribute('role') === 'button';
      }

      if (event.key === 'Escape') {
        if (state.isSessionActive || state.isRetakePending) {
          handlers.onCancelPending();
          return;
        }
        handlers.onExit();
        return;
      }

      if (state.phase === 'result') {
        if ((event.key === 'r' || event.key === 'R') && !state.isPrinting && !state.isRevealing) {
          handlers.onRetakeAll();
        }
        return;
      }

      // Viewfinder: Space/Enter starts the capture (unless a button owns it).
      if ((event.key === ' ' || event.key === 'Enter') && !isButtonLike) {
        if (!state.isSessionActive && state.isCameraReady && !state.hasCameraError) {
          event.preventDefault();
          handlers.onStartCapture();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handlers]);
};
