import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PORTFOLIO, allAssets, type SiteId } from '../../data/portfolio';
import { KpiTiles } from './KpiTiles';
import { Scorecard } from './Scorecard';
import { ParetoChart } from './ParetoChart';
import { FaultChart } from './FaultChart';
import { RecurringTable } from './RecurringTable';

export function PortfolioPage() {
  const [sel, setSel] = useState<SiteId | 'all'>('all');
  const [unit, setUnit] = useState<number | 'all'>('all');
  const site = PORTFOLIO.sites.find((s) => s.id === sel);
  const inSel = (x: { site: SiteId; unit: number }) => (sel === 'all' || x.site === sel) && (unit === 'all' || x.unit === unit);

  const alerts = useMemo(() => PORTFOLIO.alerts.filter(inSel), [sel, unit]); // eslint-disable-line react-hooks/exhaustive-deps
  const cases = useMemo(() => PORTFOLIO.cases.filter(inSel), [sel, unit]); // eslint-disable-line react-hooks/exhaustive-deps
  const monitored = allAssets().filter(inSel).length;
  const pickSite = (id: SiteId | 'all') => { setSel(id); setUnit('all'); };
  const scopeLabel = sel === 'all' ? 'across all sites' : `at ${site!.name}${unit !== 'all' ? ', Unit ' + unit : ''}`;

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="eyebrow">World Class PdM · Predictive analytics portfolio</div>
          <h1>World Class PdM Portfolio</h1>
          <div className="meta"><span>5 sites · rotating equipment fleet</span><span>Last 12 months: Oct 2025 – Sep 2026</span><span className="sample">Sample data</span></div>
        </div>
        <nav className="drill" aria-label="Drill-down dashboards">
          <Link to="/queue">Alert action queue →</Link>
          <Link to="/health/trainA">Site A · Train A health →</Link>
        </nav>
      </header>

      <div className="filters" role="group" aria-label="Site filter">
        <span className="lbl">Site</span>
        <span className="filters">
          {(['all', ...PORTFOLIO.sites.map((s) => s.id)] as (SiteId | 'all')[]).map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={sel === id} onClick={() => pickSite(id)}>{id === 'all' ? 'All sites' : `Site ${id}`}</button>
          ))}
        </span>
        <span className="period">{site ? `${site.name} · ${site.kind}${unit !== 'all' ? ` · Unit ${unit} · ${site.units[unit - 1]}` : ''} · ${monitored} assets monitored` : `All 5 sites · ${monitored} assets monitored`}</span>
      </div>
      {site && (
        <div className="filters" role="group" aria-label="Unit filter">
          <span className="lbl">Unit</span>
          <span className="filters">
            <button type="button" className="chip" aria-pressed={unit === 'all'} onClick={() => setUnit('all')}>All units</button>
            {site.units.map((n, i) => (
              <button key={n} type="button" className="chip" title={n} aria-pressed={unit === i + 1} onClick={() => setUnit(i + 1)}>Unit {i + 1}</button>
            ))}
          </span>
        </div>
      )}

      <KpiTiles alerts={alerts} />
      <Scorecard site={site} unit={unit} onSite={(id) => pickSite(id as SiteId)} onUnit={(u) => setUnit(unit === u ? 'all' : u)} onBack={() => pickSite('all')} />
      <ParetoChart cases={cases} scopeLabel={scopeLabel} monitored={monitored} />
      <div className="grid2">
        <FaultChart cases={cases} />
        <RecurringTable cases={cases} />
      </div>

      <details className="defs">
        <summary>KPI definitions</summary>
        <div className="defgrid">
          <div><b>Value realised (USD)</b>Avoided cost from validated catches whose case is closed and confirmed by as-found condition: avoided production loss plus the reactive-repair premium over planned repair.</div>
          <div><b>Alert aging</b><code>median(first action time − alert raised time)</code> over alerts that have been acted on. First action is the first acknowledge, validate or reject by an engineer. Target ≤ 24 h. The tile also counts open alerts with no action for more than 3 days.</div>
          <div><b>Case closure ratio</b><code>closed cases ÷ cases opened</code>. A case opens when a validated alert is actioned. Recent months are naturally lower because work is still in progress.</div>
          <div><b>False positive rate</b><code>alerts rejected as a model or data issue ÷ reviewed alerts</code>. Causes include drifted baselines, bad or frozen sensors and untrained operating modes. Open alerts are excluded.</div>
          <div><b>True positive rate</b><code>alerts confirmed as a genuine equipment or process deviation ÷ reviewed alerts</code>. A genuine deviation need not end in a failure; developing faults and abnormal operation both count. With only these two outcomes, true positive rate + false positive rate = 100%.</div>
          <div><b>Bad actor Pareto</b>Assets ranked by validated fault cases or by value at stake (avoided cost of those cases). One fault case can raise several alerts, so cases rather than alerts are counted. The vital few are the assets that together make up 80% of the total.</div>
        </div>
      </details>
    </div>
  );
}
