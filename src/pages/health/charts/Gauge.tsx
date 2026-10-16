import { col } from '../../../data/healthSim';

/** Half-dial gauge 0–100. `risk` bands at 25/50/75; `anom` bands at 20/40/60 (anomaly index). */
export function Gauge({ value, mode, stale = false }: { value: number; mode: 'risk' | 'anom'; stale?: boolean }) {
  const cx = 130, cy = 120, r = 96;
  const P = (a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const A = (x: number) => Math.PI * (1 - x / 100);
  const segs: [number, number, string][] = mode === 'risk'
    ? [[0, 25, 'good'], [25, 50, 'med'], [50, 75, 'high'], [75, 100, 'crit']]
    : [[0, 20, 'good'], [20, 40, 'med'], [40, 60, 'high'], [60, 100, 'crit']];
  return (
    <svg viewBox="0 0 260 150" role="img" aria-label={`${mode === 'risk' ? 'Risk score' : 'Anomaly index'} ${stale ? 'unknown' : value} of 100`}>
      {segs.map(([a, b, k]) => {
        const [x0, y0] = P(A(a + 0.6)), [x1, y1] = P(A(b - 0.6));
        return <path key={k} d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} fill="none" stroke={stale ? 'var(--stale)' : col(k)} strokeWidth={16} opacity={stale ? 0.35 : 0.9} />;
      })}
      {!stale && (
        <>
          <line x1={cx} y1={cy} x2={cx + (r - 26) * Math.cos(A(value))} y2={cy - (r - 26) * Math.sin(A(value))} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={6} fill="var(--ink)" />
        </>
      )}
      <text x={cx} y={cy - 30} textAnchor="middle" fontFamily="var(--f-display)" fontSize={40} fontWeight={700} fill="var(--ink)">{stale ? '—' : value}</text>
      <text x={cx - r} y={cy + 20} textAnchor="middle" fontSize={11} fill="var(--muted)">0</text>
      <text x={cx + r} y={cy + 20} textAnchor="middle" fontSize={11} fill="var(--muted)">100</text>
    </svg>
  );
}
