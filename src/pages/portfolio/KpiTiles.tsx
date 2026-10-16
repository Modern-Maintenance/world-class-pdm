import { Sparkline } from '../../components/Sparkline';
import { fmtH, moneyShort, pct } from '../../lib/format';
import { MONTHS, TARGETS, status, stats, type Alert, type KpiKey } from '../../data/portfolio';

const fmtK = (k: KpiKey, v: number) => (k === 'age' ? fmtH(v) : pct(v));

export function KpiTiles({ alerts }: { alerts: Alert[] }) {
  const S = stats(alerts);
  const byMo = (k: keyof ReturnType<typeof stats>) => MONTHS.map((_, m) => stats(alerts.filter((a) => a.mo === m))[k] as number);
  const cum: number[] = [];
  byMo('value').reduce((a, v, i) => (cum[i] = a + v), 0);

  const tiles: { l: string; v: string; k?: KpiKey; hero?: boolean; badge?: string; sub: string; s: number[] }[] = [
    { l: 'Value realised', v: moneyShort(S.value), hero: true, badge: `${S.catches} confirmed catches`, sub: 'Cumulative over 12 months', s: cum },
    { l: 'Alert aging', v: fmtH(S.age), k: 'age', sub: `Median time from new alert to first action · ${pct(S.within)} actioned within 24 h · ${S.waiting} open alerts waiting over 3 days`, s: byMo('age') },
    { l: 'Case closure ratio', v: pct(S.clo), k: 'clo', sub: `${S.catches} of ${S.casesA} cases closed; recent months still in progress`, s: byMo('clo') },
    { l: 'False positive rate', v: pct(S.fpr), k: 'fpr', sub: `${S.rej} of ${S.val + S.rej} reviewed alerts were model or data issues`, s: byMo('fpr') },
    { l: 'True positive rate', v: pct(S.tpr), k: 'tpr', sub: `${S.val} of ${S.val + S.rej} reviewed alerts were genuine equipment or process deviations`, s: byMo('tpr') },
  ];

  return (
    <section className="tiles" aria-label="Headline KPIs">
      {tiles.map((t) => {
        let badge = <span className="tgt neu">{t.badge}</span>;
        if (t.k) {
          const st = status(t.k, S[t.k]);
          const [tv, dir] = TARGETS[t.k];
          badge = <span className={`tgt ${st}`}>{st === 'ok' ? 'Meets' : st === 'mid' ? 'Near' : 'Misses'} target {dir === 'min' ? '≥' : '≤'} {fmtK(t.k, tv)}</span>;
        }
        return (
          <div className={`tile${t.hero ? ' hero' : ''}`} key={t.l}>
            <div className="lbl">{t.l}</div>
            <div className="row"><span className="val">{t.v}</span>{badge}</div>
            <div className="sub">{t.sub}</div>
            <Sparkline values={t.s} />
          </div>
        );
      })}
    </section>
  );
}
