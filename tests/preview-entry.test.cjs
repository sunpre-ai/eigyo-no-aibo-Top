const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
test('入口から架空データの画面見本へ進める', () => {
  const root = fs.readFileSync('index.html', 'utf8');
  const preview = fs.readFileSync('mockup/index.html', 'utf8');
  assert.ok(root.includes('./mockup/'));
  assert.ok(preview.includes('すべて架空データ'));
  assert.doesNotMatch(preview, /google\.script|script\.google\.com/);
});
