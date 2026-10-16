import { PORTFOLIO, type FaultCase, type RcaStatus } from '../../data/portfolio';

const LAB: Record<RcaStatus, [string, string]> = { no: ['p-no', 'Not started'], open: ['p-open', 'In progress'], done: ['p-done', 'Closed'] };

/** Same asset + same failure mode with two or more fault cases in 12 months. */
export function RecurringTable({ cases }: { cases: FaultCase[] }) {
  const m = new Map<string, { site: string; asset: string; mode: string; mos: number[] }>();
  cases.forEach((c) => { const k = c.site + '|' + c.asset + '|' + c.mode; const o = m.get(k) || { site: c.site, asset: c.asset, mode: c.mode, mos: [] }; o.mos.push(c.mo); m.set(k, o); });
  const list = [...m.values()].filter((x) => x.mos.length >= 2).sort((a, b) => b.mos.length - a.mos.length).map((x) => {
    const so = [...x.mos].sort((a, b) => a - b);
    return { ...x, rca: PORTFOLIO.rca.get(x.site + x.asset + x.mode) ?? 'open', int: Math.round(((so[so.length - 1] - so[0]) * 30.4) / (so.length - 1)) };
  });
  const nNo = list.filter((x) => x.rca === 'no').length, reps = list.reduce((a, x) => a + x.mos.length, 0);

  return (
    <section className="panel" aria-labelledby="rh">
      <div className="panel-head"><div><h2 id="rh">Recurring fault diagnostics</h2><p>Same asset and same failure mode with two or more separate fault cases in 12 months. Repeats point to a root cause the repair did not remove.</p></div></div>
      <div className="tablewrap">
        <table id="recur">
          <thead><tr><th>Asset</th><th>Failure mode</th><th>Cases</th><th className="r">Mean interval</th><th>RCA</th></tr></thead>
          <tbody>
            {list.length ? list.slice(0, 10).map((x) => (
              <tr key={x.site + x.asset + x.mode}>
                <td><span className="mono">{x.asset}</span><br /><span className="muted" style={{ fontSize: '.78rem' }}>Site {x.site}</span></td>
                <td>{x.mode}</td>
                <td><span className="occ" aria-hidden="true">{x.mos.map((_, i) => <i key={i} />)}</span> <b className="num">{x.mos.length}×</b></td>
                <td className="r num">{x.int < 15 ? '< 15 d' : x.int + ' d'}</td>
                <td><span className={`pill ${LAB[x.rca][0]}`}>{LAB[x.rca][1]}</span></td>
              </tr>
            )) : <tr><td colSpan={5} className="muted">No recurring faults for this selection.</td></tr>}
          </tbody>
        </table>
      </div>
      {list.length > 0 && (
        <div className="insight"><b>{list.length} recurring asset–fault pairs</b> produced {reps} of {cases.length} fault cases ({Math.round((reps / cases.length) * 100)}%). <b style={{ color: 'var(--crit)' }}>{nNo} have no RCA started.</b>{list.length > 10 ? ' Showing the top 10.' : ''}</div>
      )}
    </section>
  );
}
