/**
 * Open alerts for the prioritised action queue (sample data).
 * In production these come from the alert store; risk score and overdue flags are derived below.
 */
export type QueueState = 'New' | 'Acknowledged' | 'Validated' | 'WO raised' | 'Monitoring';
export interface QueueAlert {
  id: string; tag: string; desc: string; site: string; train: string; crit: 'A' | 'B' | 'C';
  fm: string; iso: string; sev: 1 | 2 | 3 | 4; conf: number; ttf: number; age: number; state: QueueState;
  notif: string; var: number; owner: string; safety?: boolean; ev: string[]; act: string[];
  score?: number; overdue?: boolean;
}

export const CRIT_WEIGHT = { A: 1, B: 0.65, C: 0.35 } as const;
/** Response SLA in days by severity. */
export const SLA: Record<number, number> = { 4: 1, 3: 3, 2: 7, 1: 14 };
export const SEV_LABEL: Record<number, string> = { 4: 'Critical', 3: 'High', 2: 'Medium', 1: 'Low' };
export const urgency = (ttfDays: number) => (ttfDays <= 7 ? 1 : ttfDays <= 30 ? 0.75 : ttfDays <= 90 ? 0.5 : 0.3);
/** Risk priority score 0–100 = 100 × criticality × severity/4 × confidence × urgency (safety floor 70). */
export const riskScore = (a: Pick<QueueAlert, 'crit' | 'sev' | 'conf' | 'ttf' | 'safety'>) => {
  const s = Math.round(100 * CRIT_WEIGHT[a.crit] * (a.sev / 4) * a.conf * urgency(a.ttf));
  return a.safety ? Math.max(s, 70) : s;
};

const RAW: QueueAlert[] = [
 {id:'APA-2417',tag:'K-101A',desc:'Export gas compressor',site:'Site A',train:'Export Train A',crit:'A',fm:'DE journal bearing degradation',iso:'VIB',sev:4,conf:.91,ttf:6,age:1.5,state:'Validated',notif:'10458821',var:1850000,owner:'Rotating Equipment Eng.',
  ev:['DE 1X vibration up from 38 to 71 µm pk-pk over 9 days at constant load','DE bearing metal temperature +11 °C vs load-matched baseline','Shaft centreline shows DE journal moving toward bottom of clearance'],
  act:['Hold load at or below current level to keep DE vibration under the 75 µm alarm','Confirm with orbit and shaft centreline review by the vibration specialist within 24 h','Take lube oil sample for ferrography and wear-metal analysis','Plan DE bearing inspection at a controlled stop within 5 days; confirm bearing set in stores','Flag Export Train A to APO: suspend throughput-increase recommendations']},
 {id:'APA-2409',tag:'K-410',desc:'Gas lift compressor (recip)',site:'Site B',train:'Gas Lift',crit:'A',fm:'Piston rider band wear (rod drop)',iso:'VIB',sev:3,conf:.87,ttf:16,age:2.5,state:'Validated',notif:'10458877',var:700000,owner:'Offshore Maintenance',
  ev:['Rod drop on throw 2 increased 0.18 mm in 30 days','Crosshead vibration impact events up on throw 2'],
  act:['Order rider bands and piston rings for throw 2 now (offshore logistics lead time)','Schedule throw 2 overhaul within 14 days','Increase rod drop review to daily until repair']},
 {id:'APA-2398',tag:'GT-201',desc:'Gas turbine generator',site:'Site B',train:'Power Generation',crit:'A',fm:'Combustor exhaust spread high',iso:'PDE',sev:3,conf:.84,ttf:18,age:4.2,state:'Acknowledged',notif:'',var:920000,owner:'Turbine Specialist',
  ev:['Exhaust temperature spread up from 28 to 46 °C','Thermocouple 7 reading cold; neighbouring TCs normal','Fuel nozzle ΔP on can 7 rising'],
  act:['Verify TC7 health against redundant TC before acting','If confirmed, borescope can 7 and fuel nozzle at next load-shed opportunity','Raise SAP notification now; the alert is past its 3-day SLA']},
 {id:'APA-2421',tag:'P-501A',desc:'Firewater pump diesel driver',site:'Site B',train:'Fire Protection',crit:'A',safety:true,fm:'Jacket water temperature low (fail-to-start risk)',iso:'FTS',sev:3,conf:.82,ttf:12,age:.6,state:'New',notif:'',var:0,owner:'Offshore Maintenance',
  ev:['Jacket water temperature dropped from 42 to 24 °C over 3 days','Jacket water heater current reading zero'],
  act:['Inform OIM; safety-critical element, treat as impaired until verified','Check jacket water heater breaker and element','Run weekly start test early after repair']},
 {id:'APA-2390',tag:'P-205B',desc:'Crude booster pump',site:'Site C',train:'Crude Export',crit:'B',fm:'Mechanical seal leakage',iso:'ELP',sev:3,conf:.88,ttf:10,age:9,state:'New',notif:'',var:310000,owner:'Terminal Maintenance',
  ev:['Plan 53A seal pot level falling twice as fast as baseline','Seal chamber temperature +8 °C'],
  act:['Switch to standby P-205A','Isolate P-205B and replace cartridge seal','Check Plan 53A barrier pressure and accumulator pre-charge','Third seal failure in 12 months: open RCA']},
 {id:'APA-2402',tag:'K-310',desc:'Fuel gas compressor',site:'Site A',train:'Fuel Gas',crit:'B',fm:'Dry gas seal primary vent flow high',iso:'ELP',sev:3,conf:.76,ttf:25,age:3,state:'Validated',notif:'10458790',var:540000,owner:'Rotating Equipment Eng.',
  ev:['NDE primary vent flow up 2.4× baseline','Seal gas filter ΔP normal; contamination less likely'],
  act:['Check secondary seal vent and separation gas supply','Plan seal cartridge change at next window; confirm spare with OEM','Trend vent flow daily against trip setpoint']},
 {id:'APA-2385',tag:'P-410A',desc:'Seawater lift pump',site:'Site B',train:'Seawater',crit:'B',fm:'Cavitation / suction loss',iso:'VIB',sev:3,conf:.72,ttf:14,age:11,state:'New',notif:'',var:260000,owner:'Offshore Maintenance',
  ev:['Broadband vibration rising above 2 kHz','Discharge pressure fluctuating ±0.4 bar'],
  act:['Check caisson level and suction strainer condition','Verify flow is inside the pump preferred operating region','Model has 27% precision on this asset: validate before raising work']},
 {id:'APA-2394',tag:'P-302',desc:'Produced water injection pump',site:'Site B',train:'Water Injection',crit:'B',fm:'Coupling misalignment',iso:'VIB',sev:3,conf:.79,ttf:21,age:8,state:'Acknowledged',notif:'',var:190000,owner:'Offshore Maintenance',
  ev:['2X vibration dominant at motor NDE','Axial vibration up 60%'],
  act:['Laser alignment check at next stop','Inspect coupling and soft foot','Raise SAP notification; past SLA']},
 {id:'APA-2433',tag:'GB-130',desc:'Speed-increasing gearbox',site:'Site A',train:'Booster Train C',crit:'A',fm:'HS pinion bearing degradation',iso:'VIB',sev:3,conf:.84,ttf:21,age:4.5,state:'Acknowledged',notif:'',var:640000,owner:'Rotating Equipment Eng.',
  ev:['HS pinion radial vibration up from 28 to 46 µm pk-pk over 3 weeks','HS pinion bearing temperature +7 °C at constant load','Gear-mesh acceleration rising with the pinion vibration'],
  act:['Confirm with spectrum and orbit review of the HS pinion','Take a gearbox oil sample for wear metals and check the LO-130 filter for babbitt','Check oil supply to the pinion bearing','Plan pinion bearing and gear contact inspection within 3 weeks','Raise a SAP notification; past SLA']},
 {id:'APA-2436',tag:'P-401A',desc:'Condensate export pump',site:'Site A',train:'Condensate Export',crit:'A',fm:'Mechanical seal leakage (barrier fluid loss)',iso:'ELP',sev:3,conf:.88,ttf:12,age:1.2,state:'New',notif:'',var:180000,owner:'Condensate Unit Maintenance',
  ev:['Plan 53A seal pot level falling at about three times the normal rate','Barrier pressure dropping toward seal chamber pressure','Seal chamber temperature +6 °C'],
  act:['Confirm the level drop rate and check for recent top-ups','Hold barrier pressure at least 1.5 bar above seal chamber pressure; check accumulator pre-charge','Switch to standby P-401B if the leak accelerates','Plan cartridge seal replacement']},
 {id:'APA-2377',tag:'K-101B',desc:'Export gas compressor',site:'Site A',train:'Export Train B',crit:'A',fm:'Impeller fouling, efficiency loss',iso:'PDE',sev:2,conf:.86,ttf:75,age:14,state:'Monitoring',notif:'',var:410000,owner:'Process Eng. / APO',
  ev:['Polytropic efficiency down 3.1 points vs OEM curve','Head at constant flow down 4%'],
  act:['Hand over to APO for energy-cost impact and wash timing','Assess online wash feasibility','Keep monitoring; no reliability risk at present']},
 {id:'APA-2412',tag:'GT-101',desc:'Gas turbine driver',site:'Site A',train:'Export Train A',crit:'A',fm:'Inlet filter ΔP high',iso:'PDE',sev:2,conf:.93,ttf:30,age:2,state:'WO raised',notif:'10458902',var:150000,owner:'Turbine Specialist',
  ev:['Inlet filter ΔP at 82% of alarm and rising after dust event'],
  act:['Filter change planned under WO; confirm materials','Align with K-101A bearing work to share the outage']},
 {id:'APA-2380',tag:'K-102B',desc:'Booster compressor',site:'Site A',train:'Export Train B',crit:'B',fm:'Lube oil cooler fouling',iso:'OHE',sev:2,conf:.81,ttf:45,age:6,state:'Acknowledged',notif:'',var:120000,owner:'Rotating Equipment Eng.',
  ev:['Lube oil supply temperature +6 °C at same cooling water temperature'],
  act:['Switch to standby cooler','Schedule cleaning of fouled cooler']},
 {id:'APA-2405',tag:'K-205',desc:'Instrument air compressor',site:'Site C',train:'Utilities',crit:'B',fm:'Discharge valve leakage',iso:'INL',sev:2,conf:.74,ttf:35,age:4,state:'Acknowledged',notif:'',var:60000,owner:'Terminal Maintenance',
  ev:['Stage 2 discharge temperature +14 °C','Loaded time per cycle up 18%'],
  act:['Plan valve change on stage 2','Confirm standby compressor availability']},
 {id:'APA-2399',tag:'M-120',desc:'Main HV motor',site:'Site A',train:'Export Train B',crit:'C',fm:'Stator winding temperature high',iso:'OHE',sev:2,conf:.69,ttf:60,age:5,state:'Monitoring',notif:'',var:80000,owner:'Electrical Eng.',
  ev:['Winding RTDs +7 °C at same load and ambient'],
  act:['Inspect cooling air path and filters','Check phase current balance']},
 {id:'APA-2366',tag:'P-207',desc:'Condensate transfer pump',site:'Site C',train:'Condensate',crit:'C',fm:'Bearing housing temperature high',iso:'OHE',sev:2,conf:.58,ttf:40,age:17,state:'New',notif:'',var:45000,owner:'Terminal Maintenance',
  ev:['Bearing housing temperature +5 °C; ambient also up'],
  act:['Low confidence and repeat alerts: check sensor and ambient compensation before work','Disposition the alert; it is past SLA']}
];

export const QUEUE: QueueAlert[] = RAW.map((a) => ({
  ...a,
  score: riskScore(a),
  overdue: (a.state === 'New' || a.state === 'Acknowledged') && a.age > SLA[a.sev],
})).sort((x, y) => y.score! - x.score!);

/** Equipment that has an asset-health page (train schematic + detail). */
export const HEALTH_TAGS = ['K-101A', 'K-101B', 'GT-101', 'GT-102', 'LO-101', 'LO-102', 'DGS-101', 'DGS-102', 'M-130', 'GB-130', 'K-130', 'LO-130', 'DGS-130', 'M-401A', 'P-401A', 'SS-401A', 'M-401B', 'P-401B', 'SS-401B'];
