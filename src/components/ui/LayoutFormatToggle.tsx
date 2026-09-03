import type { PhotoLayout } from '../../types/photoLayout';

/**
 * LayoutFormatToggle - Compact layout toggle buttons
 * Uses whitespace-nowrap to prevent text wrapping
 */
interface LayoutFormatToggleProps {
  currentLayout: PhotoLayout;
  onLayoutChange: (layout: PhotoLayout) => void;
}

export const LayoutFormatToggle = ({
  currentLayout,
  onLayoutChange,
}: LayoutFormatToggleProps) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onLayoutChange('strip-3')}
        className={`
          px-2 py-1 rounded transition-colors
          whitespace-nowrap
          text-xs sm:text-sm
          ${
            currentLayout === 'strip-3'
              ? 'bg-white/20 text-white font-medium'
              : 'text-zinc-400 hover:bg-white/10'
          }
        `}
      >
        3
      </button>
      <button
        onClick={() => onLayoutChange('grid-4')}
        className={`
          px-2 py-1 rounded transition-colors
          whitespace-nowrap
          text-xs sm:text-sm
          ${
            currentLayout === 'grid-4'
              ? 'bg-white/20 text-white font-medium'
              : 'text-zinc-400 hover:bg-white/10'
          }
        `}
      >
        4
      </button>
    </div>
  );
};
