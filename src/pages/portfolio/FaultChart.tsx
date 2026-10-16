import { moneyShort } from '../../lib/format';
import type { FaultCase } from '../../data/portfolio';

/** Top 10 failure modes by confirmed fault cases. */
export function FaultChart({ cases }: { cases: FaultCase[] }) {
  const tot = cases.length;
  const m = new Map<string, { mode: string; n: number; v: number }>();
  cases.forEach((c) => { const o = m.get(c.mode) || { mode: c.mode, n: 0, v: 0 }; o.n++; o.v += c.value; m.set(c.mode, o); });
  const list = [...m.values()].sort((a, b) => b.n - a.n).slice(0, 10);

  let body: JSX.Element;
  if (!list.length) body = <p className="muted">No confirmed fault cases for this selection.</p>;
  else {
    const mx = list[0].n, W = 560, rowH = 30, T = 6, Lw = 196, Rw = 96, H = T + list.length * rowH + 6, x = (v: number) => Lw + ((W - Lw - Rw) * v) / mx;
    body = (
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Top fault diagnostics by confirmed fault cases">
        {list.map((f, i) => {
          const yy = T + i * rowH;
          return (
            <g key={f.mode}>
              <text x={Lw - 8} y={yy + 19} textAnchor="end" fontSize={12.5} fill="var(--ink)">{f.mode}</text>
              <rect x={Lw} y={yy + 6} width={Math.max(2, x(f.n) - Lw)} height={18} fill="var(--accent)" rx={2}><title>{`${f.mode}: ${f.n} fault cases · ${moneyShort(f.v)} value at stake`}</title></rect>
              <text x={x(f.n) + 6} y={yy + 19} fontSize={12} fill="var(--ink)" fontWeight={600}>{f.n}<tspan fill="var(--muted)" fontWeight={400}> · {Math.round((f.n / tot) * 100)}%</tspan></text>
            </g>
          );
        })}
      </svg>
    );
  }
  return (
    <section className="panel" aria-labelledby="fh">
      <div className="panel-head"><div><h2 id="fh">Top fault diagnostics · 12 months</h2><p>Confirmed fault cases by diagnosed failure mode. Hover a bar for the value at stake.</p></div></div>
      <div className="chart">{body}</div>
      <div className="legend"><span>Label: fault cases · share of all fault cases</span></div>
    </section>
  );
}
