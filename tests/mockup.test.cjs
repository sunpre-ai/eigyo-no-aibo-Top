const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(hash = '#home') {
  const elements = new Map();
  for (const id of ['content', 'sidebar', 'tabbar', 'toast']) elements.set(id, { innerHTML: '', hidden: true });
  const listeners = {};
  const location = { hash };
  const window = { addEventListener: (name, fn) => { listeners[name] = fn; }, scrollTo() {} };
  const document = { getElementById: id => elements.get(id), addEventListener: (name, fn) => { listeners[name] = fn; } };
  vm.runInNewContext(fs.readFileSync('mockup/mockup.js', 'utf8'), { document, window, location, setTimeout() {} });
  return { elements, listeners, location };
}

test('ホームに指定された主要区画とプレビュー表示がある', () => {
  const { elements } = setup();
  const html = elements.get('content').innerHTML;
  for (const label of ['期限超過', '本日まで', '期限の近い仕事', '重要連絡', '工程別の進捗']) assert.ok(html.includes(label));
  assert.ok(html.includes('架空データ'));
  assert.ok(elements.get('sidebar').innerHTML.includes('aria-current="page"'));
});

test('未実装の画面は完了したように見せない', () => {
  const { elements } = setup('#daily');
  assert.ok(elements.get('content').innerHTML.includes('まだ作成していません'));
});
