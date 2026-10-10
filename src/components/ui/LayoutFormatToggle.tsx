import type { PhotoLayout } from '../../types/photoLayout';

/**
 * LayoutFormatToggle - Compact layout toggle buttons.
 * A labelled radio-style group (aria-pressed per button); disabled while a
 * capture session runs, since the in-flight loop targets the layout it
 * started with.
 */
interface LayoutFormatToggleProps {
  currentLayout: PhotoLayout;
  onLayoutChange: (layout: PhotoLayout) => void;
  disabled?: boolean;
}

interface LayoutOption {
  value: PhotoLayout;
  label: string;
  name: string;
}

const LAYOUT_OPTIONS: ReadonlyArray<LayoutOption> = [
  { value: 'strip-3', label: '3', name: '3-photo strip' },
  { value: 'grid-4', label: '4', name: '4-photo grid' },
];

export const LayoutFormatToggle = ({
  currentLayout,
  onLayoutChange,
  disabled = false,
}: LayoutFormatToggleProps) => {
  return (
    <div role="group" aria-label="Photo layout" className="flex items-center gap-1">
      {LAYOUT_OPTIONS.map(({ value, label, name }) => {
        const isSelected = currentLayout === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onLayoutChange(value)}
            disabled={disabled}
            aria-pressed={isSelected}
            title={name}
            className={`
              px-3 py-2 rounded transition-colors
              whitespace-nowrap
              text-xs sm:text-sm
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isSelected
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-zinc-400 hover:bg-white/10'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
