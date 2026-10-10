import type { PhotoFilter } from '../../types/photoFilter';
import { FILTER_OPTIONS } from '../../types/photoFilter';
import { PillSelectGroup } from './PillSelectGroup';

interface FilterPickerProps {
  value: PhotoFilter;
  onChange: (value: PhotoFilter) => void;
}

/** Filter pill row for the result view (rendered outside the download target). */
export const FilterPicker = ({ value, onChange }: FilterPickerProps) => (
  <PillSelectGroup
    label="Photo filter"
    options={FILTER_OPTIONS}
    value={value}
    onChange={onChange}
    scrollable
  />
);
