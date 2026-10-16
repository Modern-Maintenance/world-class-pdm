import { useRef, useState } from 'react';
import { fmt } from '../../../lib/format';
import { N, nice, tLabel, type Sensor } from '../../../data/healthSim';
import { Axes } from './Axes';

/** Predicted vs actual for one sensor, with the ±3σ expected band and a hover/drag readout. */
export function SensorChart({ s, alertIdx }: { s: Sensor; alertIdx: number }) {
  const [hi, setHi] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 520, H = 180, L = 50, R = 10, T = 8, B = 24, bw = 3 * s.noise;
  const lo = s.p.map((p) => p - bw), up = s.p.map((p) => p + bw);
  let mn = Math.min(...lo, ...s.a), mx = Math.max(...up, ...s.a);
  const pad = (mx - mn) * 0.08; mn -= pad; mx += pad;
  const x = (i: number) => L + (i * (W - L - R)) / (N - 1), y = (v: number) => T + (H - T - B) * (1 - (v - mn) / (mx - mn));
  const st = nice(mx - mn, 4), dec = st < 1 ? (st < 0.1 ? 2 : 1) : 0;
  const path = (arr: number[]) => 'M' + arr.map((v, i) => x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' L');
  const band = `M${lo.map((v, i) => x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' L')} L${up.map((_, i) => x(N - 1 - i).toFixed(1) + ' ' + y(up[N - 1 - i]).toFixed(1)).join(' L')} Z`;

  const move = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const xv = ((clientX - r.left) / r.width) * W;
    setHi(Math.max(0, Math.min(N - 1, Math.round(((xv - L) / (W - L - R)) * (N - 1)))));
  };
  const readout = hi === null
    ? `Latest: ${fmt(s.a[N - 1], s.dec)} ${s.unit} actual · ${fmt(s.p[N - 1], s.dec)} predicted`
    : (() => { const d = s.a[hi] - s.p[hi]; return `${tLabel(hi)} · Actual ${fmt(s.a[hi], s.dec)} · Predicted ${fmt(s.p[hi], s.dec)} ${s.unit} · Residual ${d >= 0 ? '+' : ''}${fmt(d, s.dec)} (${fmt(Math.abs(d) / s.noise, 1)}σ)`; })();

  return (
    <div className="schart">
      <div className="hd"><span><b>{s.name}</b> <span className="mono muted">{s.tag}</span></span><span className="muted num">{fmt(s.pct, 0)}% of score</span></div>
      <div className="ro">{readout}</div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${s.name}: actual versus predicted, 30 days`}
        onMouseMove={(e) => move(e.clientX)} onMouseLeave={() => setHi(null)} onTouchMove={(e) => move(e.touches[0].clientX)} onTouchEnd={() => setHi(null)}>
        <Axes W={W} H={H} L={L} R={R} T={T} B={B} mn={mn} mx={mx} dec={dec} />
        <path d={band} fill="var(--accent-soft)" opacity={0.85} />
        {alertIdx >= 0 && <line x1={x(alertIdx)} x2={x(alertIdx)} y1={T} y2={H - B} stroke="var(--crit)" strokeDasharray="2 3" strokeWidth={1.4} />}
        <path d={path(s.p)} fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="5 3" />
        <path d={path(s.a)} fill="none" stroke="var(--ink)" strokeWidth={1.4} opacity={0.85} />
        {s.a.map((v, i) => (Math.abs(v - s.p[i]) > bw ? <circle key={i} cx={x(i)} cy={y(v)} r={2} fill="var(--crit)" /> : null))}
        <circle cx={x(N - 1)} cy={y(s.a[N - 1])} r={3.5} fill="var(--ink)" />
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1={T} y2={H - B} stroke="var(--muted)" strokeWidth={1} opacity={0.8} />}
      </svg>
    </div>
  );
}
