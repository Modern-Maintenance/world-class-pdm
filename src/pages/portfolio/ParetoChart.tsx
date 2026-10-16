import { useState } from 'react';
import { moneyShort } from '../../lib/format';
import type { FaultCase } from '../../data/portfolio';

interface Props { cases: FaultCase[]; scopeLabel: string; monitored: number }
type Metric = 'n' | 'v';

/** Bad actors: assets ranked by fault cases or value at stake, with cumulative line and 80% marker. */
export function ParetoChart({ cases, scopeLabel, monitored }: Props) {
  const [metric, setMetric] = useState<Metric>('n');
  const m = new Map<string, { tag: string; site: string; n: number; v: number; cum: number }>();
  cases.forEach((c) => { const k = c.site + '|' + c.asset; const o = m.get(k) || { tag: c.asset, site: c.site, n: 0, v: 0, cum: 0 }; o.n++; o.v += c.value; m.set(k, o); });
  const list = [...m.values()].sort((a, b) => b[metric] - a[metric]);
  const tot = list.reduce((s, x) => s + x[metric], 0);
  let c = 0;
  list.forEach((x) => { c += x[metric]; x.cum = c / tot; });

  const seg = (
    <div className="seg" role="group" aria-label="Pareto metric">
      <button type="button" aria-pressed={metric === 'n'} onClick={() => setMetric('n')}>Fault cases</button>
      <button type="button" aria-pressed={metric === 'v'} onClick={() => setMetric('v')}>Value at stake (USD)</button>
    </div>
  );
  if (!list.length)
    return <section className="panel"><div className="panel-head"><div><h2>Bad actors · Pareto</h2></div>{seg}</div><p className="muted">No validated fault cases for this selection.</p></section>;

  const top = list.slice(0, 15), vital = list.filter((x) => x.cum - x[metric] / tot < 0.8).length;
  const W = 1120, H = 330, L = 58, Rr = 50, T = 16, B = 50, cw = (W - L - Rr) / top.length, mx = top[0][metric] * 1.1;
  const y = (v: number) => T + (H - T - B) * (1 - v / mx), yc = (p: number) => T + (H - T - B) * (1 - p);
  const step = metric === 'n' ? (mx > 40 ? 10 : mx > 12 ? 5 : 2) : mx > 2e6 ? 5e5 : mx > 1e6 ? 2.5e5 : 1e5;
  const ticks: number[] = [];
  for (let v = 0; v <= mx; v += step) ticks.push(v);
  const lbl = (x: (typeof top)[number]) => (metric === 'n' ? String(x.n) : moneyShort(x.v));
  const line = top.map((x, i) => (i ? 'L' : 'M') + (L + i * cw + cw / 2).toFixed(1) + ' ' + yc(x.cum).toFixed(1)).join(' ');
  const last = top[top.length - 1];
  const top5 = list.slice(0, 5).reduce((a, x) => a + x[metric], 0) / tot;

  return (
    <section className="panel" aria-labelledby="ph">
      <div className="panel-head">
        <div><h2 id="ph">Bad actors · Pareto</h2>
          <p>Top {Math.min(15, list.length)} of {list.length} assets with validated fault cases {scopeLabel}, ranked by {metric === 'n' ? 'number of fault cases' : 'value at stake'}. A fault case is one validated fault episode, which may raise several alerts. The line is the cumulative share of the total.</p></div>
        {seg}
      </div>
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Pareto of bad actors by ${metric === 'n' ? 'fault cases' : 'value at stake'}`}>
          {ticks.map((v) => (
            <g key={v}><line x1={L} x2={W - Rr} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{metric === 'n' ? v : moneyShort(v)}</text></g>
          ))}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((p) => <text key={p} x={W - Rr + 8} y={yc(p) + 4} fontSize={11} fill="var(--muted)">{Math.round(p * 100)}%</text>)}
          <line x1={L} x2={W - Rr} y1={yc(0.8)} y2={yc(0.8)} stroke="var(--crit)" strokeDasharray="6 4" />
          {top.map((x, i) => {
            const bx = L + i * cw + cw * 0.16, bw = cw * 0.68;
            return (
              <g key={x.site + x.tag}>
                <rect x={bx} y={y(x[metric])} width={bw} height={y(0) - y(x[metric])} rx={2} fill={i < vital ? 'var(--accent)' : 'var(--accent-2)'}>
                  <title>{`${x.tag} · Site ${x.site}: ${x.n} fault cases · ${moneyShort(x.v)} value at stake · ${Math.round(x.cum * 100)}% cumulative`}</title>
                </rect>
                <text x={bx + bw / 2} y={y(x[metric]) - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">{lbl(x)}</text>
                <text x={bx + bw / 2} y={H - B + 16} textAnchor="middle" fontSize={11.5} fontFamily="var(--f-mono)" fill="var(--ink)">{x.tag}</text>
                <text x={bx + bw / 2} y={H - B + 31} textAnchor="middle" fontSize={10.5} fill="var(--muted)">Site {x.site}</text>
              </g>
            );
          })}
          <path d={line} fill="none" stroke="var(--ink)" strokeWidth={2} />
          {top.map((x, i) => <circle key={'c' + i} cx={L + i * cw + cw / 2} cy={yc(x.cum)} r={3} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.6} />)}
          <text x={L + (top.length - 1) * cw + cw / 2} y={yc(last.cum) - 9} textAnchor="end" fontSize={11.5} fontWeight={600} fill="var(--ink)" stroke="var(--panel)" strokeWidth={4} paintOrder="stroke">{Math.round(last.cum * 100)}% cumulative</text>
        </svg>
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--accent)' }} />Vital few (up to 80% cumulative)</span><span><i style={{ background: 'var(--accent-2)' }} />Others in top 15</span>
        <span><span className="ln" />Cumulative share of all assets</span><span><span className="ln" style={{ borderTopStyle: 'dashed', borderColor: 'var(--crit)' }} />80% line</span>
      </div>
      <div className="insight">
        <b>{vital} asset{vital > 1 ? 's' : ''} ({Math.round((vital / monitored) * 100)}% of {monitored} monitored assets) account for 80% of {metric === 'n' ? 'fault cases' : 'value at stake'}.</b> The top 5 alone make up {Math.round(top5 * 100)}%. Prioritise RCA and model tuning on these before adding new monitoring.
      </div>
    </section>
  );
}
