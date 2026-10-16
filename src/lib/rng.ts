/** Deterministic pseudo-random generator (mulberry32) so the sample data is identical on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draw using Box–Muller on the given generator. */
export function makeGauss(R: () => number): () => number {
  return () => {
    let u = 0, v = 0;
    while (!u) u = R();
    while (!v) v = R();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/** Weighted random choice. */
export function makePick(R: () => number) {
  return <T,>(arr: T[], w: number[]): T => {
    const t = w.reduce((a, b) => a + b, 0);
    let x = R() * t;
    for (let i = 0; i < arr.length; i++) {
      x -= w[i];
      if (x <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };
}
