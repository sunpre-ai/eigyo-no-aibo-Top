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
  const context = vm.createContext({ document, window, location, URLSearchParams, setTimeout() {} });
  vm.runInContext(fs.readFileSync('mockup/mockup.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('mockup/cases.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('mockup/detail-panels.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('mockup/sections.js', 'utf8'), context);
  for (const name of ['team', 'questions', 'notices', 'cad-month', 'cad-team', 'quotes', 'cancel', 'prevention', 'trouble', 'daily', 'performance', 'prospects', 'schedule', 'settings']) vm.runInContext(fs.readFileSync(`mockup/views/${name}.js`, 'utf8'), context);
  return { elements, listeners, location };
}

test('ホームに指定された主要区画とプレビュー表示がある', () => {
  const { elements } = setup();
  const html = elements.get('content').innerHTML;
  for (const label of ['期限超過', '本日まで', '期限の近い仕事', '重要連絡', '工程別の進捗']) assert.ok(html.includes(label));
  assert.ok(html.includes('架空データ'));
  assert.ok(elements.get('sidebar').innerHTML.includes('aria-current="page"'));
});

test('期限超過タイルから期限超過の仕事だけを表示する', () => {
  const { elements } = setup('#works?state=late');
  const html = elements.get('content').innerHTML;
  assert.ok(html.includes('見積図面を入力する'));
  assert.ok(!html.includes('木取表を提出する'));
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

test('案件詳細は選択した架空案件の情報を表示する', () => {
  const { elements } = setup('#detail-b');
  const html = elements.get('content').innerHTML;
  assert.ok(html.includes('架空の現場 B'));
  assert.ok(html.includes('1/15'));
  assert.ok(!html.includes('架空の現場 A'));
  assert.ok(html.includes('送信・保存されません'));
  for (const label of ['引き継ぎメモ', '仮木取表', '特殊材', '在庫確認', '構造計算', '現場下見', '上棟の延期']) assert.ok(html.includes(label), label);
});

test('未接続の画面は表示見本だと明示する', () => {
  const { elements } = setup('#daily');
  assert.ok(elements.get('content').innerHTML.includes('見本'));
});

test('工程・チーム画面は主要な区画を表示する', () => {
  const { elements } = setup('#team');
  const html = elements.get('content').innerHTML;
  for (const label of ['更新ダイジェスト', '出荷に向けた工程', '今日のCAD作業', 'ミス・再発防止', '今日の案件・確認事項']) assert.ok(html.includes(label));
});

test('主要な各画面が見出しを生成する', () => {
  const paths = ['#home', '#cases', '#works', '#team', '#questions', '#notices', '#cad-month', '#cad-team', '#quotes', '#cancel', '#prevention', '#trouble', '#daily', '#performance', '#prospects', '#schedule', '#settings', '#more', '#detail-a'];
  for (const path of paths) {
    const { elements } = setup(path);
    const html = elements.get('content').innerHTML;
    assert.ok(html.includes('<h1'), path);
    assert.ok(!html.includes('google.script'), path);
  }
});
