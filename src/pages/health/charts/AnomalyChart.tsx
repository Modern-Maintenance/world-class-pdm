import { fmt } from '../../../lib/format';
import { ALERT, N, WATCH, type Model } from '../../../data/healthSim';
import { Axes } from './Axes';

/** Smoothed anomaly score over 30 days with watch and alert bands. */
export function AnomalyChart({ m }: { m: Model }) {
  const W = 1100, H = 170, L = 40, R = 12, T = 10, B = 24, v = m.sm;
  const mx = Math.max(2, Math.ceil(Math.max(...v) * 1.15 * 2) / 2), mn = 0;
  const x = (i: number) => L + (i * (W - L - R)) / (N - 1), y = (q: number) => T + (H - T - B) * (1 - (q - mn) / (mx - mn));
  const d = v.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q).toFixed(1)).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Anomaly score over 30 days, latest ${fmt(m.score, 2)}`}>
      <Axes W={W} H={H} L={L} R={R} T={T} B={B} mn={mn} mx={mx} dec={1} />
      <rect x={L} y={y(mx)} width={W - L - R} height={y(ALERT) - y(mx)} fill="var(--crit-bg)" opacity={0.7} />
      <rect x={L} y={y(ALERT)} width={W - L - R} height={y(WATCH) - y(ALERT)} fill="var(--med-bg)" opacity={0.7} />
      <line x1={L} x2={W - R} y1={y(ALERT)} y2={y(ALERT)} stroke="var(--crit)" strokeDasharray="5 4" />
      <text x={W - R - 4} y={y(ALERT) - 5} textAnchor="end" fontSize={11} fill="var(--crit)">Alert {ALERT}</text>
      <line x1={L} x2={W - R} y1={y(WATCH)} y2={y(WATCH)} stroke="var(--med)" strokeDasharray="5 4" />
      <text x={W - R - 4} y={y(WATCH) + 14} textAnchor="end" fontSize={11} fill="var(--med-ink)">Watch {WATCH}</text>
      <path d={`${d} L${x(N - 1)} ${y(0)} L${x(0)} ${y(0)}Z`} fill="var(--accent-soft)" opacity={0.6} />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {m.alertIdx >= 0 && <line x1={x(m.alertIdx)} x2={x(m.alertIdx)} y1={T} y2={H - B} stroke="var(--crit)" strokeDasharray="2 3" />}
      <circle cx={x(N - 1)} cy={y(m.score)} r={4.5} fill="var(--accent)" />
      <text x={x(N - 1) - 8} y={y(m.score) - 8} textAnchor="end" fontSize={13} fontWeight={600} fill="var(--ink)">{fmt(m.score, 2)}</text>
    </svg>
  );
}
