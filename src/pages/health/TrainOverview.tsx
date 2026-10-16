import { useParams } from 'react-router-dom';
import { EQ, MODELS, TRAINS, band, col, eqHealth, type Model } from '../../data/healthSim';
import { useHealth } from './context';
import { GtcSchematic } from './schematics/GtcSchematic';
import { MdcSchematic } from './schematics/MdcSchematic';
import { MdpSchematic } from './schematics/MdpSchematic';

const LINE_LEGEND: Record<string, string> = { mdp: 'Dotted: seal barrier fluid (API Plan 53A)' };

/** 30-day anomaly-index trend with a reference line at the watch threshold (20). */
function MiniSpark({ vals, k }: { vals: number[]; k: string }) {
  const w = 96, h = 26, pts = vals.filter((_, i) => i % 3 === 0 || i === vals.length - 1);
  const Y = (v: number) => h - 2 - (v / 100) * (h - 4);
  const d = pts.map((v, i) => (i ? 'L' : 'M') + ((i * (w - 4)) / (pts.length - 1) + 2).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
  return (
    <svg className="spk" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <line x1={2} x2={w - 2} y1={Y(20)} y2={Y(20)} stroke="var(--line)" strokeDasharray="2 2" />
      <path d={d} fill="none" stroke={col(k)} strokeWidth={1.6} />
      <circle cx={w - 2} cy={Y(vals[vals.length - 1])} r={2.4} fill={col(k)} />
    </svg>
  );
}
export const StatusPill = ({ m }: { m: Model }) => {
  if (m.stale) return <span className="pill k-stale">Input stale</span>;
  if (m.alert) return <span className="pill k-alert">Alert {m.alert.id}</span>;
  const [k, l] = band(m.health);
  return <span className={`pill k-${k}`}>{l}</span>;
};

export function TrainOverview() {
  const { trainId = 'trainA' } = useParams();
  const { openEquipment, openModel } = useHealth();
  const T = TRAINS[trainId];
  const ms = Object.values(MODELS).filter((m) => m.train === trainId);
  const eqs = Object.keys(EQ).filter((t) => EQ[t].train === trainId);
  const run = ms.filter((m) => !m.stale).map((m) => m.health);
  const hs = eqs.map((t) => eqHealth(t).h).filter((x): x is number => x !== null);
  const trainIdx = Math.round(hs.reduce((a, b) => a + b, 0) / hs.length);
  const crit = eqs.filter((t) => { const h = eqHealth(t).h; return h !== null && h >= 60; }).length;
  const nStale = ms.filter((m) => m.stale).length;
  const tiles: [string, string | number, string][] = [
    ['Train anomaly index', trainIdx, `Worst equipment: ${Math.max(...run)} · 0 = normal`],
    ['Active alerts', ms.filter((m) => m.alert).length, `${crit} equipment critical`],
    ['Models running', `${ms.length - nStale}/${ms.length}`, nStale ? `${nStale} model${nStale > 1 ? 's' : ''} with stale inputs` : 'All model inputs live'],
    ['On watch', ms.filter((m) => !m.stale && !m.alert && m.health >= 20).length, 'Drifting, no alert raised yet'],
  ];
  const order = [...ms].sort((a, b) => (a.stale ? 1 : 0) - (b.stale ? 1 : 0) || b.health - a.health);
  const props = { trainId, onOpen: openEquipment, onModel: openModel };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="tiles" aria-label="Train summary">
        {tiles.map(([l, v, s]) => <div className="tile" key={l}><div className="lbl">{l}</div><div className="val">{v}</div><div className="sub">{s}</div></div>)}
      </section>
      <div className="ovgrid">
        <section className="panel pop" key={trainId}>
          <div className="panel-head"><div><h2>{T.name} machinery train</h2>
            <p>Each ML model colours only the part of the machine it monitors, so the problem area stands out. Grey parts have no model. The badge under each machine shows its anomaly index (0 = normal, higher = worse) from its worst model. Each machine shows only its key operating KPIs; the full sensor set is on the detail page. Select a machine or a KPI to open its model and alert detail.</p></div></div>
          <div className="schem-wrap">
            {T.type === 'mdc' ? <MdcSchematic {...props} /> : T.type === 'mdp' ? <MdpSchematic {...props} /> : <GtcSchematic {...props} />}
          </div>
          <div className="legend">
            <span><b>Anomaly index</b> 0 = normal, higher = worse:</span>
            <span><i style={{ background: 'var(--good)' }} />Normal &lt; 20</span><span><i style={{ background: 'var(--med)' }} />Watch 20–39</span>
            <span><i style={{ background: 'var(--high)' }} />Warning 40–59</span><span><i style={{ background: 'var(--crit)' }} />Critical ≥ 60</span>
            <span><i style={{ background: 'var(--stale)' }} />Model input stale</span><span><i style={{ background: 'var(--soft)', outline: '1px solid var(--neutral)' }} />No model</span>
            <span>KPI dot: green within 2σ of model prediction, red beyond 4.5σ</span>
            <span>{LINE_LEGEND[T.type || ''] || 'Dashed: lube oil supply · Dotted: seal gas'}</span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h2>Model register</h2><p>Anomaly index (0 = normal, 100 = worst), 30-day trend and run status for every model on the train. Worst first.</p></div></div>
          <div className="tablewrap"><table><thead><tr><th>Model</th><th>Anomaly index</th><th>30-day trend</th><th>Status</th></tr></thead>
            <tbody>{order.map((m) => {
              const k = m.stale ? 'stale' : band(m.health)[0];
              return (
                <tr className="mrow" tabIndex={0} key={m.id} onClick={() => openModel(m.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModel(m.id); } }}>
                  <td><span className="mono">{m.eq}</span><br />{m.name}</td>
                  <td><div className="hcell"><b className="num" style={{ color: col(k) }}>{m.stale ? '—' : m.health}</b><span className="hbar"><i style={{ width: `${m.stale ? 0 : m.health}%`, background: col(k) }} /></span></div></td>
                  <td><MiniSpark vals={m.hs} k={k} /></td>
                  <td><StatusPill m={m} /></td>
                </tr>
              );
            })}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
