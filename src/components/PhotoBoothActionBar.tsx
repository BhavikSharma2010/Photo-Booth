import type { PhotoLayout } from '../types/photoLayout';
import { CameraShutterButton } from './ui/CameraShutterButton';
import { CameraFlippingButton } from './ui/CameraFlippingButton';
import { LayoutFormatToggle } from './ui/LayoutFormatToggle';

/**
 * PhotoBoothActionBar - Frosted glass action bar using CSS Grid
 * Grid prevents squishing and ensures proper centering
 */
interface PhotoBoothActionBarProps {
  currentLayout: PhotoLayout;
  onLayoutChange: (layout: PhotoLayout) => void;
  onShutterClick: () => void;
  onFlipCamera: () => void;
}

export const PhotoBoothActionBar = ({
  currentLayout,
  onLayoutChange,
  onShutterClick,
  onFlipCamera,
}: PhotoBoothActionBarProps) => {
  return (
    <div className="cameraFloatingActionBar absolute bottom-6 left-1/2 -translate-x-1/2">
      <div
        className="
          w-[92%] max-w-sm
          bg-white/10 backdrop-blur-md
          border border-white/20 rounded-full
          px-3 py-3
          grid grid-cols-3 items-center
        "
      >
        {/* Column 1: Left - Layout toggles */}
        <div className="flex justify-start items-center">
          <LayoutFormatToggle
            currentLayout={currentLayout}
            onLayoutChange={onLayoutChange}
          />
        </div>

        {/* Column 2: Center - Shutter button */}
        <div className="flex justify-center">
          <CameraShutterButton onClick={onShutterClick} />
        </div>

        {/* Column 3: Right - Flip icon */}
        <div className="flex justify-end pr-2">
          <CameraFlippingButton onClick={onFlipCamera} />
        </div>
      </div>
    </div>
  );
};
