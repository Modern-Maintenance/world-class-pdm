/** Building blocks shared by the machinery schematics. Colours come from each part's ML model, so the problem area stands out. */
import type { CSSProperties, ReactNode } from 'react';
import { fmt } from '../../../lib/format';
import { EQ, MODELS, N, band, col, eqHealth, sensorDev } from '../../../data/healthSim';

const STY: Record<string, [number, number]> = { good: [1.6, 0.1], med: [2.4, 0.3], high: [2.8, 0.42], crit: [3.2, 0.6], stale: [1.6, 0.06] };

/** Props for a casing/housing shape monitored by model `m` (or neutral grey when no model). */
export function shape(m?: string): { className: string; style: CSSProperties; children?: ReactNode } {
  const model = m ? MODELS[m] : undefined;
  if (!model) return { className: 'shape', style: { stroke: 'var(--neutral)', strokeWidth: 1.4, fill: 'var(--soft)', fillOpacity: 1 } };
  const k = model.stale ? 'stale' : band(model.health)[0];
  const [w, f] = STY[k];
  return {
    className: 'shape' + (k === 'crit' ? ' pulse' : ''),
    style: { stroke: col(k), strokeWidth: w, fill: col(k), fillOpacity: f, strokeDasharray: k === 'stale' ? '6 4' : undefined },
    children: <title>{`${model.name}: ${model.stale ? 'input stale' : model.health + ' · ' + band(model.health)[1]}`}</title>,
  };
}
/** Bearing pads take the solid model colour. */
export function padStyle(m?: string): { className: string; style: CSSProperties } {
  const model = m ? MODELS[m] : undefined;
  if (!model) return { className: 'pad', style: { fill: 'var(--ink)', fillOpacity: 0.6 } };
  const k = model.stale ? 'stale' : band(model.health)[0];
  return { className: 'pad' + (k === 'crit' ? ' pulse' : ''), style: { fill: col(k), fillOpacity: 1 } };
}

export const Rect = ({ m, ...r }: { m?: string; x: number; y: number; width: number; height: number; rx?: number }) => {
  const p = shape(m);
  return <rect className={p.className} style={p.style} {...r}>{p.children}</rect>;
};
export const Poly = ({ m, points }: { m?: string; points: string }) => {
  const p = shape(m);
  return <polygon className={p.className} style={p.style} points={points}>{p.children}</polygon>;
};
export const Circ = ({ m, cx, cy, r }: { m?: string; cx: number; cy: number; r: number }) => {
  const p = shape(m);
  return <circle className={p.className} style={p.style} cx={cx} cy={cy} r={r}>{p.children}</circle>;
};

export const Label = ({ x, y, text, halo = true, anchor = 'middle' }: { x: number; y: number; text: string; halo?: boolean; anchor?: 'start' | 'middle' | 'end' }) => (
  <text className={`slabel${halo ? ' halo' : ''}`} x={x} y={y} textAnchor={anchor}>{text}</text>
);

/** Pair of bearing pads either side of a shaft at height cy. */
export const Pads = ({ x, cy, m }: { x: number; cy: number; m?: string }) => {
  const p = padStyle(m);
  return <><rect {...p} x={x - 7} y={cy - 19} width={14} height={12} rx={1} /><rect {...p} x={x - 7} y={cy + 7} width={14} height={12} rx={1} /></>;
};
export const Bearing = ({ x, label, m }: { x: number; label: string; m?: string }) => (
  <><Pads x={x} cy={200} m={m} />{label && <Label x={x} y={238} text={label} />}</>
);
export const Thrust = ({ x, m }: { x: number; m?: string }) => {
  const p = padStyle(m);
  return <><rect {...p} x={x - 4} y={174} width={8} height={52} rx={1} /><rect x={x - 10} y={181} width={4} height={38} fill="var(--ink)" opacity={0.45} /><rect x={x + 6} y={181} width={4} height={38} fill="var(--ink)" opacity={0.45} /></>;
};
export const SealGlyph = ({ x, m }: { x: number; m?: string }) => (
  <><Rect m={m} x={x - 5} y={183} width={10} height={34} rx={1} /><line x1={x - 5} y1={190} x2={x + 5} y2={196} stroke="var(--ink)" opacity={0.5} /><line x1={x - 5} y1={204} x2={x + 5} y2={210} stroke="var(--ink)" opacity={0.5} /></>
);
export const Coupling = ({ x1, x2, cy }: { x1: number; x2: number; cy: number }) => (
  <><rect x={x1} y={cy - 15} width={x2 - x1} height={30} rx={3} fill="none" stroke="var(--muted)" strokeDasharray="3 3" />
    <rect x={x1 + 10} y={cy - 12} width={4} height={24} fill="var(--ink)" opacity={0.6} /><rect x={x2 - 14} y={cy - 12} width={4} height={24} fill="var(--ink)" opacity={0.6} /></>
);
export const Shaft = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <><line className="shaft" x1={x1} y1={y} x2={x2} y2={y} /><line className="shaftspin" x1={x1} y1={y} x2={x2} y2={y} /></>
);

/** Machine status badge + tag + description. The badge shows the anomaly index of the worst model. */
export const Badge = ({ x, y, tag, halo = true }: { x: number; y: number; tag: string; halo?: boolean }) => {
  const { h } = eqHealth(tag);
  const k = h === null ? 'stale' : band(h)[0];
  return (
    <>
      <rect className="ring" x={x - 3} y={y - 3} width={90} height={28} rx={6} style={{ opacity: k === 'crit' ? undefined : 0 }} />
      <rect className="bdg" x={x} y={y} width={84} height={22} rx={4} style={{ fill: col(k), stroke: 'none' }} />
      <text className="bdgt" x={x + 42} y={y + 15.5} textAnchor="middle" style={{ fill: `var(--on-${k})` }}>{h === null ? 'Stale' : `${h} · ${band(h)[1]}`}</text>
      <text className={`tagt${halo ? ' halo' : ''}`} x={x + 92} y={y + 10}>{tag}</text>
      <text className={`desct${halo ? ' halo' : ''}`} x={x + 92} y={y + 24}>{EQ[tag].desc}</text>
    </>
  );
};

/** A clickable machine group. */
export const Machine = ({ tag, onOpen, children }: { tag: string; onOpen: (tag: string) => void; children: ReactNode }) => {
  const { h } = eqHealth(tag);
  const k = h === null ? 'stale' : band(h)[0];
  return (
    <g className={`node${k === 'crit' ? ' critical' : ''}`} tabIndex={0} role="link" aria-label={`${tag} ${EQ[tag].desc}, anomaly index ${h ?? 'unknown, input stale'}`}
      onClick={() => onOpen(tag)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(tag); } }}>
      {children}
    </g>
  );
};

/** Operating KPI tile bound to one sensor of one model. Clicking opens that model. */
export const Kpi = ({ x, y, w, label, tag, model, onModel }: { x: number; y: number; w: number; label: string; tag: string; model: string; onModel: (id: string) => void }) => {
  const m = MODELS[model];
  const s = m?.sensors.find((q) => q.tag === tag);
  if (!s) return null;
  const { z, k } = sensorDev(s), d = Math.min(1, s.dec);
  return (
    <g className={`mp kpi${k === 'high' || k === 'crit' ? ' dev' : ''}`} tabIndex={0} role="link"
      aria-label={`${s.tag} ${s.name}: ${s.stale ? 'stale' : fmt(s.a[N - 1], d) + ' ' + s.unit}. Opens ${m.name} model`}
      onClick={(e) => { e.stopPropagation(); onModel(model); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onModel(model); } }}>
      <title>{`${s.name} · predicted ${fmt(s.p[N - 1], d)} ${s.unit}${z !== null ? ' · ' + fmt(z, 1) + 'σ' : ''}`}</title>
      <rect className="kbox" x={x} y={y} width={w} height={48} rx={5} />
      <circle className="mpd" cx={x + 11} cy={y + 14} r={3.6} style={{ fill: col(k) }} />
      <text className="klab" x={x + 20} y={y + 18}>{label}</text>
      <text className="kval" x={x + 10} y={y + 40}>
        <tspan className="kv" style={{ fill: s.stale ? 'var(--stale)' : 'var(--ink)' }}>{s.stale ? 'Stale' : fmt(s.a[N - 1], d)}</tspan>
        <tspan className="ku" dx={4}>{s.stale ? '' : s.unit}</tspan>
      </text>
    </g>
  );
};
export type KpiDef = [x: number, y: number, w: number, label: string, tag: string, model: string];

export const SvgFrame = ({ title, height, children }: { title: string; height: number; children: ReactNode }) => (
  <svg id="schem" viewBox={`0 0 990 ${height}`} role="group" aria-label={`${title} machinery train with equipment and sensor health`}>
    <defs><marker id="arr" viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--pipe)" /></marker></defs>
    <g transform="translate(0,56)">{children}</g>
  </svg>
);
export const Arrow = ({ d }: { d: string }) => <path className="util" d={d} markerEnd="url(#arr)" />;

export interface SchematicProps { trainId: string; onOpen: (tag: string) => void; onModel: (id: string) => void }
