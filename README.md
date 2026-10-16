# World Class PdM

React + TypeScript version of the World Class PdM predictive-maintenance dashboards. It is a port of the HTML prototype, with the same views, data and behaviour.

| View | Route | What it shows |
|---|---|---|
| Portfolio | `#/` | 5 sites × 6 units: value realised, alert aging, case closure, false/true positive rate, site → unit scorecard, bad-actor Pareto, top and recurring fault diagnostics |
| Alert queue | `#/queue` | Prioritised action queue (risk score, evidence, actions), funnel, aging, precision trend, model health, bad actors |
| Asset health | `#/health/:trainId` | Site A machinery trains with live ML model health: asset tree, schematic, KPIs, model register |
| Equipment detail | `#/equipment/:tag` | Risk/anomaly gauge, alert summary, anomaly score, top contributors, predicted-vs-actual sensor charts |
| Performance | `#/performance/:trainId` | Placeholder for the APO performance dashboard |

Trains in Site A:

| Train | Configuration | Story in the sample data |
|---|---|---|
| A | Gas turbine → centrifugal compressor | K-101A DE bearing critical (APA-2417), GT inlet filter, stale seal-gas inputs |
| B | Gas turbine → centrifugal compressor | K-101B impeller fouling (APA-2377) |
| C | Motor → gearbox → centrifugal compressor | GB-130 HS pinion bearing (APA-2433), motor cooling watch |
| D | Motor → centrifugal pump (Plan 53A seal) | SS-401A seal barrier-fluid loss (APA-2436) |
| E | Motor → centrifugal pump (Plan 53A seal) | P-401B NPSH margin watch |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run typecheck
```

Node 18 or later.

## Project layout

```
src/
  App.tsx                     app bar + routes (HashRouter)
  styles/app.css              design tokens (light/dark) and styles, scoped per view (#pg-portfolio, #pg-queue, #pg-health)
  lib/                        rng (seeded sample data), formatting
  components/Sparkline.tsx
  data/
    portfolio.ts              portfolio sample data + KPI maths (stats, targets, status)
    queue.ts                  open alerts, risk score, SLA
    healthCatalogue.ts        trains, equipment, ML models, sensors (Site A)
    healthSim.ts              live scoring simulation, anomaly index, helpers
  pages/
    portfolio/                PortfolioPage, KpiTiles, Scorecard, ParetoChart, FaultChart, RecurringTable
    queue/                    QueuePage, QueueCharts
    health/                   HealthLayout (tree + header), AssetTree, TrainOverview, EquipmentDetail
      schematics/             parts.tsx (shared shapes), GtcSchematic, MdcSchematic, MdpSchematic
      charts/                 Gauge, AnomalyChart, SensorChart, Axes
    performance/              PerformancePage (placeholder)
```

## Key definitions

- **Anomaly index (0–100, higher = worse):** `100 − 100 / (1 + 0.6 × score^1.6)`, where *score* is the smoothed RMS of residuals (actual − predicted) / 3σ across a model's sensors. Normal < 20, Watch 20–39, Warning 40–59, Critical ≥ 60. Equipment shows its worst running model.
- **Risk priority score:** `100 × criticality × severity/4 × confidence × urgency` (criticality A 1.0 / B 0.65 / C 0.35; urgency from time to failure). Safety-critical floor 70.
- **Alert aging:** median time from alert raised to first action. Target ≤ 24 h.
- **True / false positive rate:** genuine deviations ÷ reviewed alerts, and model/data issues ÷ reviewed alerts.
- **Asset tree:** red dot = an active alert on that item or anything below it, green = none.

## Wiring to real data

All numbers are simulated and deterministic (seeded). To connect to production:

1. **Portfolio and queue:** replace `generate()` in `data/portfolio.ts` and `RAW` in `data/queue.ts` with API calls to the alert store (alerts, dispositions, cases, SAP PM notifications).
2. **Asset health:** replace the catalogue in `data/healthCatalogue.ts` with PI AF templates and the model registry, and replace `tick()` in `data/healthSim.ts` with polling PI Web API for actual and predicted streams and the model scores the engine writes back.
3. Keep the derived maths (`stats`, `status`, `riskScore`, anomaly index) as they are, or move them server-side.

The HTML prototype is still the reference for design changes; this project mirrors it as of 16 Oct 2026.
