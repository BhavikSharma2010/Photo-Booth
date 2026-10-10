import { useEffect, useRef, useState } from 'react';
import type { CaptureGapChoice, CountdownChoice } from '../../types/timerSettings';
import { COUNTDOWN_CHOICES, GAP_CHOICES } from '../../types/timerSettings';
import { PillSelectGroup } from './PillSelectGroup';

/**
 * TimerSettings - Popover for choosing the "get ready" countdown and the gap
 * between photos (including instant burst). The panel stays open across
 * selections, closes on outside pointerdown or its own Esc (stopPropagation
 * keeps the booth's global Esc chain out), and hands focus back to the
 * button on close.
 */
interface TimerSettingsProps {
  countdown: CountdownChoice;
  gap: CaptureGapChoice;
  onCountdownChange: (countdown: CountdownChoice) => void;
  onGapChange: (gap: CaptureGapChoice) => void;
  /** True while a capture session runs — settings can't change mid-session. */
  disabled?: boolean;
}

export const TimerSettings = ({
  countdown,
  gap,
  onCountdownChange,
  onGapChange,
  disabled = false,
}: TimerSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when a pointer lands outside the popover.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      // Wait a frame so the freshly mounted panel is focusable.
      requestAnimationFrame(() => panelRef.current?.focus());
    } else {
      buttonRef.current?.focus();
    }
  };

  // The booth's global Esc handler ignores events from inside the panel —
  // this one just closes the popover.
  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Timer settings"
        title="Timer settings"
        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Timer settings"
          onKeyDown={handlePanelKeyDown}
          className="absolute bottom-full right-0 mb-2 w-56 rounded-2xl bg-zinc-900/95 backdrop-blur-md border border-white/15 p-3 flex flex-col gap-3 z-40 max-h-[60dvh] overflow-y-auto focus:outline-none"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">
              Get ready
            </p>
            <PillSelectGroup
              size="sm"
              className="justify-start"
              label="Get ready countdown"
              options={COUNTDOWN_CHOICES}
              value={countdown}
              onChange={onCountdownChange}
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 px-1">
              Between photos
            </p>
            <PillSelectGroup
              size="sm"
              className="justify-start"
              label="Time between photos"
              options={GAP_CHOICES}
              value={gap}
              onChange={onGapChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};
