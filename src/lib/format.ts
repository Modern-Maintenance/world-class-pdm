export const pct = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) + '%' : '—');

/** $36.9M / $640k — portfolio style (1 decimal for millions). */
export const moneyShort = (v: number) =>
  v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'k' : '$' + v;

/** $1.85M / $640k — alert and asset views (2 decimals for millions). */
export const money = (v: number) => (v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : '$' + Math.round(v / 1e3) + 'k');

export const fmt = (v: number, d: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Hours, switching to days above 48 h. */
export const fmtH = (h: number) => (!Number.isFinite(h) ? '—' : h < 48 ? Math.round(h) + ' h' : (h / 24).toFixed(1) + ' d');
