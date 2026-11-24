const test = require('node:test');
const assert = require('node:assert/strict');

test('案件区分と過去物件の切り替えは、上棟済・延期・本日上棟を区別する', async () => {
  const { caseView } = await import('../production-read-pilot/case-view.mjs');
  const rows = [
    { id: 'quote', outcome: '見積' },
    { id: 'lost', outcome: '失注' },
    { id: 'past', outcome: '受注', source: 'データ', erection: '2026-08-31' },
    { id: 'done', outcome: '受注', source: 'データ', erection: '2026-11-20' },
    { id: 'postponed', outcome: '受注', source: 'データ', erection: '2026-08-30', erectionPostponed: true },
    { id: 'today', outcome: '受注', source: 'データ', erection: '2026-11-24' },
  ];
  const current = caseView(rows, '2026-11-24', false, '受注');
  assert.deepEqual(current.counts, { 見積: 1, 受注: 2, 上棟済: 1, 失注: 1 });
  assert.deepEqual(current.items.map(p => p.id), ['postponed', 'today']);
  const past = caseView(rows, '2026-11-24', true, '上棟済');
  assert.deepEqual(past.items.map(p => p.id), ['past', 'done']);
});
