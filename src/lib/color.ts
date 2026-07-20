/**
 * Equivalent to `color-mix(in srgb, hex X%, transparent)` but as a literal
 * rgba() string. html2canvas's CSS parser doesn't understand `color-mix()`
 * and throws when capturing an element that uses it, so anything that may
 * end up inside an html2canvas capture must use this instead.
 */
export function withAlpha(hex: string, alphaPercent: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alphaPercent / 100})`;
}
