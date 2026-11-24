// 現行版の案件区分と過去物件条件に合わせる。
const buckets = ['見積', '受注', '上棟済', '失注'];
const cutoff = '2026-08-31';

export function caseBucket(p, today) {
  const erected = p.outcome === '受注' &&
    (p.erectionDone || (p.source === 'データ' && p.erection && p.erection < today &&
      !p.erectionPostponed && !p.erectionPending));
  return erected ? '上棟済' : p.outcome;
}
export function isPastCase(p) {
  return p.outcome === '受注' && !!p.erection && p.erection <= cutoff &&
    !p.erectionPostponed && !p.erectionPending;
}
export function caseView(cases, today, showPast, bucket) {
  const visible = cases.filter(p => showPast || !isPastCase(p));
  const groups = Object.fromEntries(buckets.map(key => [key, []]));
  for (const p of visible) groups[caseBucket(p, today)].push(p);
  return {
    counts: Object.fromEntries(buckets.map(key => [key, groups[key].length])),
    items: groups[bucket] || [],
  };
}
