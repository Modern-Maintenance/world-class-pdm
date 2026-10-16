/**
 * Portfolio sample data: 5 sites × 6 units, 12 months of alerts, fault cases and failures.
 * Replace generate() with API calls when wiring to the real alert store (PostgreSQL) and SAP PM.
 */
import { makeGauss, makePick, mulberry32 } from '../lib/rng';

export type SiteId = 'A' | 'B' | 'C' | 'D' | 'E';
export type EquipClass = 'CC' | 'GT' | 'RC' | 'PU' | 'EM';
export type Disposition = 'val' | 'rej' | 'open';

export interface Asset { tag: string; cls: EquipClass; site: SiteId; unit: number; w: number; chronic?: string; k?: number }
export interface Site {
  id: SiteId; name: string; kind: string; units: string[];
  n: Record<EquipClass, number>; alerts: number; prec: number; tpr: number; fails: number; act: number; tta: number;
  bad: [string, string, number][]; assets: Asset[];
}
export interface FaultCase { site: SiteId; asset: string; cls: EquipClass; mode: string; mo: number; acted: boolean; closed: boolean; value: number; unit: number }
export interface Alert {
  site: SiteId; mo: number; asset: string; cls: EquipClass; mode: string; disp: Disposition;
  acted: boolean; closed: boolean; value: number; caseRef?: FaultCase; unit: number;
  tta?: number; raisedH?: number; age?: number;
}
export interface Failure { site: SiteId; mo: number; det: boolean }
export type RcaStatus = 'no' | 'open' | 'done';

export const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const CLS: Record<EquipClass, { pre: string; val: number; modes: string[] }> = {
  CC: { pre: 'K-', val: 230000, modes: ['Journal bearing degradation', 'Dry gas seal leakage', 'Impeller fouling', 'Anti-surge valve fault', 'Lube oil system degradation'] },
  GT: { pre: 'GT-', val: 260000, modes: ['Inlet filter fouling', 'Combustion temperature spread', 'Axial compressor fouling', 'Journal bearing degradation'] },
  RC: { pre: 'K-', val: 85000, modes: ['Valve leakage', 'Rider band wear', 'Packing leakage'] },
  PU: { pre: 'P-', val: 38000, modes: ['Mechanical seal leakage', 'Cavitation', 'Rolling bearing wear', 'Misalignment'] },
  EM: { pre: 'M-', val: 26000, modes: ['Stator winding overheating', 'Rolling bearing wear', 'Cooling degradation'] },
};
/** Failure modes whose models are known to be noisy (lower precision). */
const LOWP: Record<string, number> = { Cavitation: 0.42, 'Stator winding overheating': 0.48, 'Anti-surge valve fault': 0.5, 'Cooling degradation': 0.55 };

type SiteSeed = Omit<Site, 'assets'>;
const SITE_SEEDS: SiteSeed[] = [
  { id: 'A', name: 'Site A', units: ['Gas compression', 'Dehydration', 'NGL recovery', 'Condensate stabilisation', 'Utilities', 'Power generation'], kind: 'Gas processing plant', n: { CC: 8, GT: 4, RC: 3, PU: 28, EM: 14 }, alerts: 430, prec: 0.74, tpr: 0.84, fails: 31, act: 0.88, tta: 14,
    bad: [['K-101A', 'Journal bearing degradation', 4], ['P-205B', 'Mechanical seal leakage', 5], ['GT-101', 'Inlet filter fouling', 3]] },
  { id: 'B', name: 'Site B', units: ['Separation', 'Gas compression', 'Water injection', 'Gas lift', 'Utilities', 'Power generation'], kind: 'Offshore platform', n: { CC: 6, GT: 5, RC: 4, PU: 30, EM: 12 }, alerts: 410, prec: 0.62, tpr: 0.71, fails: 38, act: 0.84, tta: 31,
    bad: [['P-410A', 'Cavitation', 6], ['K-410', 'Rider band wear', 4], ['GT-201', 'Combustion temperature spread', 3]] },
  { id: 'C', name: 'Site C', units: ['Crude export', 'Condensate export', 'Tank farm', 'Fire water', 'Utilities', 'Power generation'], kind: 'Export terminal', n: { CC: 2, GT: 2, RC: 2, PU: 34, EM: 16 }, alerts: 280, prec: 0.69, tpr: 0.79, fails: 24, act: 0.86, tta: 19,
    bad: [['P-207', 'Rolling bearing wear', 4], ['P-205A', 'Mechanical seal leakage', 4]] },
  { id: 'D', name: 'Site D', units: ['Compression train 1', 'Compression train 2', 'Compression train 3', 'Fuel gas', 'Utilities', 'Power generation'], kind: 'Compressor station', n: { CC: 10, GT: 6, RC: 1, PU: 10, EM: 8 }, alerts: 320, prec: 0.79, tpr: 0.88, fails: 19, act: 0.9, tta: 9,
    bad: [['K-301B', 'Dry gas seal leakage', 4], ['GT-302', 'Axial compressor fouling', 3]] },
  { id: 'E', name: 'Site E', units: ['Inlet separation', 'Gas compression', 'Condensate handling', 'Produced water', 'Utilities', 'Power generation'], kind: 'Gas gathering hub', n: { CC: 3, GT: 2, RC: 5, PU: 22, EM: 10 }, alerts: 240, prec: 0.56, tpr: 0.66, fails: 29, act: 0.8, tta: 44,
    bad: [['M-512', 'Stator winding overheating', 5], ['K-520', 'Valve leakage', 4]] },
];

export interface PortfolioData { sites: Site[]; alerts: Alert[]; cases: FaultCase[]; fails: Failure[]; rca: Map<string, RcaStatus> }

function generate(): PortfolioData {
  const R = mulberry32(4711), gauss = makeGauss(R), pick = makePick(R);

  // Unit assignment by equipment class: compressors to compression units, turbines to power/compression, pumps elsewhere.
  const unitFor = (s: SiteSeed, cls: EquipClass) => {
    const w = s.units.map((n) => {
      const l = n.toLowerCase(), comp = /compress|gas lift|fuel gas/.test(l), pow = /power/.test(l);
      return cls === 'CC' ? (comp ? 5 : 0.15) : cls === 'GT' ? (pow ? 4 : comp ? 3 : 0.1) : cls === 'RC' ? (comp ? 3 : /utilit/.test(l) ? 2 : 0.3) : cls === 'PU' ? (comp ? 0.4 : pow ? 0.3 : 2) : 1;
    });
    return 1 + s.units.indexOf(pick(s.units, w));
  };

  // Assets per site, with skewed weights so a few assets dominate (as in a real fleet).
  const sites: Site[] = SITE_SEEDS.map((seed, si) => {
    const s: Site = { ...seed, assets: [] };
    let num = 100 + si * 100;
    const tmp: Omit<Asset, 'w' | 'unit'>[] = [];
    for (const [c, k] of Object.entries(s.n) as [EquipClass, number][])
      for (let i = 0; i < k; i++) { num += Math.ceil(R() * 6); tmp.push({ tag: CLS[c].pre + num + (R() < 0.3 ? 'A' : ''), cls: c, site: s.id }); }
    tmp.sort(() => R() - 0.5).forEach((a, i) => s.assets.push({ ...a, w: (1 / Math.pow(i + 1, 0.6)) * (R() < 0.45 ? 0.12 : 1), unit: 0 }));
    s.assets.forEach((a) => (a.unit = unitFor(s, a.cls)));
    s.bad.forEach(([tag, mode, k]) => {
      const c = (Object.entries(CLS) as [EquipClass, (typeof CLS)[EquipClass]][]).find(([, v]) => v.modes.includes(mode) && tag.startsWith(v.pre))![0];
      s.assets.push({ tag, cls: c, site: s.id, w: 0.6, chronic: mode, k, unit: tag === 'K-101A' || tag === 'GT-101' ? 1 : unitFor(s, c) });
    });
    return s;
  });

  // Fault cases (episodes) → validated alerts; plus false alerts; plus open alerts.
  const alerts: Alert[] = [], fails: Failure[] = [], cases: FaultCase[] = [];
  const closeP = (mo: number) => (mo <= 8 ? 0.95 : mo === 9 ? 0.72 : mo === 10 ? 0.48 : 0.25);
  const addCase = (s: Site, a: Asset, mode: string, mo: number) => {
    const acted = R() < s.act, closed = acted && R() < closeP(mo), value = Math.round((CLS[a.cls].val * Math.exp(gauss() * 0.5)) / 1000) * 1000;
    const c: FaultCase = { site: s.id, asset: a.tag, cls: a.cls, mode, mo, acted, closed, value, unit: a.unit };
    cases.push(c);
    const n = 1 + Math.floor(-Math.log(1 - R()) * 2.2); // a fault keeps re-alerting until someone acts on it
    for (let i = 0; i < n; i++) alerts.push({ site: s.id, mo, asset: a.tag, cls: a.cls, mode, disp: 'val', acted, closed, value: i ? 0 : value, caseRef: c, unit: a.unit });
  };
  sites.forEach((s) => {
    s.assets.filter((a) => a.chronic).forEach((a) => { for (let i = 0; i < a.k!; i++) addCase(s, a, a.chronic!, Math.min(11, Math.floor(((i + R() * 0.9) * 12) / a.k!))); });
    const nCases = Math.round((s.alerts * s.prec) / 2.9), pool = s.assets.filter((a) => !a.chronic);
    for (let i = 0; i < nCases; i++) {
      const a = pick(pool, pool.map((x) => x.w)), modes = CLS[a.cls].modes;
      addCase(s, a, modes[Math.floor(R() * modes.length)], Math.min(11, Math.floor(Math.pow(R(), 0.9) * 12)));
    }
    const nVal = alerts.filter((x) => x.site === s.id).length, nRej = Math.round((nVal * (1 - s.prec)) / s.prec), all = s.assets;
    for (let i = 0; i < nRej; i++) {
      const a = pick(all, all.map((x) => x.w * (x.chronic && LOWP[x.chronic] ? 6 : 1)));
      const modes = CLS[a.cls].modes, mode = a.chronic && LOWP[a.chronic] ? a.chronic : pick(modes, modes.map((m) => (LOWP[m] ? 3.2 : 1)));
      alerts.push({ site: s.id, mo: Math.floor(R() * 12), asset: a.tag, cls: a.cls, mode, disp: 'rej', acted: false, closed: false, value: 0, unit: a.unit });
    }
    const nOpen = Math.round(nVal * 0.05);
    for (let i = 0; i < nOpen; i++) {
      const a = pick(all, all.map((x) => x.w)), modes = CLS[a.cls].modes;
      alerts.push({ site: s.id, mo: R() < 0.7 ? 11 : 10, asset: a.tag, cls: a.cls, mode: modes[Math.floor(R() * modes.length)], disp: 'open', acted: false, closed: false, value: 0, unit: a.unit });
    }
    for (let i = 0; i < s.fails; i++) fails.push({ site: s.id, mo: Math.floor(R() * 12), det: R() < s.tpr });
  });

  // Alert aging: hours from alert raised to first action (acknowledge / validate / reject).
  const NOWH = (12 * 30 + 15) * 24; // 16 Oct 2026, in hours from 1 Oct 2025
  alerts.forEach((a) => {
    const s = sites.find((x) => x.id === a.site)!;
    if (a.disp === 'open') { a.raisedH = a.mo * 30 * 24 + R() * 30 * 24; a.age = Math.max(2, NOWH - a.raisedH); }
    else a.tta = s.tta * Math.exp(gauss() * 0.75) * (1 + (0.35 * (11 - a.mo)) / 11);
  });

  // RCA status per recurring asset + failure mode (assigned once, most recurrent first).
  const rca = new Map<string, RcaStatus>();
  const reps = new Map<string, number>();
  cases.forEach((c) => { const k = c.site + c.asset + c.mode; reps.set(k, (reps.get(k) || 0) + 1); });
  [...reps.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => {
    const r = R();
    rca.set(k, n >= 4 ? (r < 0.35 ? 'no' : 'open') : r < 0.4 ? 'no' : r < 0.75 ? 'open' : 'done');
  });
  return { sites, alerts, cases, fails, rca };
}

export const PORTFOLIO = generate();
export const allAssets = () => PORTFOLIO.sites.flatMap((s) => s.assets);

// ---------- KPI maths ----------
export type KpiKey = 'age' | 'clo' | 'fpr' | 'tpr';
export const TARGETS: Record<KpiKey, [number, 'min' | 'max']> = { age: [24, 'max'], clo: [0.85, 'min'], fpr: [0.3, 'max'], tpr: [0.7, 'min'] };

export interface Stats {
  raised: number; val: number; rej: number; age: number; within: number; waiting: number;
  cases: number; casesA: number; clo: number; fpr: number; tpr: number; value: number; catches: number;
}
export function stats(al: Alert[]): Stats {
  const val = al.filter((a) => a.disp === 'val'), rej = al.filter((a) => a.disp === 'rej').length;
  const cs = [...new Set(val.map((a) => a.caseRef!))], ca = cs.filter((c) => c.acted), cc = ca.filter((c) => c.closed);
  const tt = al.filter((a) => a.tta != null).map((a) => a.tta!).sort((x, y) => x - y);
  return {
    raised: al.length, val: val.length, rej,
    age: tt.length ? tt[Math.floor(tt.length / 2)] : NaN,
    within: tt.filter((x) => x <= 24).length / tt.length,
    waiting: al.filter((a) => a.disp === 'open' && (a.age ?? 0) > 72).length,
    cases: cs.length, casesA: ca.length, clo: cc.length / ca.length,
    fpr: rej / (val.length + rej), tpr: val.length / (val.length + rej),
    value: cc.reduce((s, c) => s + c.value, 0), catches: cc.length,
  };
}
export type Status = 'ok' | 'mid' | 'no';
/** ok = meets target, mid = within 5 points (6 h for aging), no = misses. */
export function status(k: KpiKey, v: number): Status {
  if (!Number.isFinite(v)) return 'mid';
  if (k === 'age') return v <= 24 ? 'ok' : v <= 30 ? 'mid' : 'no';
  const [t, dir] = TARGETS[k];
  const gap = dir === 'min' ? v - t : t - v;
  return gap >= 0 ? 'ok' : gap >= -0.05 ? 'mid' : 'no';
}

/** Trains that have an asset-health view, by site (and site|unit). */
export const HEALTH_LINKS: Record<string, [string, string][]> = {
  A: [['Asset health', 'trainA']],
  'A|1': [['Train A', 'trainA'], ['Train B', 'trainB'], ['Train C', 'trainC']],
  'A|4': [['Train D', 'trainD'], ['Train E', 'trainE']],
};
