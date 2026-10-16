/** Motor → speed-increasing gearbox → centrifugal compressor (Train C). */
import { TRAINS } from '../../../data/healthSim';
import { CompressorBody } from './GtcSchematic';
import { MotorBody } from './MotorParts';
import { Arrow, Badge, Coupling, Kpi, Label, Machine, Pads, Rect, SealGlyph, Shaft, SvgFrame, type KpiDef, type SchematicProps } from './parts';

const KPIS: KpiDef[] = [
  [60, -52, 130, 'Motor power', 'JT-1300', 'M130-ELEC'], [196, -52, 130, 'Motor current', 'IT-1300', 'M130-ELEC'],
  [60, 0, 130, 'Winding temp', 'TE-1301', 'M130-ELEC'], [196, 0, 130, 'Output speed', 'ST-1301', 'K130-BRG'],
  [700, -52, 130, 'Inlet flow', 'FT-1301', 'K130-BRG'], [836, -52, 144, 'Polytropic eff.', 'KPI-ETA13', 'K130-PERF'],
  [700, 0, 130, 'Suction press.', 'PT-1301', 'K130-PERF'], [836, 0, 144, 'Discharge press.', 'PT-1303', 'K130-PERF'],
  [502, 418, 124, 'Header press.', 'PT-1352', 'LO130-SYS'], [852, 418, 122, 'DE vent flow', 'FT-1361', 'DGS130-SEAL'],
];

export function MdcSchematic({ trainId, onOpen, onModel }: SchematicProps) {
  const M = TRAINS[trainId].map, GB = 'GB130-MECH';
  return (
    <SvgFrame title={TRAINS[trainId].title} height={551}>
      <path className="oil" d="M470 380 H900 M470 380 V350 M618 380 V219 M900 380 V226 M470 380 V405" />
      <path className="sgas" d="M640 365 H870 M640 365 V217 M870 365 V217 M760 365 V405" />
      <Shaft x1={60} x2={435} y={272} /><Shaft x1={435} x2={935} y={200} />
      <Arrow d="M692 52 V82" /><text className="slabel" x={704} y={104}>Suction</text>
      <Arrow d="M830 82 V52" /><text className="slabel" x={842} y={104}>Discharge</text>
      <Coupling x1={298} x2={346} cy={272} /><Label x={322} y={306} text="Coupling" />
      <Coupling x1={540} x2={594} cy={200} /><Label x={567} y={238} text="Coupling" />

      <Machine tag={M.m} onOpen={onOpen}>
        <MotorBody x={70} y={207} w={220} h={130} cy={272} elec="M130-ELEC" brg="M130-BRG" tbx={150} />
        <Badge x={80} y={352} tag={M.m} />
      </Machine>
      <Machine tag={M.gb} onOpen={onOpen}>
        <Rect m={GB} x={352} y={140} width={166} height={210} rx={8} />
        <circle cx={435} cy={272} r={46} fill="none" stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="4 3" />
        <circle cx={435} cy={200} r={22} fill="none" stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="3 3" />
        <Pads x={372} cy={272} m={GB} /><Pads x={498} cy={272} m={GB} /><Pads x={372} cy={200} m={GB} /><Pads x={498} cy={200} m={GB} />
        <Label x={435} y={168} text="HS pinion" halo={false} /><Label x={435} y={336} text="LS gear" halo={false} />
        <Badge x={352} y={104} tag={M.gb} />
      </Machine>
      <Machine tag={M.comp} onOpen={onOpen}>
        <CompressorBody perf="K130-PERF" brg="K130-BRG" />
        <Badge x={648} y={286} tag={M.comp} />
      </Machine>
      <Machine tag={M.dgs} onOpen={onOpen}>
        <SealGlyph x={640} m="DGS130-SEAL" /><SealGlyph x={870} m="DGS130-SEAL" />
        <Label x={640} y={176} text="DGS" halo={false} /><Label x={870} y={176} text="DGS" halo={false} />
        <Rect m="DGS130-SEAL" x={660} y={405} width={322} height={80} rx={4} /><Badge x={672} y={417} tag={M.dgs} halo={false} />
      </Machine>
      <Machine tag={M.lo} onOpen={onOpen}>
        <Rect m="LO130-SYS" x={300} y={405} width={330} height={80} rx={4} /><Badge x={312} y={417} tag={M.lo} halo={false} />
        <rect x={320} y={452} width={64} height={24} rx={3} fill="none" stroke="var(--ink)" opacity={0.4} /><Label x={352} y={468} text="Reservoir" halo={false} />
        <circle cx={408} cy={464} r={10} fill="none" stroke="var(--ink)" opacity={0.4} /><circle cx={436} cy={464} r={10} fill="none" stroke="var(--ink)" opacity={0.4} /><Label x={452} y={468} text="Pumps" halo={false} anchor="start" />
      </Machine>
      {KPIS.map(([x, y, w, l, t, m]) => <Kpi key={l} x={x} y={y} w={w} label={l} tag={t} model={m} onModel={onModel} />)}
    </SvgFrame>
  );
}
