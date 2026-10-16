/**
 * Asset-health model catalogue for Site A: five trains, their equipment, ML models and sensors.
 * Sensor arguments: S(tag, name, unit, base, noise σ, drift in σ, drift start (0–1 of window), decimals, seasonal amplitude, stale).
 * In production this catalogue comes from PI AF templates (|APA Outputs| attributes) and the model registry.
 */
export type TrainType = 'gtc' | 'mdc' | 'mdp';
export interface Train { name: string; title: string; type?: TrainType; map: Record<string, string> }
export interface SensorSeed { tag: string; name: string; unit: string; base: number; noise: number; dz: number; start: number; dec: number; amp: number; stale: boolean }

const S = (tag: string, name: string, unit: string, base: number, noise: number, dz = 0, start = 0.7, dec = 1, amp = 1.2, stale = false): SensorSeed =>
  ({ tag, name, unit, base, noise, dz, start, dec, amp, stale });

const MODELS: Record<string, any> = {
 'K101A-BRG':{eq:'K-101A',name:'Bearing condition',type:'Multivariate autoencoder',trained:'12 Aug 2026',
   alert:{id:'APA-2417',fm:'DE journal bearing degradation',iso:'VIB',sev:4,conf:.91,ttf:6,var:1850000,state:'Validated',notif:'10458821',owner:'Rotating Equipment Eng.',
     acts:['Hold load at or below current level to keep DE vibration under the 75 µm alarm','Vibration specialist to confirm with orbit and shaft centreline review within 24 h','Take lube oil sample for ferrography and wear-metal analysis','Plan DE bearing inspection at a controlled stop within 5 days; confirm bearing set in stores','Flag Train A to APO: suspend throughput-increase recommendations']},
   sensors:[S('VT-1011X','DE radial vibration X','µm pk-pk',38,1.8,5.2,.66),S('VT-1011Y','DE radial vibration Y','µm pk-pk',34,1.6,3.6,.68),S('TE-1015','DE bearing metal temp','°C',92,1.2,2.4,.66),S('TE-1101','Lube oil supply temp','°C',46,.5,1.1,.7),S('VT-1012X','NDE radial vibration X','µm pk-pk',29,1.4,.4,.75),S('TE-1017','Thrust bearing temp','°C',84,1,.3,.8),S('ST-1001','Shaft speed','rpm',9850,25,0,.7,0),S('FT-1001','Suction flow','MMSCFD',212,2.5,0,.7,0)]},
 'K101A-PERF':{eq:'K-101A',name:'Aerodynamic performance',type:'Physics-informed regression',trained:'03 Sep 2026',
   note:'Watch: polytropic efficiency is slightly below prediction, consistent with early impeller fouling. Hand over to APO for wash-timing economics. No reliability risk at present.',
   sensors:[S('KPI-ETA','Polytropic efficiency','%',78.5,.25,-.9,.55,1,.6),S('TE-1003','Discharge temperature','°C',138,.8,.7,.55),S('KPI-HP','Polytropic head','kJ/kg',96,.6,-.6,.55),S('PT-1003','Discharge pressure','barg',68,.3,.1,.7),S('PT-1001','Suction pressure','barg',31.5,.15,0,.7,1)]},
 'GT101-INL':{eq:'GT-101',name:'Inlet air filtration',type:'Gradient-boosted residual model',trained:'21 Jul 2026',
   alert:{id:'APA-2412',fm:'Inlet filter ΔP high',iso:'PDE',sev:2,conf:.93,ttf:30,var:150000,state:'WO raised',notif:'10458902',owner:'Turbine Specialist',
     acts:['Filter change is planned under the work order; confirm materials are on site','Combine the outage with the K-101A bearing inspection','Check whether the recent dust event and humidity explain the loading rate']},
   sensors:[S('PDT-2001','Inlet filter ΔP','mbar',6.2,.25,3.1,.55,2),S('TE-2002','Compressor inlet temp','°C',41,.6,.3),S('JT-2001','Power output','MW',21.5,.2,-1,.6,2),S('AT-2003','Ambient humidity','%RH',38,3,0,.7,0)]},
 'GT101-CMB':{eq:'GT-101',name:'Combustion',type:'Multivariate autoencoder',trained:'21 Jul 2026',
   sensors:[S('TE-2101','Exhaust temperature spread','°C',24,1.2,.3),S('TE-2100','Mean exhaust temperature','°C',515,2,.2,.7,0),S('FT-2010','Fuel gas flow','kg/s',1.42,.02,0,.7,2)]},
 'GT101-VIB':{eq:'GT-101',name:'Rotor dynamics',type:'Multivariate autoencoder',trained:'21 Jul 2026',
   sensors:[S('VT-2201','Bearing 1 velocity','mm/s',4.1,.2,.2,.7,2),S('VT-2202','Bearing 2 velocity','mm/s',3.6,.2,.1,.7,2),S('TE-2211','Bearing 1 drain temp','°C',71,.8,0)]},
 'LO101-SYS':{eq:'LO-101',name:'Lube oil system',type:'Multivariate autoencoder',trained:'12 Aug 2026',
   note:'Watch: oil supply temperature and filter ΔP are drifting above prediction. This points to cooler fouling or filter loading, and may be contributing to the K-101A DE bearing temperature rise. Check cooler and filter at the next round.',
   sensors:[S('TE-1101','Oil supply temperature','°C',46,.5,1.2,.6),S('PDT-1105','Oil filter ΔP','bar',.55,.03,1.4,.5,2),S('PT-1102','Oil header pressure','barg',2.4,.03,-.5,.6,2),S('LT-1100','Reservoir level','%',78,.4,.2)]},
 'DGS101-SEAL':{eq:'DGS-101',name:'Dry gas seal',type:'Multivariate autoencoder',trained:'02 Jun 2026',stale:true,
   note:'Model output is not reliable: 2 inputs (PDT-1201, FT-1203) have not updated for 56 h. Restore the data path before trusting this health index.',
   sensors:[S('FT-1201','DE primary vent flow','Nm³/h',3.2,.12,.3,.7,2),S('FT-1203','NDE primary vent flow','Nm³/h',3.0,.12,0,.7,2,1.2,true),S('PDT-1201','Seal gas supply ΔP','bar',1.1,.03,0,.7,2,1.2,true),S('PT-1210','Separation gas pressure','barg',.45,.02,0,.7,2)]}
};
const EQ: Record<string, any> = {
 'K-101A':{desc:'Export gas compressor',crit:'A'},
 'GT-101':{desc:'Gas turbine driver',crit:'A'},
 'DGS-101':{desc:'Seal gas panel',crit:'A'},
 'LO-101':{desc:'Lube oil console',crit:'A'}
};
// Train B: same equipment roles, its own tags, sensors and degradation story
const TRAINS: Record<string, Train> = {
 trainA:{name:'Train A',title:'Export Compression Train A',map:{gt:'GT-101',comp:'K-101A',dgs:'DGS-101',lo:'LO-101'}},
 trainB:{name:'Train B',title:'Export Compression Train B',map:{gt:'GT-102',comp:'K-101B',dgs:'DGS-102',lo:'LO-102'}}
};
const roleOf: Record<string, string> = {};Object.entries(TRAINS.trainA.map).forEach(([r,t])=>roleOf[t]=r);
Object.keys(EQ).forEach(t=>{EQ[t].train='trainA';EQ[TRAINS.trainB.map[roleOf[t]]]={desc:EQ[t].desc,crit:EQ[t].crit,train:'trainB'}});
const B_OVR: Record<string, any> = {
 'K101B-PERF':{start:.45,trained:'03 Sep 2026',dz:{'KPI-ETA':-2.0,'TE-3003':1.6,'KPI-HP':-1.4},
   alert:{id:'APA-2377',fm:'Impeller fouling, efficiency loss',iso:'PDE',sev:2,conf:.86,ttf:75,var:410000,state:'Monitoring',notif:'',owner:'Process Eng. / APO',
     acts:['Hand over to APO to quantify the energy and throughput cost of the efficiency loss','Evaluate an online wash at the next stable-load window; plan an offline wash at the next stop if online washing does not recover head','Check the upstream suction scrubber for liquid carry-over as a fouling source','Keep monitoring; there is no reliability risk at present']}},
 'GT102-CMB':{start:.55,dz:{'TE-4101':1.6},
   note:'Watch: exhaust temperature spread on GT-102 is widening above prediction. Check thermocouple health first, then review fuel nozzle ΔP trends. Plan a borescope if the spread keeps growing.'}
};
for (const [id, m] of Object.entries({ ...MODELS }) as [string, any][]) {
  const eqB=TRAINS.trainB.map[roleOf[m.eq]],idB=id.replace(m.eq.replace('-',''),eqB.replace('-','')),o=B_OVR[idB]||{};
  MODELS[idB]={eq:eqB,name:m.name,type:m.type,trained:o.trained||m.trained,alert:o.alert||null,note:o.note,stale:false,
    sensors:m.sensors.map((s: any)=>{const tag=s.tag.replace(/-(\d)/,(_x: string,d: string)=>'-'+(+d+2));return S(tag,s.name,s.unit,s.base,s.noise,(o.dz&&o.dz[tag])||0,o.start||.7,s.dec,s.amp,false)})};
}
// ---- Train C: motor-driven booster compressor (motor → speed-increasing gearbox → centrifugal compressor)
TRAINS.trainC={name:'Train C',title:'Booster Compression Train C',type:'mdc',map:{m:'M-130',gb:'GB-130',comp:'K-130',lo:'LO-130',dgs:'DGS-130'}};
Object.assign(EQ,{
 'M-130':{desc:'Compressor drive motor',crit:'A',train:'trainC'},
 'GB-130':{desc:'Speed-increasing gearbox',crit:'A',train:'trainC'},
 'K-130':{desc:'Booster gas compressor',crit:'A',train:'trainC'},
 'LO-130':{desc:'Lube oil console',crit:'A',train:'trainC'},
 'DGS-130':{desc:'Seal gas panel',crit:'A',train:'trainC'}});
Object.assign(MODELS,{
 'M130-ELEC':{eq:'M-130',name:'Motor electrical & cooling',type:'Multivariate autoencoder',trained:'19 Aug 2026',
   note:'Watch: stator winding temperatures are running above prediction at the same load, and the cooling air outlet temperature is up with them. This points to fouling of the motor air filters or the air-to-water cooler rather than an electrical fault. Inspect the filters and the cooler water flow at the next round.',
   sensors:[S('TE-1301','Stator winding temp (hottest RTD)','°C',96,1,1.25,.6),S('TE-1302','Stator winding temp phase V','°C',94,1,1.05,.6),S('TE-1305','Cooling air outlet temp','°C',44,.6,1.3,.58),S('IT-1300','Motor current','A',372,3,0,.7,0),S('KPI-CI13','Current imbalance','%',1.1,.08,0,.7,2),S('JT-1300','Motor power','MW',6.4,.05,0,.7,2)]},
 'M130-BRG':{eq:'M-130',name:'Motor bearings',type:'Multivariate autoencoder',trained:'19 Aug 2026',
   sensors:[S('VT-1311','DE bearing vibration','mm/s',2.1,.1,0,.7,2),S('VT-1312','NDE bearing vibration','mm/s',1.8,.1,0,.7,2),S('TE-1311','DE bearing temp','°C',72,.7,0),S('TE-1312','NDE bearing temp','°C',68,.7,0)]},
 'GB130-MECH':{eq:'GB-130',name:'Gearbox condition',type:'Multivariate autoencoder',trained:'19 Aug 2026',
   alert:{id:'APA-2433',fm:'HS pinion bearing degradation',iso:'VIB',sev:3,conf:.84,ttf:21,var:640000,state:'Acknowledged',notif:'',owner:'Rotating Equipment Eng.',
     acts:['Confirm with a spectrum and orbit review of the HS pinion: look for rising 1X, sub-synchronous components and gear-mesh sidebands','Take a gearbox oil sample for wear metals (babbitt Sn/Pb, Fe) and particle count; inspect the LO-130 filter for babbitt flakes','Check oil supply pressure and temperature at the pinion bearing inlet and confirm the supply orifice is not partly blocked','Avoid rapid load swings and keep pinion vibration below the alarm level until the inspection','Plan an inspection of the HS pinion bearings and the gear contact pattern within 3 weeks; confirm a spare bearing set is in stores','Raise a SAP notification now; the alert is acknowledged but has no notification yet']},
   sensors:[S('VT-1321','HS pinion radial vibration','µm pk-pk',28,1.4,4.6,.62),S('TE-1321','HS pinion bearing temp','°C',88,1,2.6,.64),S('AT-1323','Gear-mesh acceleration','g',3.2,.15,2,.66,2),S('VT-1322','LS gear radial vibration','µm pk-pk',22,1.2,.3,.7),S('TE-1322','LS gear bearing temp','°C',79,.9,.2,.7)]},
 'K130-BRG':{eq:'K-130',name:'Bearing condition',type:'Multivariate autoencoder',trained:'02 Sep 2026',
   sensors:[S('VT-1331','DE radial vibration','µm pk-pk',31,1.5,0),S('VT-1332','NDE radial vibration','µm pk-pk',27,1.4,0),S('TE-1335','Thrust bearing temp','°C',82,.9,0),S('ST-1301','Shaft speed','rpm',11250,25,0,.7,0),S('FT-1301','Inlet flow','MMSCFD',96,1.2,0,.7,0)]},
 'K130-PERF':{eq:'K-130',name:'Aerodynamic performance',type:'Physics-informed regression',trained:'02 Sep 2026',
   sensors:[S('KPI-ETA13','Polytropic efficiency','%',80.2,.25,0,.7,1,.6),S('TE-1303','Discharge temperature','°C',121,.8,0),S('PT-1303','Discharge pressure','barg',48,.3,0),S('PT-1301','Suction pressure','barg',21,.15,0)]},
 'LO130-SYS':{eq:'LO-130',name:'Lube oil system',type:'Multivariate autoencoder',trained:'19 Aug 2026',
   sensors:[S('TE-1351','Oil supply temperature','°C',47,.5,0),S('PDT-1355','Oil filter ΔP','bar',.5,.03,.6,.6,2),S('PT-1352','Oil header pressure','barg',2.5,.03,0,.7,2)]},
 'DGS130-SEAL':{eq:'DGS-130',name:'Dry gas seal',type:'Multivariate autoencoder',trained:'02 Sep 2026',
   sensors:[S('FT-1361','DE primary vent flow','Nm³/h',2.9,.12,0,.7,1),S('FT-1363','NDE primary vent flow','Nm³/h',2.8,.12,0,.7,1),S('PDT-1361','Seal gas supply ΔP','bar',1.2,.03,0,.7,2)]}
});
// ---- Trains D and E: motor-driven condensate export pumps (duty / standby), API Plan 53A seal support
function pumpTrain(tid: string, sfx: string, title: string, ovr?: any) {
  const m='M-401'+sfx,p='P-401'+sfx,ss='SS-401'+sfx,o=ovr||{},dz=(t: string)=>(o.dz&&o.dz[t])||0,st=o.start||.6;
  TRAINS[tid]={name:'Train '+tid.slice(-1),title,type:'mdp',map:{m,pump:p,seal:ss}};
  EQ[m]={desc:'Pump drive motor',crit:'B',train:tid};EQ[p]={desc:'Condensate export pump',crit:'A',train:tid};EQ[ss]={desc:'Plan 53A seal system',crit:'A',train:tid};
  const T=(x: string)=>x+sfx;
  MODELS['M401'+sfx+'-ELEC']={eq:m,name:'Motor electrical',type:'Multivariate autoencoder',trained:'26 Aug 2026',
    sensors:[S(T('TE-4001'),'Stator winding temp','°C',88,.9,dz('TE-4001'),st),S(T('IT-4000'),'Motor current','A',96,1.2,0,.7,0),S(T('JT-4000'),'Motor power','kW',610,5,0,.7,0),S(T('KPI-CI40'),'Current imbalance','%',1,.08,0,.7,2)]};
  MODELS['M401'+sfx+'-BRG']={eq:m,name:'Motor bearings',type:'Multivariate autoencoder',trained:'26 Aug 2026',
    sensors:[S(T('VT-4011'),'DE bearing vibration','mm/s',1.6,.08,dz('VT-4011'),st,2),S(T('VT-4012'),'NDE bearing vibration','mm/s',1.4,.08,0,.7,2),S(T('TE-4011'),'DE bearing temp','°C',64,.7,0),S(T('TE-4012'),'NDE bearing temp','°C',61,.7,0)]};
  MODELS['P401'+sfx+'-BRG']={eq:p,name:'Pump bearings',type:'Multivariate autoencoder',trained:'26 Aug 2026',
    sensors:[S(T('VT-4022'),'Radial bearing vibration','mm/s',2.5,.1,dz('VT-4022'),st,2),S(T('VT-4021'),'Thrust bearing vibration','mm/s',2.2,.1,0,.7,2),S(T('TE-4021'),'Thrust bearing temp','°C',66,.7,0),S(T('AT-4023'),'High-frequency acceleration','gE',.8,.05,dz('AT-4023'),st,2)]};
  MODELS['P401'+sfx+'-HYD']={eq:p,name:'Hydraulic performance',type:'Physics-informed regression',trained:'26 Aug 2026',note:o.hydNote,
    sensors:[S(T('FT-4031'),'Flow','m³/h',410,3,dz('FT-4031'),st,0),S(T('PT-4031'),'Suction pressure','barg',3.2,.04,dz('PT-4031'),st,2),S(T('PT-4033'),'Discharge pressure','barg',38.5,.15,dz('PT-4033'),st),S(T('KPI-NPSH'),'NPSH margin','m',4.2,.1,dz('KPI-NPSH'),st),S(T('KPI-PEF'),'Pump efficiency','%',74,.4,dz('KPI-PEF'),st)]};
  MODELS['SS401'+sfx+'-SEAL']={eq:ss,name:'Mechanical seal (Plan 53A)',type:'Multivariate autoencoder',trained:'26 Aug 2026',alert:o.sealAlert||null,
    sensors:[S(T('LT-4041'),'Seal pot level','%',78,.5,dz('LT-4041'),st),S(T('PT-4041'),'Barrier pressure','barg',6.8,.05,dz('PT-4041'),st,2),S(T('TE-4041'),'Seal chamber temp','°C',58,.6,dz('TE-4041'),st)]};
}
pumpTrain('trainD','A','Condensate Export Pump P-401A',{start:.58,dz:{'LT-4041':-5.5,'PT-4041':-1.6,'TE-4041':2.2},
  sealAlert:{id:'APA-2436',fm:'Mechanical seal leakage (barrier fluid loss)',iso:'ELP',sev:3,conf:.88,ttf:12,var:180000,state:'New',notif:'',owner:'Condensate Unit Maintenance',
    acts:['Confirm the seal pot level drop rate and check that no barrier fluid has been topped up since the last reading','Check the barrier pressure against seal chamber pressure; keep it at least 1.5 bar above, and verify the accumulator nitrogen pre-charge','Inspect the seal gland and drain for visible leakage of condensate or barrier fluid','Be ready to switch to standby P-401B if the level drop accelerates or the barrier pressure cannot be held','Plan a cartridge seal replacement and check the seal cooler and flush line while the pump is isolated','Raise a SAP notification; the alert is new and still has no notification']}});
pumpTrain('trainE','B','Condensate Export Pump P-401B',{start:.55,dz:{'PT-4031':-1.5,'KPI-NPSH':-1.6,'AT-4023':.9},
  hydNote:'Watch: NPSH margin is falling below prediction as suction pressure drops. Check the suction strainer ΔP and the stabiliser bottoms level. Cavitation risk rises sharply if the margin goes under 1 m; the rising high-frequency acceleration on the pump bearings is an early sign.'});

export const CATALOGUE = { MODELS, EQ, TRAINS };
