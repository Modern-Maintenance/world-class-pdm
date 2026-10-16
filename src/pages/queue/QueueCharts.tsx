import { SEV_LABEL, type QueueAlert } from '../../data/queue';

const FUNNEL: [string, number][] = [['Generated', 412], ['Passed data-quality & mode gating', 318], ['Acknowledged', 296], ['Validated as real', 187], ['Work order raised', 142], ['Confirmed at repair', 118]];

export function Funnel() {
  return (
    <div className="funnel">
      {FUNNEL.map(([label, n], i) => {
        const conv = i ? Math.round((n / FUNNEL[i - 1][1]) * 100) : null;
        return (
          <div className="fstep" key={label}>
            <span>{label}</span>
            <span className="b"><i style={{ width: `${(n / FUNNEL[0][1]) * 100}%` }} /><span className="num">{n}</span></span>
            <span className={`conv${conv !== null && conv < 70 ? ' leak' : ''}`}>{conv === null ? '' : conv + '%'}</span>
          </div>
        );
      })}
    </div>
  );
}

const SEV_COLOR: Record<number, string> = { 4: 'var(--crit)', 3: 'var(--high)', 2: 'var(--med)', 1: 'var(--low)' };

/** Open alerts by age bucket, stacked by severity. */
export function AgingChart({ alerts }: { alerts: QueueAlert[] }) {
  const buckets: [string, number, number][] = [['0–2 d', 0, 2], ['3–7 d', 2, 7], ['8–14 d', 7, 14], ['15–30 d', 14, 30], ['> 30 d', 30, 999]];
  const sevs = [4, 3, 2, 1];
  const data = buckets.map((b) => sevs.map((s) => alerts.filter((a) => a.sev === s && a.age > b[1] - (b[1] === 0 ? 1 : 0) && a.age <= b[2]).length));
  const W = 460, H = 220, L = 34, B = 30, T = 10, R = 10, mx = Math.max(6, ...data.map((d) => d.reduce((x, y) => x + y, 0)));
  const ymax = Math.ceil(mx / 2) * 2, y = (v: number) => T + (H - T - B) * (1 - v / ymax), bw = (W - L - R) / buckets.length;
  const ticks: number[] = [];
  for (let v = 0; v <= ymax; v += 2) ticks.push(v);
  return (
    <>
      <div className="chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Open alerts by age bucket and severity">
          {ticks.map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{v}</text></g>)}
          {data.map((d, i) => {
            const x = L + i * bw + bw * 0.2, w = bw * 0.6;
            let acc = 0;
            const rects = d.map((c, j) => {
              if (!c) return null;
              const r = <rect key={j} x={x} y={y(acc + c)} width={w} height={y(acc) - y(acc + c) - 1} fill={SEV_COLOR[sevs[j]]} rx={2} />;
              acc += c;
              return r;
            });
            return (
              <g key={i}>{rects}
                {acc > 0 && <text x={x + w / 2} y={y(acc) - 5} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">{acc}</text>}
                <text x={x + w / 2} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--muted)">{buckets[i][0]}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend">
        {sevs.map((v) => <span key={v}><i style={{ background: SEV_COLOR[v] }} />{SEV_LABEL[v]}</span>)}
        <span>Response SLA: critical 1 d · high 3 d · medium 7 d</span>
      </div>
    </>
  );
}

export function PrecisionTrend() {
  const v = [58, 61, 60, 63, 62, 65, 64, 66, 67, 66, 69, 68], wk = ['W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40', 'W41'];
  const W = 460, H = 220, L = 34, B = 30, T = 14, R = 14, lo = 50, hi = 80;
  const y = (q: number) => T + (H - T - B) * (1 - (q - lo) / (hi - lo)), x = (i: number) => L + (i * (W - L - R)) / (v.length - 1);
  const d = v.map((q, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(q).toFixed(1)).join(' ');
  const n = v.length - 1;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly alert precision, rising from 58% to 68% against a 70% target">
        {[50, 60, 70, 80].map((q) => <g key={q}><line x1={L} x2={W - R} y1={y(q)} y2={y(q)} stroke="var(--line)" /><text x={L - 6} y={y(q) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{q}%</text></g>)}
        <line x1={L} x2={W - R} y1={y(70)} y2={y(70)} stroke="var(--good)" strokeDasharray="5 4" />
        <text x={W - R} y={y(70) - 6} textAnchor="end" fontSize={11} fill="var(--good)">Target 70%</text>
        <path d={`${d} L${x(n)} ${y(lo)} L${x(0)} ${y(lo)}Z`} fill="var(--accent-soft)" opacity={0.8} />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <circle cx={x(n)} cy={y(v[n])} r={4} fill="var(--accent)" />
        <text x={x(n) - 8} y={y(v[n]) + 18} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--ink)">{v[n]}%</text>
        {wk.map((w, i) => (i % 2 === 1 ? <text key={w} x={x(i)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--muted)">{w}</text> : null))}
      </svg>
    </div>
  );
}
