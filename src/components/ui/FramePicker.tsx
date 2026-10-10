import type { FrameStyle } from '../../types/photoFrame';
import { FRAME_OPTIONS } from '../../types/photoFrame';
import { PillSelectGroup } from './PillSelectGroup';

interface FramePickerProps {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
}

/** Frame pill row for the result view (rendered outside the download target). */
export const FramePicker = ({ value, onChange }: FramePickerProps) => (
  <PillSelectGroup
    label="Frame style"
    options={FRAME_OPTIONS}
    value={value}
    onChange={onChange}
    scrollable
  />
);
