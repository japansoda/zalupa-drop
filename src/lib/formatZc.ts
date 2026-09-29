/**
 * Formats ZalupaCoin (ZC / Залупакоины) amounts:
 * - Integer values: 1 250, 40, 10 000
 * - Fractional values (< 1 or with cents): 0,08, 0,20, 1,50, 1 250,75
 */
export function formatZc(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  const num = Number(value);
  if (Number.isInteger(num)) {
    return num.toLocaleString('ru-RU');
  }
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default formatZc;
