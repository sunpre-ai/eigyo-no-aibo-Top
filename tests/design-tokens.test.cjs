const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('共通トークンの最小文字サイズと操作範囲を守る', () => {
  const css = fs.readFileSync('css/tokens.css', 'utf8');
  assert.match(css, /--fs-label:\s*13px/);
  assert.match(css, /--touch:\s*44px/);
  assert.match(css, /--button-height:\s*48px/);
  for (const match of css.matchAll(/--fs-[\w-]+:\s*(\d+)px/g)) assert.ok(Number(match[1]) >= 13);
});

test('共通部品の色と文字サイズはトークンを使う', () => {
  const css = fs.readFileSync('css/parts.css', 'utf8');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
  for (const match of css.matchAll(/font-size\s*:\s*([^;}]+)/g)) assert.match(match[1], /var\(--fs-/);
});
