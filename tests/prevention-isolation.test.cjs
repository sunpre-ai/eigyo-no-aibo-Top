const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('画面見本は架空データで外部へ送信しない', () => {
  const source = fs.readFileSync("mockup/views/prevention.js", 'utf8');
  assert.ok(source.includes("ミス・再発防止"));
  assert.doesNotMatch(source, /google\.script|\bfetch\s*\(|localStorage/);
});
