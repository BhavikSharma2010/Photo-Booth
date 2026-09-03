/**
 * CameraFlippingButton - Camera flip icon button
 * 44px minimum touch target for mobile
 */
interface CameraFlippingButtonProps {
  onClick: () => void;
}

export const CameraFlippingButton = ({ onClick }: CameraFlippingButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="
        text-zinc-400 hover:text-white
        transition-all duration-300
        active:rotate-180
        focus:outline-none
        min-w-[44px] min-h-[44px]
        flex items-center justify-center
        p-2
      "
      aria-label="Flip camera"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Camera body */}
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        {/* Lens */}
        <circle cx="12" cy="13" r="4" />
      </svg>
    </button>
  );
};
