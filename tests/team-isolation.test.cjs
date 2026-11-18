const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('画面見本は架空データで外部へ送信しない', () => {
  const source = fs.readFileSync("mockup/views/team.js", 'utf8');
  assert.ok(source.includes("出荷に向けた工程"));
  assert.doesNotMatch(source, /google\.script|\bfetch\s*\(|localStorage/);
});
