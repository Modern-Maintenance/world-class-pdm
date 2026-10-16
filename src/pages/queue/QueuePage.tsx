import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkline } from '../../components/Sparkline';
import { money } from '../../lib/format';
import { HEALTH_TAGS, QUEUE, SEV_LABEL, SLA, type QueueState } from '../../data/queue';
import { AgingChart, Funnel, PrecisionTrend } from './QueueCharts';

const STATES: QueueState[] = ['New', 'Acknowledged', 'Validated', 'WO raised', 'Monitoring'];

/** Static programme KPIs (sample). Replace with values computed from the alert store. */
function buildTiles() {
  const critHigh = QUEUE.filter((a) => a.sev >= 3).length;
  const varTot = QUEUE.reduce((s, a) => s + a.var, 0);
  const overdue = QUEUE.filter((a) => a.overdue).length;
  return [
    { l: 'Critical & high open', v: String(critHigh), u: `of ${QUEUE.length} open`, d: '+2 vs last wk', bad: true, s: [3, 4, 4, 5, 4, 5, 6, 5, 6, 6, 7, critHigh], sub: `${QUEUE.filter((a) => a.safety).length} on safety-critical equipment`, alert: true },
    { l: 'Value at risk (open)', v: money(varTot), u: '', d: '+$1.1M vs last wk', bad: true, s: [2.1, 2.4, 2.2, 2.9, 3.1, 2.8, 3.4, 3.6, 3.2, 3.9, 4.2, varTot / 1e6], sub: 'Expected cost if open alerts are not acted on' },
    { l: 'Overdue vs SLA', v: String(overdue), u: 'alerts', d: '+1 vs last wk', bad: true, s: [2, 3, 2, 4, 3, 3, 4, 5, 4, 3, 4, overdue], sub: 'New or acknowledged past response window', alert: overdue > 3 },
    { l: 'Alert precision (30 d)', v: '68', u: '% · target 70', d: '+3 pts', bad: false, s: [58, 61, 60, 63, 62, 65, 64, 66, 67, 66, 69, 68], sub: 'Validated ÷ dispositioned' },
    { l: 'Median lead time', v: '21', u: 'days', d: '+2 d', bad: false, s: [15, 16, 17, 16, 18, 19, 18, 19, 20, 19, 20, 21], sub: 'First alert to intervention, validated catches' },
    { l: 'Mean time to acknowledge', v: '9.4', u: 'hours', d: '+1.8 h', bad: true, s: [6.1, 6.5, 7, 6.8, 7.4, 7.9, 7.2, 8.1, 8.4, 7.6, 8.9, 9.4], sub: 'Target ≤ 4 h for critical alerts' },
    { l: 'Alert → work order', v: '61', u: '%', d: '+4 pts', bad: false, s: [50, 52, 51, 55, 54, 56, 55, 58, 57, 59, 60, 61], sub: 'Validated alerts that became SAP PM work' },
    { l: 'Detection coverage (90 d)', v: '82', u: '%', d: '2 missed', bad: true, s: [76, 77, 79, 78, 80, 81, 80, 82, 83, 81, 82, 82], sub: 'Failures preceded by an alert' },
  ];
}

const MODEL_HEALTH: [string, number, number, number, number][] = [
  ['Bearing degradation', 78, 64, 0, 24], ['Impeller fouling / efficiency', 88, 41, 0, 45], ['Seal leakage', 74, 52, 1, 12], ['Combustion spread', 71, 28, 0, 16],
  ['Misalignment', 69, 33, 1, 19], ['Overheating', 52, 42, 0, 9], ['Cavitation', 41, 58, 0, 6],
];
const BAD_ACTORS: [string, string, number, number, number, 'noisy' | 'chronic' | 'watch', string, string][] = [
  ['P-410A', 'Site B', 11, 6, 27, 'noisy', 'Noisy model', 'Retune cavitation model; check suction pressure transmitter'],
  ['K-101A', 'Site A', 9, 3, 89, 'chronic', 'Chronic equipment issue', 'Open bearing RCA (oil quality, alignment, load history)'],
  ['P-207', 'Site C', 8, 5, 25, 'noisy', 'Noisy model', 'Add ambient compensation; review thresholds'],
  ['P-205B', 'Site C', 6, 4, 83, 'chronic', 'Chronic equipment issue', 'Seal RCA; review Plan 53A operation and seal selection'],
  ['GT-201', 'Site B', 5, 1, 80, 'watch', 'Watch', 'No pattern yet'],
  ['K-310', 'Site A', 4, 2, 75, 'watch', 'Watch', 'Review if a third seal alert recurs'],
];
const barColor = (p: number) => (p >= 70 ? 'var(--good)' : p >= 55 ? 'var(--med)' : 'var(--crit)');

export function QueuePage() {
  const [site, setSite] = useState('all');
  const [states, setStates] = useState<Set<QueueState>>(new Set(STATES));
  const [openId, setOpenId] = useState<string | null>(QUEUE[0].id);
  const sites = [...new Set(QUEUE.map((a) => a.site))];
  const rows = QUEUE.filter((a) => (site === 'all' || a.site === site) && states.has(a.state));
  const toggleState = (s: QueueState) => setStates((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  const toggleRow = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="eyebrow">World Class PdM · Predictive Analytics Performance</div>
          <h1>Predictive Alert Command</h1>
          <div className="meta"><span>3 sites · 186 monitored assets · 214 models</span><span>Data as of 08 Oct 2026, 06:00 GST</span><span className="sample">Sample data</span></div>
        </div>
        <div className="realised"><div className="v num">$11.2M</div><div className="l">Value realised YTD · 31 confirmed catches</div></div>
      </header>

      <section className="tiles" aria-label="Headline KPIs">
        {buildTiles().map((t) => (
          <div className={`tile${t.alert ? ' alert' : ''}`} key={t.l}>
            <div className="lbl">{t.l}</div>
            <div className="row"><span className="val">{t.v}</span><span className="unit">{t.u}</span><span className={`delta ${t.bad ? 'bad' : 'good'}`}>{t.d}</span></div>
            <div className="sub">{t.sub}</div>
            <Sparkline values={t.s} />
          </div>
        ))}
      </section>

      <section className="panel" aria-labelledby="qh">
        <div className="panel-head">
          <div><h2 id="qh">Prioritised action queue</h2><p>Open alerts ranked by risk priority: asset criticality × severity × model confidence × urgency (time to functional failure). Select a row for evidence and recommended actions.</p></div>
          <div className="filters">
            <label htmlFor="site">Site</label>
            <select id="site" value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="all">All sites</option>
              {sites.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="filters" role="group" aria-label="Status filter">
              {STATES.map((s) => <button key={s} type="button" className="chip" aria-pressed={states.has(s)} onClick={() => toggleState(s)}>{s}</button>)}
            </span>
          </div>
        </div>
        <div className="tablewrap">
          <table id="queue">
            <thead><tr><th>#</th><th>Priority</th><th>Asset</th><th>Failure mode</th><th className="r">Time to failure</th><th className="r">Confidence</th><th className="r">Value at risk</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="muted">No open alerts match these filters.</td></tr>}
              {rows.map((a, i) => (
                <Fragment key={a.id}>
                  <tr className={`q s${a.sev}`} tabIndex={0} aria-expanded={openId === a.id} onClick={() => toggleRow(a.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(a.id); } }}>
                    <td><span className="rank">{i + 1}</span></td>
                    <td><div className="score"><b className="num">{a.score}</b><span className="bar"><i style={{ width: `${a.score}%` }} /></span></div><span className={`pill p${a.sev}`}>{SEV_LABEL[a.sev]}</span> {a.safety && <span className="pill psafe">Safety</span>}</td>
                    <td><span className="tag">{a.tag}</span> <span className="muted">· Crit {a.crit}</span><br />{a.desc}<br /><span className="muted" style={{ fontSize: '.8rem' }}>{a.site} · {a.train}</span></td>
                    <td>{a.fm}<br /><span className="mono muted">ISO 14224: {a.iso}</span></td>
                    <td className="r num"><span className={a.ttf <= 7 ? 'ttf urgent' : 'ttf'}>{a.ttf} d</span></td>
                    <td className="r num">{Math.round(a.conf * 100)}%</td>
                    <td className="r num">{a.safety ? <span className="muted">Safety</span> : money(a.var)}</td>
                    <td><span className="pill pst">{a.state}</span> <span className="muted num" style={{ fontSize: '.8rem' }}>{a.age < 1 ? Math.round(a.age * 24) + ' h' : a.age.toFixed(0) + ' d'}</span>{a.overdue && <> <span className="pill pov">Overdue</span></>}</td>
                    <td><button className="expand" type="button">{openId === a.id ? 'Hide' : 'Details'}</button></td>
                  </tr>
                  {openId === a.id && (
                    <tr className="detail"><td colSpan={9}><div className="cols">
                      <div><h3>Evidence</h3><ul>{a.ev.map((x) => <li key={x}>{x}</li>)}</ul></div>
                      <div><h3>Recommended actions</h3><ol>{a.act.map((x) => <li key={x}>{x}</li>)}</ol></div>
                      <div><h3>Ownership</h3><dl>
                        <dt>Alert</dt><dd className="mono">{a.id}</dd><dt>Owner</dt><dd>{a.owner}</dd>
                        <dt>SAP notification</dt><dd className="mono">{a.notif || <span className="muted">Not raised</span>}</dd>
                        <dt>Response SLA</dt><dd>{SLA[a.sev]} day{SLA[a.sev] > 1 ? 's' : ''}</dd>
                        {HEALTH_TAGS.includes(a.tag) && <><dt>Asset health</dt><dd><Link className="inlink" to={`/equipment/${a.tag}`}>Open {a.tag} health →</Link></dd></>}
                      </dl></div>
                    </div></td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: '.82rem', margin: '10px 0 0' }}>Showing {rows.length} of {QUEUE.length} open alerts · {money(rows.reduce((s, a) => s + a.var, 0))} value at risk in view</p>
      </section>

      <div className="grid2">
        <section className="panel" aria-labelledby="qfh">
          <div className="panel-head"><div><h2 id="qfh">Alert-to-value funnel</h2><p>Last 90 days. Shows where alerts leak before they produce a maintenance outcome.</p></div></div>
          <Funnel />
          <div className="insight"><b>Biggest leak:</b> Acknowledged → Validated loses 37% of alerts. Most rejections are cavitation and overheating models (see model health). Fixing those two raises precision more than any other action.</div>
        </section>
        <section className="panel" aria-labelledby="ah">
          <div className="panel-head"><div><h2 id="ah">Open alert aging</h2><p>Open alerts by days since raised, stacked by severity. Anything past its response SLA is a governance problem, not a model problem.</p></div></div>
          <AgingChart alerts={QUEUE} />
        </section>
      </div>

      <div className="grid2">
        <section className="panel" aria-labelledby="qph">
          <div className="panel-head"><div><h2 id="qph">Alert precision trend</h2><p>Weekly share of dispositioned alerts validated as real. Target 70%.</p></div></div>
          <PrecisionTrend />
        </section>
        <section className="panel" aria-labelledby="mh">
          <div className="panel-head"><div><h2 id="mh">Model health by failure mode</h2><p>90 days. Low precision erodes operator trust; missed failures erode coverage. Both need different fixes.</p></div></div>
          <div className="tablewrap"><table id="models"><thead><tr><th>Failure mode</th><th>Precision</th><th className="r">Alerts</th><th className="r">Missed</th><th className="r">Median lead</th></tr></thead>
            <tbody>{MODEL_HEALTH.map((m) => (
              <tr key={m[0]}><td>{m[0]}</td><td><div className="mbar"><span className="num" style={{ width: '3ch' }}>{m[1]}%</span><span className="bar"><i style={{ width: `${m[1]}%`, background: barColor(m[1]) }} /></span></div></td>
                <td className="r num">{m[2]}</td><td className="r num" style={m[3] ? { color: 'var(--crit)', fontWeight: 600 } : undefined}>{m[3]}</td><td className="r num">{m[4]} d</td></tr>
            ))}</tbody></table></div>
        </section>
      </div>

      <section className="panel" aria-labelledby="bh">
        <div className="panel-head"><div><h2 id="bh">Bad actors</h2><p>Assets with the most alerts in 90 days. Repeats with high validation point to a chronic equipment issue that needs RCA. Repeats with low validation point to a noisy model or instrument.</p></div></div>
        <div className="tablewrap"><table id="bad"><thead><tr><th>Asset</th><th>Site</th><th className="r">Alerts</th><th className="r">Same-mode repeats</th><th>Validated</th><th>Diagnosis</th><th>Next action</th></tr></thead>
          <tbody>{BAD_ACTORS.map((b) => (
            <tr key={b[0]}><td className="tag">{b[0]}</td><td>{b[1]}</td><td className="r num">{b[2]}</td><td className="r num">{b[3]}</td>
              <td><div className="mbar"><span className="num" style={{ width: '3ch' }}>{b[4]}%</span><span className="bar"><i style={{ width: `${b[4]}%`, background: barColor(b[4]) }} /></span></div></td>
              <td><span className={`flag ${b[5]}`}>{b[6]}</span></td><td>{b[7]}</td></tr>
          ))}</tbody></table></div>
      </section>

      <details className="defs">
        <summary>KPI definitions and formulas</summary>
        <div className="defgrid">
          <div><b>Risk priority score (0–100)</b>100 × <code>C</code> × <code>S/4</code> × <code>P</code> × <code>U</code>. C = criticality weight (A 1.0, B 0.65, C 0.35), S = severity 1–4, P = model confidence, U = urgency from time to failure (≤7 d 1.0, ≤30 d 0.75, ≤90 d 0.5, else 0.3). Safety-critical assets get a floor of 70.</div>
          <div><b>Value at risk</b>Expected cost if the alert is ignored: production deferral × probability + reactive repair premium over planned repair.</div>
          <div><b>Overdue vs SLA</b>Alerts still New or Acknowledged beyond the response SLA. SLA: severity 4 = 1 day, 3 = 3 days, 2 = 7 days, 1 = 14 days.</div>
          <div><b>Alert precision</b>Validated ÷ (Validated + Rejected), over dispositioned alerts only. Open alerts are excluded.</div>
          <div><b>Median lead time</b>Days between first alert and confirmed functional failure or intervention, for validated catches.</div>
          <div><b>Mean time to acknowledge (MTTA)</b>Mean hours from alert creation to first human acknowledgement.</div>
          <div><b>Alert → work order conversion</b>Validated alerts that produced a SAP PM notification or work order ÷ validated alerts.</div>
          <div><b>Detection coverage</b>Functional failures on monitored assets preceded by a relevant alert ÷ all such failures. The complement is missed failures.</div>
          <div><b>Value realised</b>Avoided cost from validated catches confirmed by as-found condition at repair, signed off by reliability engineering.</div>
        </div>
      </details>
    </div>
  );
}
