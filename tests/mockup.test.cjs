const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(hash = '#home') {
  const elements = new Map();
  for (const id of ['content', 'sidebar', 'tabbar', 'toast']) elements.set(id, { innerHTML: '', hidden: true });
  const listeners = {};
  const location = { hash };
  const add = (name, fn) => { (listeners[name] ||= []).push(fn); };
  const window = { addEventListener: add, scrollTo() {} };
  const document = { getElementById: id => elements.get(id), addEventListener: add };
  const context = vm.createContext({ document, window, location, setTimeout() {} });
  vm.runInContext(fs.readFileSync('mockup/mockup.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('mockup/cases.js', 'utf8'), context);
  return { elements, listeners, location };
}

test('ホームに指定された主要区画とプレビュー表示がある', () => {
  const { elements } = setup();
  const html = elements.get('content').innerHTML;
  for (const label of ['期限超過', '本日まで', '期限の近い仕事', '重要連絡', '工程別の進捗']) assert.ok(html.includes(label));
  assert.ok(html.includes('架空データ'));
  assert.ok(elements.get('sidebar').innerHTML.includes('aria-current="page"'));
});

test('案件の種類と過去物件の表示が切り替わる', () => {
  const { elements, listeners } = setup('#cases');
  assert.ok(!elements.get('content').innerHTML.includes('過去の現場 G'));
  for (const fn of listeners.change) fn({ target: { matches: () => true, checked: true } });
  assert.ok(elements.get('content').innerHTML.includes('過去の現場 G'));
  const event = { target: { closest: selector => selector === '[data-filter]' ? { dataset: { filter: '見積' } } : null } };
  for (const fn of listeners.click) fn(event);
  assert.ok(elements.get('content').innerHTML.includes('架空の現場 D'));
  assert.ok(!elements.get('content').innerHTML.includes('架空の現場 A'));
});

test('未実装の画面は完了したように見せない', () => {
  const { elements } = setup('#daily');
  assert.ok(elements.get('content').innerHTML.includes('まだ作成していません'));
});
