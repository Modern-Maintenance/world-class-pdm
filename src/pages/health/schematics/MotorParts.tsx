import { Label, Pads, Rect } from './parts';

/** Induction motor: fan cowl, finned frame, terminal box, NDE/DE bearings. */
export function MotorBody({ x, y, w, h, cy, elec, brg, tbx }: { x: number; y: number; w: number; h: number; cy: number; elec: string; brg: string; tbx: number }) {
  const fins = [];
  for (let fx = x + 30; fx <= x + w - 30; fx += 16) fins.push(<line key={fx} x1={fx} y1={y + 8} x2={fx} y2={y + h - 8} stroke="var(--ink)" opacity={0.18} />);
  return (
    <>
      <Rect m={elec} x={x - 20} y={cy - 47} width={20} height={94} rx={4} />
      <Rect m={elec} x={x} y={y} width={w} height={h} rx={10} />
      {fins}
      <Rect m={elec} x={tbx} y={y - 25} width={60} height={25} rx={2} />
      <Pads x={x + 18} cy={cy} m={brg} /><Pads x={x + w - 18} cy={cy} m={brg} />
      <Label x={x + 18} y={cy + 38} text="NDE" /><Label x={x + w - 18} y={cy + 38} text="DE" />
      <text className="slabel" x={x - 10} y={cy - 54} textAnchor="middle">Fan</text>
    </>
  );
}
