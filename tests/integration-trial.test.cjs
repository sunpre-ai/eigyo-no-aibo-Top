const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ saved = true, response = { ok: true, user: { name: '架空の担当者', roles: ['CAD'] }, cases: [{ id: 'a', customer: '架空の受注先', site: '架空の現場', status: '確認中', due: '' }] } } = {}) {
  const endpoint = 'https://script.google.com/macros/s/test/exec';
  const elements = new Map();
  function element() {
    return { textContent: '', children: [], disabled: false, addEventListener(name, handler) { this.handler = handler; }, replaceChildren() { this.children = []; }, append(...items) { this.children.push(...items); } };
  }
  for (const id of ['status', 'refresh', 'profile', 'cases']) elements.set(id, element());
  let requested = null;
  const context = vm.createContext({
    window: { PWA_TRIAL_API_URL: endpoint },
    document: { getElementById: id => elements.get(id), createElement: () => element() },
    localStorage: { getItem: () => saved ? JSON.stringify({ endpoint, token: 'test-token', expires: Date.now() + 60000 }) : null },
    URL, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => { requested = { url, options }; if (response instanceof Error) throw response; return { ok: true, json: async () => response }; },
  });
  vm.runInContext(fs.readFileSync('integration-trial/dashboard.js', 'utf8'), context);
  return { elements, request: () => requested };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('ログイン済みの本人情報と試験案件を読み取り専用で表示する', async () => {
  const f = fixture(); await settle();
  assert.match(f.elements.get('profile').textContent, /架空の担当者/);
  assert.equal(f.elements.get('cases').children.length, 1);
  assert.equal(f.request().options.credentials, 'omit');
  assert.equal(f.request().options.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.equal(JSON.parse(f.request().options.body).action, 'dashboard');
  assert.equal(new URL(f.request().url).search, '');
});

test('セッションがなければAPIを呼ばずログインを案内する', async () => {
  const f = fixture({ saved: false }); await settle();
  assert.equal(f.request(), null);
  assert.match(f.elements.get('status').textContent, /ログインが必要/);
});

test('権限拒否、設定不足、通信失敗を分け、古い画面を残さない', async () => {
  for (const [response, message] of [[{ ok: false, code: 'FORBIDDEN' }, /登録されていません/], [{ ok: false, code: 'NOT_CONFIGURED' }, /設定が完了していません/], [new Error('offline'), /接続できません/], [{ ok: true, user: {}, cases: [] }, /接続できません/]]) {
    const f = fixture({ response }); await settle();
    assert.match(f.elements.get('status').textContent, message);
    assert.equal(f.elements.get('cases').children.length, 0);
  }
});
