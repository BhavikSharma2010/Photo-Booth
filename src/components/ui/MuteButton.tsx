/**
 * MuteButton - Speaker toggle for the booth's synthesized cues.
 */
interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const MuteButton = ({ isMuted, onToggle }: MuteButtonProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={isMuted}
    aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
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
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      {isMuted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  </button>
);
