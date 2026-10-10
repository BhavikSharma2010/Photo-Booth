import type { PhotoFit } from '../../types/photoFit';
import { PHOTO_FIT_OPTIONS } from '../../types/photoFit';
import { PillSelectGroup } from './PillSelectGroup';

interface PhotoFitPickerProps {
  value: PhotoFit;
  onChange: (value: PhotoFit) => void;
}

/** Photo-fit pill row for the result view (rendered outside the download target). */
export const PhotoFitPicker = ({ value, onChange }: PhotoFitPickerProps) => (
  <PillSelectGroup
    label="Photo fit"
    options={PHOTO_FIT_OPTIONS}
    value={value}
    onChange={onChange}
  />
);
