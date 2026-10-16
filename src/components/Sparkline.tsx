interface Props {
  values: number[];
  width?: number;
  height?: number;
}

/** Area sparkline that skips non-finite points (months with no data). */
export function Sparkline({ values, width = 200, height = 34 }: Props) {
  const p = 3;
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" />;
  const mn = Math.min(...finite), mx = Math.max(...finite), r = mx - mn || 1;
  const pts = values
    .map((v, i) => (Number.isFinite(v) ? [p + (i * (width - 2 * p)) / (values.length - 1), height - p - ((v - mn) / r) * (height - 2 * p)] : null))
    .filter((q): q is number[] => q !== null);
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${last[0]} ${height} L${pts[0][0]} ${height}Z`} fill="var(--accent-soft)" opacity={0.75} />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill="var(--accent)" />
    </svg>
  );
}
