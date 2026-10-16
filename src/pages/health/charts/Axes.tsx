import { fmt } from '../../../lib/format';
import { N, dLabel, nice } from '../../../data/healthSim';

/** Horizontal grid lines with value labels plus five date labels across the 30-day window. */
export function Axes({ W, H, L, R, T, B, mn, mx, dec }: { W: number; H: number; L: number; R: number; T: number; B: number; mn: number; mx: number; dec: number }) {
  const st = nice(mx - mn, 4), ticks: number[] = [];
  for (let v = Math.ceil(mn / st) * st; v <= mx; v += st) ticks.push(v);
  return (
    <>
      {ticks.map((v) => { const y = T + (H - T - B) * (1 - (v - mn) / (mx - mn)); return <g key={v}><line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--line)" /><text x={L - 6} y={y + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{fmt(v, dec)}</text></g>; })}
      {[0, 45, 90, 135, N - 1].map((i) => <text key={i} x={L + (i * (W - L - R)) / (N - 1)} y={H - 6} textAnchor={i === 0 ? 'start' : i === N - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--muted)">{dLabel(i)}</text>)}
    </>
  );
}
