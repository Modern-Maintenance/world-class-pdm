/** Motor → coupling → centrifugal pump with API Plan 53A seal support (Trains D and E). */
import { TRAINS } from '../../../data/healthSim';
import { MotorBody } from './MotorParts';
import { Arrow, Badge, Circ, Coupling, Kpi, Label, Machine, Pads, Rect, Shaft, SvgFrame, type KpiDef, type SchematicProps } from './parts';

export function MdpSchematic({ trainId, onOpen, onModel }: SchematicProps) {
  const M = TRAINS[trainId].map, x = M.pump.slice(-1);
  const E = `M401${x}-ELEC`, MB = `M401${x}-BRG`, PB = `P401${x}-BRG`, PH = `P401${x}-HYD`, SL = `SS401${x}-SEAL`, T = (t: string) => t + x;
  const KPIS: KpiDef[] = [
    [90, -52, 130, 'Motor power', T('JT-4000'), E], [226, -52, 130, 'Motor current', T('IT-4000'), E],
    [90, 0, 130, 'Winding temp', T('TE-4001'), E], [226, 0, 130, 'Motor DE vib.', T('VT-4011'), MB],
    [600, -52, 130, 'Flow', T('FT-4031'), PH], [736, -52, 140, 'Discharge press.', T('PT-4033'), PH],
    [600, 0, 130, 'Suction press.', T('PT-4031'), PH], [736, 0, 140, 'NPSH margin', T('KPI-NPSH'), PH],
    [842, 410, 122, 'Seal pot level', T('LT-4041'), SL],
  ];
  const vanes = [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (Math.PI * a) / 180;
    return <path key={a} d={`M${650 + 10 * Math.cos(r)} ${200 + 10 * Math.sin(r)} Q ${650 + 30 * Math.cos(r + 0.5)} ${200 + 30 * Math.sin(r + 0.5)} ${650 + 44 * Math.cos(r + 0.9)} ${200 + 44 * Math.sin(r + 0.9)}`} fill="none" stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1.6} />;
  });
  return (
    <SvgFrame title={TRAINS[trainId].title} height={541}>
      <path className="sgas" d="M540 240 V350 H700 V385 M552 240 V338 H720 V385" />
      <Shaft x1={80} x2={600} y={200} />
      <Arrow d="M650 84 V54" /><text className="slabel" x={662} y={74}>Discharge</text>
      <Arrow d="M858 200 H800" /><text className="slabel" x={806} y={236}>Suction</text>
      <Coupling x1={345} x2={395} cy={200} /><Label x={370} y={238} text="Coupling" />
      <text className="slabel" x={90} y={410}>Motor and pump bearings are oil-bath lubricated; no lube oil console.</text>

      <Machine tag={M.m} onOpen={onOpen}>
        <MotorBody x={90} y={130} w={240} h={140} cy={200} elec={E} brg={MB} tbx={180} />
        <Badge x={100} y={290} tag={M.m} />
      </Machine>
      <Machine tag={M.pump} onOpen={onOpen}>
        <Rect m={PB} x={410} y={165} width={115} height={70} rx={6} /><Pads x={430} cy={200} m={PB} /><Pads x={505} cy={200} m={PB} />
        <Label x={430} y={252} text="Thrust" /><Label x={505} y={252} text="Radial" />
        <Circ m={PH} cx={650} cy={200} r={78} />
        <circle cx={650} cy={200} r={46} fill="var(--ink)" fillOpacity={0.06} stroke="var(--ink)" strokeOpacity={0.35} />{vanes}
        <Rect m={PH} x={630} y={86} width={40} height={40} /><rect x={624} y={82} width={52} height={5} fill="var(--ink)" opacity={0.5} />
        <Rect m={PH} x={726} y={180} width={70} height={40} /><rect x={794} y={174} width={5} height={52} fill="var(--ink)" opacity={0.5} />
        <Badge x={590} y={300} tag={M.pump} />
      </Machine>
      <Machine tag={M.seal} onOpen={onOpen}>
        <Rect m={SL} x={528} y={160} width={34} height={80} rx={3} />
        <line x1={528} y1={178} x2={562} y2={196} stroke="var(--ink)" opacity={0.45} /><line x1={528} y1={204} x2={562} y2={222} stroke="var(--ink)" opacity={0.45} />
        <Label x={545} y={150} text="Seal" />
        <Rect m={SL} x={600} y={385} width={370} height={90} rx={4} /><Badge x={612} y={397} tag={M.seal} halo={false} />
        <rect x={700} y={428} width={26} height={40} rx={12} fill="none" stroke="var(--ink)" strokeOpacity={0.5} />
        <rect x={702} y={446} width={22} height={20} rx={9} fill="var(--accent)" fillOpacity={0.35} />
        <text className="slabel" x={734} y={452}>Seal pot</text>
      </Machine>
      {KPIS.map(([kx, ky, w, l, t, m]) => <Kpi key={l} x={kx} y={ky} w={w} label={l} tag={t} model={m} onModel={onModel} />)}
    </SvgFrame>
  );
}
