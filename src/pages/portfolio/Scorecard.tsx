import { Link } from 'react-router-dom';
import { fmtH, moneyShort, pct } from '../../lib/format';
import { HEALTH_LINKS, PORTFOLIO, allAssets, stats, status, type KpiKey, type Site, type Stats } from '../../data/portfolio';

interface Props { site: Site | undefined; unit: number | 'all'; onSite: (id: string) => void; onUnit: (u: number) => void; onBack: () => void }

const Cell = ({ k, v }: { k: KpiKey; v: number }) => (
  <span className={`ratio ${status(k, v)}`}><i />{k === 'age' ? fmtH(v) : pct(v)}</span>
);
const Kpis = ({ st }: { st: Stats }) => (
  <>
    <td className="r num">{st.raised}</td>
    <td><Cell k="age" v={st.age} /></td><td><Cell k="clo" v={st.clo} /></td><td><Cell k="fpr" v={st.fpr} /></td><td><Cell k="tpr" v={st.tpr} /></td>
  </>
);
const ValueBar = ({ v, mx }: { v: number; mx?: number }) => (
  <div className="vbar"><b className="num">{moneyShort(v)}</b>{mx !== undefined && <span className="b"><i style={{ width: `${mx ? (v / mx) * 100 : 0}%` }} /></span>}</div>
);
const HealthLinks = ({ list }: { list?: [string, string][] }) =>
  list ? <>{list.map(([l, t]) => <Link key={t} className="hl" to={`/health/${t}`} onClick={(e) => e.stopPropagation()}>{l} →</Link>)}</> : <span className="muted" style={{ fontSize: '.8rem' }}>Not built yet</span>;

export function Scorecard({ site, unit, onSite, onUnit, onBack }: Props) {
  const { sites, alerts } = PORTFOLIO;
  const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

  let rows: JSX.Element[], total: JSX.Element;
  if (!site) {
    const data = sites.map((x) => ({ x, st: stats(alerts.filter((a) => a.site === x.id)) }));
    const mx = Math.max(...data.map((r) => r.st.value)), all = stats(alerts);
    rows = data.map(({ x, st }) => (
      <tr className="site" tabIndex={0} key={x.id} onClick={() => onSite(x.id)} onKeyDown={keyAct(() => onSite(x.id))}>
        <td className="sname"><b>{x.name}</b><span>{x.kind}</span></td><td className="r num">{x.assets.length}</td>
        <td><ValueBar v={st.value} mx={mx} /></td><Kpis st={st} /><td><HealthLinks list={HEALTH_LINKS[x.id]} /></td>
      </tr>
    ));
    total = <tr className="total"><td>All sites</td><td className="r num">{allAssets().length}</td><td><ValueBar v={all.value} /></td><Kpis st={all} /><td /></tr>;
  } else {
    const data = site.units.map((n, i) => ({ u: i + 1, n, na: site.assets.filter((a) => a.unit === i + 1).length, st: stats(alerts.filter((a) => a.site === site.id && a.unit === i + 1)) }));
    const mx = Math.max(...data.map((r) => r.st.value)), tot = stats(alerts.filter((a) => a.site === site.id));
    rows = data.map(({ u, n, na, st }) => (
      <tr className={`site unit${unit === u ? ' sel' : ''}`} tabIndex={0} key={u} onClick={() => onUnit(u)} onKeyDown={keyAct(() => onUnit(u))}>
        <td className="sname"><b>Unit {u}</b><span>{n}</span></td><td className="r num">{na}</td>
        <td><ValueBar v={st.value} mx={mx} /></td><Kpis st={st} /><td><HealthLinks list={HEALTH_LINKS[`${site.id}|${u}`]} /></td>
      </tr>
    ));
    total = <tr className="total"><td>{site.name} total</td><td className="r num">{site.assets.length}</td><td><ValueBar v={tot.value} /></td><Kpis st={tot} /><td /></tr>;
  }

  return (
    <section className="panel" aria-labelledby="sh">
      <div className="panel-head">
        <div>
          <h2 id="sh">{site ? `${site.name} · unit scorecard` : 'Site scorecard'}</h2>
          <p>{site ? `Units of ${site.name} (${site.kind}). Select a unit to filter the page to it.` : 'Select a site to see its units and filter the whole page.'} Green meets target, amber is close (within 5 points, or 6 hours for alert aging), red misses it.</p>
        </div>
        {site && <button type="button" className="chip" onClick={onBack}>← All sites</button>}
      </div>
      <div className="tablewrap">
        <table id="score">
          <thead><tr>
            <th>{site ? 'Unit' : 'Site'}</th><th className="r">Assets<small>monitored</small></th><th>Value realised<small>USD</small></th><th className="r">Alerts<small>raised</small></th>
            <th>Alert aging<small>median time to action · ≤ 24 h</small></th><th>Case closure<small>target ≥ 85%</small></th><th>False positive rate<small>target ≤ 30%</small></th><th>True positive rate<small>target ≥ 70%</small></th><th>Asset health<small>drill down</small></th>
          </tr></thead>
          <tbody>{rows}{total}</tbody>
        </table>
      </div>
    </section>
  );
}
