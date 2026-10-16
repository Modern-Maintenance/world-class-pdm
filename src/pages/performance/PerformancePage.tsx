import { Link, useParams } from 'react-router-dom';
import { TRAINS } from '../../data/healthSim';

/** Placeholder for the APO performance dashboard. The Performance button on asset health links here. */
export function PerformancePage() {
  const { trainId = 'trainA' } = useParams();
  return (
    <div className="perfwrap">
      <Link className="inlink" to={`/health/${trainId}`}>← Back to asset health</Link>
      <div className="eyebrow-p">APO · Performance optimisation</div>
      <h1>Performance · {TRAINS[trainId]?.title ?? 'Train'}</h1>
      <div className="perfph">
        <svg viewBox="0 0 120 60" width={120} height={60} aria-hidden="true"><path d="M6 50 L36 30 L58 38 L84 14 L114 20" fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" /></svg>
        <h2>Performance dashboard is not built yet</h2>
        <p>This view is reserved for the APO performance dashboard of this train. The link from asset health is already in place, so the dashboard can be added here later without changing the navigation.</p>
      </div>
    </div>
  );
}
