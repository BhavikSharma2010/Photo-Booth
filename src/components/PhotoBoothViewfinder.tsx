/**
 * PhotoBoothViewfinder - Native mobile camera feel
 * Fixed height with max-height to prevent overflow on small screens
 */
interface PhotoBoothViewfinderProps {
  actionBar: React.ReactNode;
}

export const PhotoBoothViewfinder = ({ actionBar }: PhotoBoothViewfinderProps) => {
  return (
    <div
      className="
        videoFeedPlaceholder
        relative w-full max-w-md
        h-[75vh] max-h-[800px]
        bg-zinc-900 rounded-3xl
        flex items-center justify-center
        overflow-hidden
        shadow-xl
      "
    >
      {/* Placeholder content for video feed */}
      <div className="text-center p-6">
        {/* Camera icon placeholder */}
        <svg
          className="w-16 h-16 text-zinc-700 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-zinc-500 text-sm">Camera feed placeholder</p>
      </div>

      {/* Floating action bar */}
      {actionBar}
    </div>
  );
};
