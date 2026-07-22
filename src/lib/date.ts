const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-10-24" (input[type=date] value) → "2026年10月24日(土)" */
export function isoToJaDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return `${y}年${m}月${d}日(${WEEKDAYS_JA[date.getDay()]})`;
}

/** "2026年10月24日(土)" → "2026-10-24" (for input[type=date] value) */
export function jaDateToIso(text: string | null | undefined): string {
  if (!text) return "";
  const m = text.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
