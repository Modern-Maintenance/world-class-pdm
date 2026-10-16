import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { EQ, MODELS, N, TRAINS, tLabel, tick } from '../../data/healthSim';
import { AssetTree } from './AssetTree';
import { HealthContext } from './context';

/** Shell for asset health: hierarchy sidebar + header + the train overview or equipment detail (child routes). */
export function HealthLayout() {
  const [live, setLive] = useState(true);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [, section, id] = pathname.split('/');
  const tag = section === 'equipment' ? decodeURIComponent(id) : null;
  const trainId = tag ? EQ[tag]?.train : id;

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (!document.hidden) { tick(); setVersion((v) => v + 1); } }, 3000);
    return () => clearInterval(t);
  }, [live]);

  const selectModel = useCallback((t: string, m: string) => setSelected((s) => ({ ...s, [t]: m })), []);
  const openEquipment = useCallback((t: string) => navigate(`/equipment/${t}`), [navigate]);
  const openModel = useCallback((m: string) => { const t = MODELS[m].eq; setSelected((s) => ({ ...s, [t]: m })); navigate(`/equipment/${t}`); }, [navigate]);

  if (!trainId || !TRAINS[trainId]) return <div className="wrap"><p>Unknown train or equipment. <Link to="/health/trainA">Open Train A</Link></p></div>;
  const title = tag ? `${tag} · ${EQ[tag].desc}` : TRAINS[trainId].title;

  return (
    <HealthContext.Provider value={{ version, selected, selectModel, openEquipment, openModel }}>
      <div className="shell">
        <AssetTree currentTrain={trainId} currentTag={tag} />
        <div className="wrap" id="app">
          <header className="top">
            <div>
              <Link className="back" to="/" style={{ fontSize: '.84rem', marginBottom: 6 }}>← Portfolio overview</Link>
              <div className="eyebrow">World Class PdM · Asset &amp; model health</div>
              <h1>{title}</h1>
              <div className="meta"><span>Site A · Gas processing plant</span><span>Last scored {tLabel(N - 1)}</span><span className="sample">Simulated live data</span></div>
            </div>
            <div className="hdr-actions">
              <Link className="perfbtn" to={`/performance/${trainId}`} title={`Open the performance dashboard for ${TRAINS[trainId].title}`}>
                <svg viewBox="0 0 16 16" width={15} height={15} aria-hidden="true"><path d="M2 13 L6 8 L9 10 L14 3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>Performance
              </Link>
              <button className="live" type="button" aria-pressed={live} onClick={() => setLive((l) => !l)}><i /><span>{live ? 'Live · updating every 3 s' : 'Paused · select to resume'}</span></button>
            </div>
          </header>
          <main><Outlet /></main>
        </div>
      </div>
    </HealthContext.Provider>
  );
}
