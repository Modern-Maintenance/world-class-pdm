/** Gas-turbine-driven centrifugal compressor (Trains A and B). */
import { TRAINS } from '../../../data/healthSim';
import { Arrow, Badge, Bearing, Coupling, Kpi, Label, Machine, Poly, Rect, SealGlyph, Shaft, SvgFrame, Thrust, type KpiDef, type SchematicProps } from './parts';

/** Train B uses the same template as Train A with its own tags (first digit + 2) and equipment numbers. */
const tg = (train: string, t: string) => (train === 'trainA' ? t : t.replace(/-(\d)/, (_x, d: string) => '-' + (+d + 2)));
function mid(train: string, id: string) {
  if (train === 'trainA') return id;
  let r = id;
  for (const [role, t] of Object.entries(TRAINS.trainA.map)) r = r.replace(t.replace('-', ''), TRAINS[train].map[role].replace('-', ''));
  return r;
}
const KPIS: KpiDef[] = [
  [150, -52, 130, 'Shaft speed', 'ST-1001', 'K101A-BRG'], [286, -52, 130, 'Power output', 'JT-2001', 'GT101-INL'],
  [150, 0, 130, 'Exhaust temp', 'TE-2100', 'GT101-CMB'], [286, 0, 130, 'Fuel gas flow', 'FT-2010', 'GT101-CMB'],
  [700, -52, 130, 'Inlet flow', 'FT-1001', 'K101A-BRG'], [836, -52, 144, 'Polytropic eff.', 'KPI-ETA', 'K101A-PERF'],
  [700, 0, 130, 'Suction press.', 'PT-1001', 'K101A-PERF'], [836, 0, 144, 'Discharge press.', 'PT-1003', 'K101A-PERF'],
  [502, 398, 124, 'Header press.', 'PT-1102', 'LO101-SYS'], [852, 398, 122, 'DE vent flow', 'FT-1201', 'DGS101-SEAL'],
];

export function Impellers() {
  return <>{[690, 722, 754, 786, 818].map((c) => (
    <path key={c} d={`M${c - 9} 193 L${c - 6} 138 L${c + 5} 138 L${c + 9} 193 Z M${c - 9} 207 L${c - 6} 262 L${c + 5} 262 L${c + 9} 207 Z`} fill="var(--ink)" fillOpacity={0.14} stroke="var(--ink)" strokeOpacity={0.45} />
  ))}</>;
}
/** Centrifugal compressor casing, nozzles, bearings (shaft at y = 200). */
export function CompressorBody({ perf, brg }: { perf: string; brg: string }) {
  return (
    <>
      <Rect m={perf} x={655} y={120} width={200} height={160} rx={14} /><Rect m={perf} x={668} y={86} width={32} height={34} /><Rect m={perf} x={804} y={86} width={32} height={34} />
      <rect x={664} y={82} width={40} height={5} fill="var(--ink)" opacity={0.5} /><rect x={800} y={82} width={40} height={5} fill="var(--ink)" opacity={0.5} />
      <Impellers />
      <Bearing x={618} label="DE" m={brg} /><Bearing x={890} label="" m={brg} /><Thrust x={914} m={brg} />
      <Label x={902} y={238} text="NDE + thrust" />
    </>
  );
}

export function GtcSchematic({ trainId, onOpen, onModel }: SchematicProps) {
  const M = TRAINS[trainId].map, md = (id: string) => mid(trainId, id);
  const blades = [];
  for (let x = 165; x <= 280; x += 14) { const t = 135 + ((x - 150) * 25) / 140; blades.push(<line key={x} x1={x} y1={t + 7} x2={x} y2={400 - t - 7} stroke="var(--ink)" opacity={0.3} />); }
  return (
    <SvgFrame title={TRAINS[trainId].title} height={531}>
      <path className="oil" d="M140 350 H900 M140 350 V219 M375 350 V250 M532 350 V219 M618 350 V219 M900 350 V226 M470 350 V385" />
      <path className="sgas" d="M640 335 H870 M640 335 V217 M870 335 V217 M760 335 V385" />
      <Shaft x1={130} x2={935} y={200} />
      <Arrow d="M2 200 H38" /><text className="slabel" x={4} y={190}>Air</text>
      <Arrow d="M692 52 V82" /><text className="slabel" x={704} y={104}>Suction</text>
      <Arrow d="M830 82 V52" /><text className="slabel" x={842} y={104}>Discharge</text>
      <text className="slabel" x={514} y={104}>Exhaust</text>
      <Coupling x1={548} x2={602} cy={200} /><Label x={575} y={238} text="Coupling" />

      <Machine tag={M.gt} onOpen={onOpen}>
        <Rect m={md('GT101-INL')} x={40} y={120} width={90} height={160} rx={4} />
        {[58, 72, 86, 100, 114].map((x) => <line key={x} x1={x} y1={130} x2={x} y2={270} stroke="var(--ink)" opacity={0.25} />)}
        <Poly points="150,135 290,160 290,240 150,265" />{blades}
        <Rect m={md('GT101-CMB')} x={290} y={155} width={60} height={90} /><Rect m={md('GT101-CMB')} x={300} y={128} width={40} height={27} rx={8} /><Rect m={md('GT101-CMB')} x={300} y={245} width={40} height={27} rx={8} />
        <Poly points="350,160 400,152 400,248 350,240" /><Poly points="400,152 470,135 470,265 400,248" />
        <Rect m={md('GT101-CMB')} x={470} y={120} width={50} height={160} rx={4} /><Rect m={md('GT101-CMB')} x={480} y={60} width={30} height={60} />
        <Label x={85} y={114} text="Inlet filters" halo={false} /><Label x={215} y={172} text="Axial compressor" halo={false} /><Label x={320} y={172} text="Comb." halo={false} /><Label x={436} y={170} text="PT" halo={false} />
        <Bearing x={140} label="Brg 1" m={md('GT101-VIB')} /><Bearing x={375} label="Brg 2" m={md('GT101-VIB')} /><Bearing x={532} label="Brg 3" m={md('GT101-VIB')} />
        <Badge x={160} y={286} tag={M.gt} />
      </Machine>
      <Machine tag={M.comp} onOpen={onOpen}>
        <CompressorBody perf={md('K101A-PERF')} brg={md('K101A-BRG')} />
        <Badge x={648} y={286} tag={M.comp} />
      </Machine>
      <Machine tag={M.dgs} onOpen={onOpen}>
        <SealGlyph x={640} m={md('DGS101-SEAL')} /><SealGlyph x={870} m={md('DGS101-SEAL')} />
        <Label x={640} y={176} text="DGS" halo={false} /><Label x={870} y={176} text="DGS" halo={false} />
        <Rect m={md('DGS101-SEAL')} x={660} y={385} width={322} height={80} rx={4} /><Badge x={672} y={397} tag={M.dgs} halo={false} />
      </Machine>
      <Machine tag={M.lo} onOpen={onOpen}>
        <Rect m={md('LO101-SYS')} x={300} y={385} width={330} height={80} rx={4} /><Badge x={312} y={397} tag={M.lo} halo={false} />
        <rect x={320} y={432} width={64} height={24} rx={3} fill="none" stroke="var(--ink)" opacity={0.4} /><Label x={352} y={448} text="Reservoir" halo={false} />
        <circle cx={408} cy={444} r={10} fill="none" stroke="var(--ink)" opacity={0.4} /><circle cx={436} cy={444} r={10} fill="none" stroke="var(--ink)" opacity={0.4} /><Label x={452} y={448} text="Pumps" halo={false} anchor="start" />
      </Machine>
      {KPIS.map(([x, y, w, l, t, m]) => <Kpi key={l} x={x} y={y} w={w} label={l} tag={tg(trainId, t)} model={md(m)} onModel={onModel} />)}
    </SvgFrame>
  );
}
