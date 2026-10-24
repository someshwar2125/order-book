export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '-';
  let digits = 2;
  if (value < 1) digits = 6;
  else if (value < 100) digits = 4;
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Quantity with up to `digits` decimals (default 4), fixed width so columns line up. */
export function formatQty(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '-';
  return value.toFixed(digits);
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function prettySymbol(symbol: string): string {
  return symbol.endsWith('USDT') ? `${symbol.slice(0, -4)}/USDT` : symbol;
}
