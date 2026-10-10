/**
 * Photo color sampling for the Auto frame — an Instagram-style background
 * tint derived from the captured photos. Each photo is decoded and drawn
 * into a tiny canvas (averaging needs only a handful of pixels), the RGB
 * average across the whole set is converted to HSL, and the result is
 * clamped into a soft pastel band so the card surface always stays light
 * and quiet behind the photos.
 *
 * Data URLs are same-origin, so the canvas is never tainted. Any decode or
 * read failure returns null and the caller keeps the plain white surface —
 * a missing tint is cosmetic, never a failure path.
 */

/** Canvas edge for sampling — small on purpose: we only need the average. */
const SAMPLE_SIZE = 16;

/** Pastel band the derived color is clamped into (HSL saturation/lightness). */
const MIN_SATURATION = 0.2;
const MAX_SATURATION = 0.4;
const MIN_LIGHTNESS = 0.9;
const MAX_LIGHTNESS = 0.95;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image decode failed'));
    image.src = src;
  });

const rgbToHsl = (red: number, green: number, blue: number): [number, number, number] => {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return [0, 0, lightness];
  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === red) {
    hue = ((green - blue) / delta + (green < blue ? 6 : 0)) / 6;
  } else if (max === green) {
    hue = ((blue - red) / delta + 2) / 6;
  } else {
    hue = ((red - green) / delta + 4) / 6;
  }
  return [hue, saturation, lightness];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Derive the pastel surface tint for a set of photos, or null on failure.
 */
export const derivePhotoTint = async (photos: string[]): Promise<string | null> => {
  if (photos.length === 0) return null;
  try {
    const images = await Promise.all(photos.map(loadImage));

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    let sampleCount = 0;
    for (const image of images) {
      // Squashing into a square is fine — we only want the average color.
      context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      for (let index = 0; index < data.length; index += 4) {
        totalRed += data[index];
        totalGreen += data[index + 1];
        totalBlue += data[index + 2];
        sampleCount += 1;
      }
    }
    if (sampleCount === 0) return null;

    const [hue, saturation, lightness] = rgbToHsl(
      totalRed / sampleCount / 255,
      totalGreen / sampleCount / 255,
      totalBlue / sampleCount / 255,
    );
    const pastelSaturation = clamp(saturation, MIN_SATURATION, MAX_SATURATION);
    const pastelLightness = clamp(lightness, MIN_LIGHTNESS, MAX_LIGHTNESS);
    return `hsl(${Math.round(hue * 360)} ${Math.round(pastelSaturation * 100)}% ${Math.round(
      pastelLightness * 100,
    )}%)`;
  } catch {
    return null;
  }
};
