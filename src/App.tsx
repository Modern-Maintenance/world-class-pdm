import { useEffect } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PortfolioPage } from './pages/portfolio/PortfolioPage';
import { QueuePage } from './pages/queue/QueuePage';
import { HealthLayout } from './pages/health/HealthLayout';
import { TrainOverview } from './pages/health/TrainOverview';
import { EquipmentDetail } from './pages/health/EquipmentDetail';
import { PerformancePage } from './pages/performance/PerformancePage';

/** App shell: sticky app bar + four views. Each view keeps its prototype page id so the carried-over CSS applies. */
export function App() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[1];
  useEffect(() => { window.scrollTo(0, 0); }, [section]);
  const healthActive = section === 'health' || section === 'equipment' || section === 'performance';

  return (
    <>
      <nav className="appbar" aria-label="Main">
        <NavLink className="brand" to="/"><i /><span>World Class PdM</span></NavLink>
        <div className="tabsnav">
          <NavLink to="/" end>Portfolio</NavLink>
          <NavLink to="/queue">Alert queue</NavLink>
          <Link to="/health/trainA" aria-current={healthActive ? 'page' : undefined}>Asset health · Site A</Link>
        </div>
        <span className="appmeta">Sample data</span>
      </nav>
      <Routes>
        <Route path="/" element={<section id="pg-portfolio" className="page"><PortfolioPage /></section>} />
        <Route path="/queue" element={<section id="pg-queue" className="page"><QueuePage /></section>} />
        <Route element={<section id="pg-health" className="page"><HealthLayout /></section>}>
          <Route path="/health/:trainId" element={<TrainOverview />} />
          <Route path="/equipment/:tag" element={<EquipmentDetail />} />
        </Route>
        <Route path="/performance/:trainId" element={<section id="pg-perf" className="page"><PerformancePage /></section>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
