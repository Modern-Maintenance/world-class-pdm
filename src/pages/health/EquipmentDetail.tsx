import { Link, useParams } from 'react-router-dom';
import { fmt, money } from '../../lib/format';
import { EQ, MODELS, N, TRAINS, band, col, defaultModel, modelRisk, tLabel, ALERT, WATCH } from '../../data/healthSim';
import { SEV_LABEL } from '../../data/queue';
import { pathFor } from './AssetTree';
import { useHealth } from './context';
import { AnomalyChart } from './charts/AnomalyChart';
import { Gauge } from './charts/Gauge';
import { SensorChart } from './charts/SensorChart';

export function EquipmentDetail() {
  const { tag = '' } = useParams();
  const { selected, selectModel } = useHealth();
  const e = EQ[tag];
  if (!e) return <p>Unknown equipment {tag}.</p>;
  const mId = selected[tag] && e.models.includes(selected[tag]) ? selected[tag] : defaultModel(tag);
  const m = MODELS[mId];
  const [hk, hl] = m.stale ? ['stale', 'Input stale'] : band(m.health);
  const path = pathFor(tag);
  const evidence = m.ranked.slice(0, 3).filter((s) => s.pct > 8).map((s) => {
    const d = s.am - s.pm, pc = s.pm ? (d / Math.abs(s.pm)) * 100 : 0;
    return <li key={s.tag}>{s.name}: {fmt(s.am, s.dec)} {s.unit} actual vs {fmt(s.pm, s.dec)} predicted ({d >= 0 ? '+' : ''}{fmt(pc, 1)}%)</li>;
  });
  const dq = m.stale ? Math.round(((m.sensors.length - m.sensors.filter((s) => s.stale).length) / m.sensors.length) * 100) : 100;
  const risk = modelRisk(m);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <span>Site A</span><span aria-hidden="true">/</span>
          {path && <><span>{path.unit}</span><span aria-hidden="true">/</span><span>{path.system}</span><span aria-hidden="true">/</span>
            <Link to={`/health/${path.train}`}>{TRAINS[path.train].name}</Link><span aria-hidden="true">/</span></>}
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{tag}</span>
        </nav>
        <span className="muted" style={{ fontSize: '.86rem' }}>Criticality {e.crit} · {e.models.length} model{e.models.length > 1 ? 's' : ''}</span>
      </div>

      <div className="tabs" role="tablist">
        {e.models.map((id) => {
          const x = MODELS[id], k = x.stale ? 'stale' : band(x.health)[0];
          return (
            <button key={id} className="tab" role="tab" type="button" aria-selected={id === mId} onClick={() => selectModel(tag, id)}>
              <span className="dot" style={{ background: col(k) }} />{x.name}<b className="num">{x.stale ? '—' : x.health}</b>{x.alert && <span className="pill k-alert">Alert</span>}
            </button>
          );
        })}
      </div>

      <div className="dgrid3">
        <section className="panel gauge">
          {m.alert && risk !== null ? (
            <><h3>Risk priority score</h3><Gauge value={risk} mode="risk" />
              <div className="cap">Criticality {e.crit} × severity {m.alert.sev} × confidence {Math.round(m.alert.conf * 100)}% × urgency ({m.alert.ttf} d to failure)</div></>
          ) : (
            <><h3>Anomaly index</h3><Gauge value={m.stale ? 0 : m.health} mode="anom" stale={!!m.stale} />
              <div className="cap">{m.stale ? 'Not reliable while inputs are stale' : 'No active alert on this model'}</div></>
          )}
        </section>
        <section className="panel">
          {m.alert ? (
            <>
              <h3>Alert {m.alert.id} · <span className={`pill k-${m.alert.sev >= 4 ? 'crit' : m.alert.sev === 3 ? 'high' : 'med'}`}>{SEV_LABEL[m.alert.sev]}</span></h3>
              <div className="fm">{m.alert.fm}</div>
              <dl className="kv">
                <dt>Time to functional failure</dt><dd className="num"><b>{m.alert.ttf} days</b></dd>
                <dt>Model confidence</dt><dd className="num">{Math.round(m.alert.conf * 100)}%</dd>
                <dt>Value at risk</dt><dd className="num">{money(m.alert.var)}</dd>
                <dt>Threshold crossed</dt><dd className="num">{m.alertIdx >= 0 ? tLabel(m.alertIdx) : '—'}</dd>
                <dt>Status</dt><dd>{m.alert.state} · SAP <span className="mono">{m.alert.notif || 'not raised'}</span></dd>
                <dt>ISO 14224 mode</dt><dd className="mono">{m.alert.iso}</dd>
              </dl>
              {evidence.length > 0 && <><h3 style={{ marginTop: 12 }}>Evidence</h3><ul className="ev">{evidence}</ul></>}
            </>
          ) : (
            <>
              <h3>Model status</h3><div className="fm">{m.stale ? 'Input data stale' : hl}</div>
              <div className="note">{m.note || 'All inputs are within the predicted range.'}</div>
              {evidence.length > 0 && <><h3 style={{ marginTop: 12 }}>Largest deviations</h3><ul className="ev">{evidence}</ul></>}
            </>
          )}
        </section>
        <section className="panel">
          <h3>Model</h3><div className="fm" style={{ fontSize: '1.1rem' }}>{m.name}</div>
          <dl className="kv">
            <dt>Model ID</dt><dd className="mono">{m.id}</dd><dt>Type</dt><dd>{m.type}</dd><dt>Inputs</dt><dd>{m.sensors.length} sensors</dd><dt>Last trained</dt><dd>{m.trained}</dd>
            <dt>Input data quality</dt><dd><span className={`pill k-${dq === 100 ? 'good' : 'stale'}`}>{dq}% live</span></dd>
            <dt>Anomaly index</dt><dd><span className={`pill k-${hk}`}>{m.stale ? '—' : m.health} · {hl}</span></dd>
            <dt>Last scored</dt><dd className="num">{tLabel(N - 1)}</dd>
          </dl>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><div><h2>Anomaly score</h2><p>Smoothed model residual score over 30 days. Watch at {WATCH}, alert at {ALERT}.</p></div></div>
        <div className="schart" style={{ border: 0, padding: 0 }}><AnomalyChart m={m} /></div>
      </section>

      <div className="dgrid2">
        <section className="panel">
          <div className="panel-head"><div><h2>Top contributors</h2><p>Share of the current anomaly score from each input (last 48 h). Arrow shows actual above or below prediction.</p></div></div>
          <div className="contrib">
            {m.ranked.map((s) => {
              const k = s.pct >= 30 ? 'crit' : s.pct >= 12 ? 'high' : 'accent';
              return (
                <div className="crow" key={s.tag}>
                  <div className="nm">{s.name}<span className="mono">{s.tag} · {s.am >= s.pm ? '▲ above' : '▼ below'} prediction</span></div>
                  <div className="bar"><i style={{ width: `${Math.max(s.pct, 1)}%`, background: col(k) }} /></div>
                  <div className="pct num">{fmt(s.pct, 0)}%</div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h2>Recommended actions</h2>{m.alert && <p>Owner: {m.alert.owner}</p>}</div></div>
          {m.alert ? <ol className="acts">{m.alert.acts.map((x) => <li key={x}>{x}</li>)}</ol>
            : m.note ? <div className="note">{m.note}</div> : <p className="muted" style={{ margin: 0 }}>No action needed. Keep the model in routine monitoring.</p>}
        </section>
      </div>

      <section>
        <div className="panel-head">
          <div><h2>Sensors: predicted vs actual</h2><p>Ordered by contribution. Shaded band is the model's expected range (±3σ). Red points fall outside it. Hover or drag across a chart to read values.</p></div>
          <div className="chartlegend">
            <span><span className="sw" style={{ borderColor: 'var(--ink)' }} />Actual</span>
            <span><span className="sw" style={{ borderColor: 'var(--accent)', borderTopStyle: 'dashed' }} />Predicted</span>
            <span><span className="bx" />Expected range</span>
            <span><span className="sw" style={{ borderColor: 'var(--crit)', borderTopStyle: 'dotted' }} />Alert raised</span>
          </div>
        </div>
        <div className="sgrid">{m.ranked.map((s) => <SensorChart key={s.tag} s={s} alertIdx={m.alertIdx} />)}</div>
      </section>
    </div>
  );
}
