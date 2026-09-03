/**
 * CameraShutterButton - The main circular shutter button
 * Responsive sizing: w-14 h-14 on mobile, w-16 h-16 on larger screens
 */
interface CameraShutterButtonProps {
  onClick: () => void;
}

export const CameraShutterButton = ({ onClick }: CameraShutterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="
        w-14 h-14 sm:w-16 sm:h-16
        rounded-full bg-white
        hover:scale-105 active:scale-95
        transition-transform duration-150 ease-out
        shadow-lg
        focus:outline-none focus:ring-2 focus:ring-white/50
      "
      aria-label="Take photo"
    >
      {/* Inner ring for depth */}
      <div className="w-full h-full rounded-full border-4 border-gray-100" />
    </button>
  );
};
