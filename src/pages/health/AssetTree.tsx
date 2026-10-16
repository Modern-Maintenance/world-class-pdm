import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EQ, MODELS, TRAINS } from '../../data/healthSim';
import { useHealth } from './context';

/** Unit · system headings → trains → equipment (subunits indented). Red dot = active alert on it or below it. */
interface EqNode { tag: string; kids: EqNode[] }
interface TrainNode { id: string; kids: EqNode[] }
const eqN = (tag: string, kids: EqNode[] = []): EqNode => ({ tag, kids });
function trainNode(id: string): TrainNode {
  const T = TRAINS[id], mp = T.map;
  if (T.type === 'mdp') return { id, kids: [eqN(mp.m), eqN(mp.pump, [eqN(mp.seal)])] };
  const comp = eqN(mp.comp, [eqN(mp.lo), eqN(mp.dgs)]);
  return { id, kids: T.type === 'mdc' ? [eqN(mp.m), eqN(mp.gb), comp] : [eqN(mp.gt), comp] };
}
/** Site A hierarchy. Full ISO 14224 path: Site → Unit → System → Train → Equipment → Subunit. */
export const HIERARCHY = [
  { unit: 'Gas Compression Unit', short: 'Gas compression', systems: [
    { name: 'Export Compression', short: 'Export', trains: ['trainA', 'trainB'] },
    { name: 'Booster Compression', short: 'Booster', trains: ['trainC'] }] },
  { unit: 'Condensate Stabilisation Unit', short: 'Condensate', systems: [
    { name: 'Condensate Export', short: 'Export pumps', trains: ['trainD', 'trainE'] }] },
];
const CFG: Record<string, string> = { gtc: 'GT · compressor', mdc: 'Motor · gearbox · compressor', mdp: 'Motor · pump' };
const ICONS: Record<string, JSX.Element> = {
  GT: <path d="M2 5.5 L14 2 L14 14 L2 10.5 Z" />,
  K: <path d="M2 2 L14 5.5 L14 10.5 L2 14 Z" />,
  M: <><rect x={1.5} y={4} width={11} height={8} rx={2} /><path d="M12.5 8 H15" /></>,
  GB: <><circle cx={6} cy={10} r={4} /><circle cx={11.5} cy={4.5} r={2.5} /></>,
  P: <><circle cx={7.5} cy={9} r={5} /><path d="M7.5 4 V1.5 M12.5 9 H15" /></>,
  LO: <path d="M8 1.8 C5.5 6 4.2 8.2 4.2 10.4 a3.8 3.8 0 0 0 7.6 0 C11.8 8.2 10.5 6 8 1.8 Z" />,
  SEAL: <><rect x={5} y={2} width={6} height={12} rx={1} /><path d="M5 6 L11 9 M5 10 L11 13" /></>,
};
const iconKey = (t: string) => (t.startsWith('GT-') ? 'GT' : t.startsWith('GB-') ? 'GB' : t.startsWith('LO-') ? 'LO' : /^(DGS|SS)-/.test(t) ? 'SEAL' : t.startsWith('K-') ? 'K' : t.startsWith('M-') ? 'M' : 'P');
const eqAlerts = (n: EqNode): number => EQ[n.tag].models.filter((id) => MODELS[id].alert).length + n.kids.reduce((s, k) => s + eqAlerts(k), 0);
const trainAlerts = (t: TrainNode) => t.kids.reduce((s, k) => s + eqAlerts(k), 0);
const Dot = ({ a }: { a: number }) => <span className="dot" style={{ background: a ? 'var(--crit)' : 'var(--good)' }} title={a ? `${a} active alert${a > 1 ? 's' : ''}` : 'No active alerts'} />;

export function AssetTree({ currentTrain, currentTag }: { currentTrain: string; currentTag: string | null }) {
  useHealth(); // re-render on simulation ticks
  const navigate = useNavigate();
  const [open, setOpen] = useState<Set<string>>(new Set([currentTrain]));
  const [filter, setFilter] = useState<'all' | 'alerts'>('all');
  const [collapsed, setCollapsed] = useState(true); // narrow screens only
  useEffect(() => { setOpen((o) => new Set(o).add(currentTrain)); }, [currentTrain]);

  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const showAlertsOnly = () => {
    setFilter('alerts');
    setOpen((o) => { const n = new Set(o); Object.keys(TRAINS).forEach((t) => { if (trainAlerts(trainNode(t))) n.add(t); }); return n; });
  };
  const go = (path: string) => { navigate(path); if (window.matchMedia('(max-width:900px)').matches) setCollapsed(true); };
  const activeRow = currentTag ? 'eq-' + currentTag : currentTrain;

  const eqRow = (n: EqNode, d: number): JSX.Element[] => {
    if (filter === 'alerts' && !eqAlerts(n)) return [];
    const e = EQ[n.tag];
    return [
      <li role="treeitem" key={n.tag}>
        <div className={`trow${activeRow === 'eq-' + n.tag ? ' active' : ''}`} style={{ ['--d' as string]: d }}>
          <span className="caret sp" />
          <button className="tlabel" type="button" title={`${n.tag} · ${e.desc}`} onClick={() => go(`/equipment/${n.tag}`)}>
            <Dot a={eqAlerts(n)} />
            <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true">{ICONS[iconKey(n.tag)]}</svg>
            <span className="tn"><span className="mono">{n.tag}</span><span className="ds">{e.desc}</span></span>
          </button>
        </div>
      </li>,
      ...n.kids.flatMap((k) => eqRow(k, d + 1)),
    ];
  };

  const rows: JSX.Element[] = [];
  HIERARCHY.forEach((u) => u.systems.forEach((sys) => {
    const trains = sys.trains.map(trainNode).filter((t) => filter === 'all' || trainAlerts(t) > 0);
    if (!trains.length) return;
    rows.push(<li className="tgrp" role="presentation" key={sys.name}>{u.short} · {sys.short}</li>);
    trains.forEach((t) => {
      const a = trainAlerts(t), isOpen = open.has(t.id), T = TRAINS[t.id];
      rows.push(
        <li role="treeitem" aria-expanded={isOpen} key={t.id}>
          <div className={`trow${activeRow === t.id ? ' active' : ''}`}>
            <button className="caret" type="button" aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${T.name}`} onClick={() => toggle(t.id)}><span>▸</span></button>
            <button className="tlabel" type="button" title={T.title} onClick={() => { setOpen((o) => new Set(o).add(t.id)); go(`/health/${t.id}`); }}>
              <Dot a={a} />
              <span className="tn"><b>{T.name}</b><span className="cfg">{CFG[T.type || 'gtc']}</span></span>
              {a > 0 && <span className="ac" title={`${a} active alert${a > 1 ? 's' : ''}`}>{a}</span>}
            </button>
          </div>
        </li>,
      );
      if (isOpen) t.kids.forEach((k) => rows.push(...eqRow(k, 1)));
    });
  }));

  return (
    <aside className={`tree${collapsed ? ' collapsed' : ''}`} aria-label="Asset hierarchy">
      <div className="thead">
        <div><div className="eyebrow">Asset hierarchy</div><div className="tsub">Site A · trains and equipment</div></div>
        <button className="ttoggle" type="button" aria-expanded={!collapsed} onClick={() => setCollapsed((c) => !c)}>{collapsed ? 'Show' : 'Hide'}</button>
      </div>
      <div className="tfilter" role="group" aria-label="Tree filter">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
        <button type="button" aria-pressed={filter === 'alerts'} onClick={showAlertsOnly}>Alerts only</button>
      </div>
      <ul className="tbody" role="tree">{rows.length ? rows : <li className="tempty">No active alerts. All equipment is running without alerts.</li>}</ul>
      <div className="tlegend">
        <span><i style={{ background: 'var(--crit)' }} />Active alert on it or below it</span>
        <span><i style={{ background: 'var(--good)' }} />No active alerts</span>
        <span>Number on a train = active alerts</span>
      </div>
    </aside>
  );
}

/** Breadcrumb path for an equipment tag. */
export function pathFor(tag: string): { unit: string; system: string; train: string } | null {
  for (const u of HIERARCHY) for (const s of u.systems) for (const t of s.trains) {
    const all: string[] = [];
    const walk = (n: EqNode) => { all.push(n.tag); n.kids.forEach(walk); };
    trainNode(t).kids.forEach(walk);
    if (all.includes(tag)) return { unit: u.unit, system: s.name, train: t };
  }
  return null;
}
