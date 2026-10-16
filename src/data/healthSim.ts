/**
 * Live simulation of model scoring for the asset-health views.
 * Each model compares actual sensor values with its predictions; residuals become an anomaly score and a 0–100 anomaly index.
 * In production, replace tick() with polling PI Web API (predicted + actual streams) and the model scores the engine writes back.
 */
import { makeGauss, mulberry32 } from '../lib/rng';
import { CATALOGUE, type SensorSeed, type Train, type TrainType } from './healthCatalogue';
import { riskScore } from './queue';

export const N = 180;          // points in the 30-day window
export const STEP_H = 4;       // hours per point
export const WATCH = 0.8;      // anomaly-score watch threshold
export const ALERT = 1.2;      // anomaly-score alert threshold
const END0 = new Date('2026-10-08T08:00:00+04:00').getTime();

export interface Sensor extends SensorSeed { ph: number; p: number[]; a: number[]; c: number; pct: number; am: number; pm: number }
export interface ModelAlert { id: string; fm: string; iso: string; sev: 1 | 2 | 3 | 4; conf: number; ttf: number; var: number; state: string; notif: string; owner: string; acts: string[] }
export interface Model {
  id: string; eq: string; train: string; name: string; type: string; trained: string;
  alert?: ModelAlert | null; note?: string; stale?: boolean; sensors: Sensor[];
  sm: number[]; score: number; health: number; hs: number[]; ranked: Sensor[]; alertIdx: number;
}
export interface Equipment { tag: string; desc: string; crit: 'A' | 'B' | 'C'; train: string; models: string[] }
export type { Train, TrainType };

const R = mulberry32(20261008), gauss = makeGauss(R);
export const MODELS = CATALOGUE.MODELS as Record<string, Model>;
export const EQ = CATALOGUE.EQ as Record<string, Equipment>;
export const TRAINS = CATALOGUE.TRAINS;
Object.entries(EQ).forEach(([tag, e]) => { e.tag = tag; e.models = []; });
Object.entries(MODELS).forEach(([id, m]) => { m.id = id; m.train = EQ[m.eq].train; EQ[m.eq].models.push(id); });

let G = 0;
const drift = (s: Sensor, t: number) => {
  if (!s.dz) return 0;
  const t0 = s.start * (N - 1), te = N - 1;
  if (t < t0) return 0;
  return s.dz * 3 * s.noise * Math.min(Math.pow((t - t0) / (te - t0), 1.6), 1.15);
};
const sample = (s: Sensor, t: number): [number, number] => {
  const p = s.base + s.amp * s.noise * Math.sin((2 * Math.PI * t) / 42 + s.ph);
  return [p, p + gauss() * s.noise + drift(s, t)];
};
/** Anomaly index: 0 = normal, 100 = worst. */
const indexFrom = (e: number) => Math.round(100 - 100 / (1 + 0.6 * Math.pow(e, 1.6)));

function compute(m: Model) {
  m.sm = [];
  let e: number | null = null;
  for (let i = 0; i < N; i++) {
    let s2 = 0;
    m.sensors.forEach((s) => { const z = (s.a[i] - s.p[i]) / (3 * s.noise); s2 += z * z; });
    const r = Math.sqrt(s2 / m.sensors.length);
    e = e === null ? r : e + 0.12 * (r - e);
    m.sm.push(e);
  }
  m.score = e!; m.health = indexFrom(e!); m.hs = m.sm.map(indexFrom);
  let tot = 0;
  m.sensors.forEach((s) => {
    let a = 0, ap = 0, pp = 0;
    for (let i = N - 12; i < N; i++) { const z = (s.a[i] - s.p[i]) / (3 * s.noise); a += z * z; ap += s.a[i]; pp += s.p[i]; }
    s.c = a / 12; s.am = ap / 12; s.pm = pp / 12; tot += s.c;
  });
  m.sensors.forEach((s) => (s.pct = tot ? (s.c / tot) * 100 : 0));
  m.ranked = [...m.sensors].sort((x, y) => y.pct - x.pct);
  m.alertIdx = m.sm.findIndex((v) => v > ALERT);
}

// Initial 30-day history
Object.values(MODELS).forEach((m) => m.sensors.forEach((s) => {
  s.ph = R() * 6.28; s.p = []; s.a = [];
  for (let i = 0; i < N; i++) { const [p, a] = sample(s, i); s.p.push(p); s.a.push(a); }
  if (s.stale) { const v = s.a[N - 15]; for (let i = N - 14; i < N; i++) s.a[i] = v; }
}));
Object.values(MODELS).forEach(compute);

/** Advance the simulation by one step (4 hours of plant time). */
export function tick() {
  G++;
  const t = G + N - 1;
  Object.values(MODELS).forEach((m) => {
    m.sensors.forEach((s) => {
      s.p.shift(); s.a.shift();
      const [p, a] = sample(s, t);
      s.p.push(p); s.a.push(s.stale ? s.a[s.a.length - 1] : a);
    });
    compute(m);
  });
}

// ---------- helpers ----------
export type Band = 'good' | 'med' | 'high' | 'crit';
export const band = (h: number): [Band, string] => (h < 20 ? ['good', 'Normal'] : h < 40 ? ['med', 'Watch'] : h < 60 ? ['high', 'Warning'] : ['crit', 'Critical']);
export const col = (k: string) => `var(--${k})`;
export const tAt = (i: number) => new Date(END0 + (G - (N - 1 - i)) * STEP_H * 3600e3);
export const dLabel = (i: number) => tAt(i).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export const tLabel = (i: number) => tAt(i).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const modelRisk = (m: Model) => (m.alert ? riskScore({ crit: EQ[m.eq].crit, sev: m.alert.sev, conf: m.alert.conf, ttf: m.alert.ttf }) : null);

/** Equipment status = worst running model; null when every model has stale inputs. */
export function eqHealth(tag: string): { h: number | null; stale: boolean; alert: boolean } {
  const ms = EQ[tag].models.map((id) => MODELS[id]);
  const run = ms.filter((m) => !m.stale);
  if (!run.length) return { h: null, stale: true, alert: false };
  return { h: Math.max(...run.map((m) => m.health)), stale: ms.some((m) => m.stale), alert: ms.some((m) => !!m.alert) };
}
export const defaultModel = (tag: string) => {
  const ms = EQ[tag].models.map((id) => MODELS[id]);
  return (ms.find((m) => m.alert) || [...ms].sort((a, b) => b.health - a.health)[0]).id;
};
export const sensorDev = (s: Sensor): { z: number | null; k: Band | 'stale' } => {
  if (s.stale) return { k: 'stale', z: null };
  let z = 0;
  for (let i = N - 3; i < N; i++) z += Math.abs(s.a[i] - s.p[i]) / s.noise;
  z /= 3;
  return { z, k: z < 2 ? 'good' : z < 3 ? 'med' : z < 4.5 ? 'high' : 'crit' };
};
export function nice(span: number, n: number) {
  const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 3.5 ? 2.5 : f < 7 ? 5 : 10) * p;
}
