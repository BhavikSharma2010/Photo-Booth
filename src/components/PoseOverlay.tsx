/**
 * PoseOverlay - Get-ready countdown numeral, pose prompt, and shot counter.
 * Purely visual garnish (aria-hidden); screen readers get the same beats via
 * the aria-live announcer instead.
 */
interface PoseOverlayProps {
  /** Seconds remaining on the get-ready countdown; null when not counting. */
  countdown: number | null;
  pose: string;
  /** 1-based shot being taken; null when idle. */
  shotNumber: number | null;
  totalShots: number;
}

export const PoseOverlay = ({ countdown, pose, shotNumber, totalShots }: PoseOverlayProps) => {
  const isVisible = countdown !== null || shotNumber !== null;
  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 pointer-events-none ${
        countdown !== null ? 'bg-black/40 backdrop-blur-sm' : ''
      }`}
    >
      {countdown !== null && (
        <div
          key={countdown}
          className="countdown-pulse text-white text-8xl md:text-9xl font-bold motion-reduce:animate-none"
        >
          {countdown}
        </div>
      )}
      <p
        key={pose}
        className="pose-swap text-white/90 text-xl md:text-2xl font-medium motion-reduce:animate-none"
      >
        {pose}
      </p>
      {shotNumber !== null && (
        <p className="text-white/80 text-sm font-medium tracking-wide uppercase bg-black/40 rounded-full px-3 py-1">
          Photo {shotNumber} of {totalShots}
        </p>
      )}
    </div>
  );
};
