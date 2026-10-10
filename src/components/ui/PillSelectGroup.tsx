/**
 * PillSelectGroup - Accessible single-select pill row.
 * Extracts the result view's original filter-pill pattern: role="group" with
 * a programmatic label and aria-pressed per option.
 */

/** sm for the timer popover, md for the result-view picker rows. */
type PillSize = 'sm' | 'md';

interface PillSelectGroupProps<T extends string> {
  /** Announced as the group's accessible name. */
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  size?: PillSize;
  className?: string;
  /**
   * Single-line horizontal scroller (no wrap, hidden scrollbar, edge fade)
   * instead of a wrapping row. Focused pills scroll into view natively.
   */
  scrollable?: boolean;
}

const SIZE_CLASSES: Record<PillSize, string> = {
  sm: 'text-xs sm:text-sm px-3 py-1.5',
  md: 'text-sm sm:text-base px-5 py-2 sm:px-6 sm:py-2.5',
};

export function PillSelectGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  size = 'md',
  className = 'justify-center',
  scrollable = false,
}: PillSelectGroupProps<T>) {
  // Scrollable rows ignore `className` centering: justify-center inside an
  // overflowing scroll container makes the leftmost content unreachable.
  const rowClasses = scrollable
    ? 'no-scrollbar scroll-fade-x flex w-full gap-2 overflow-x-auto'
    : `flex flex-wrap gap-2 ${className}`;
  return (
    <div role="group" aria-label={label} className={rowClasses}>
      {options.map(({ value: optionValue, label: optionLabel }) => {
        const isSelected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={isSelected}
            className={`${SIZE_CLASSES[size]} rounded-full transition-colors ${
              scrollable ? 'shrink-0 whitespace-nowrap ' : ''
            }${
              isSelected
                ? 'bg-white text-zinc-950 font-medium'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
