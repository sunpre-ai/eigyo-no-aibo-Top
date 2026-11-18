const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('案件一覧の見本に種類と過去物件の表示がある', () => {
  const source = fs.readFileSync('mockup/cases.js', 'utf8');
  for (const text of ['見積', '受注', '上棟済', '失注', '過去物件を表示']) assert.ok(source.includes(text), text);
});
