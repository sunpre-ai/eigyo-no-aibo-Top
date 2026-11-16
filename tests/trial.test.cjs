const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture(handler, storage = new Map()) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { id, value: '', textContent: '', hidden: false, disabled: false, children: [], listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, replaceChildren() { this.children = []; }, append(child) { this.children.push(child); } });
    return elements.get(id);
  };
  const context = vm.createContext({
    document: { getElementById: element, createElement: () => ({ textContent: '' }) }, navigator: {}, URL, AbortController, setTimeout, clearTimeout,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    crypto: { randomUUID: () => 'a0c0d0e0-1111-4222-8333-444444444444' },
    fetch: async (url, options) => handler(url, options),
  });
  vm.runInContext(fs.readFileSync('trial.js', 'utf8'), context);
  element('api-url').value = 'https://script.google.com/macros/s/dummy/exec';
  return { element, storage };
}

test('再送は元の要求IDを維持し、本文で認証情報を送る', async () => {
  const calls = [];
  let firstWrite = true;
  const app = fixture(async (url, options) => {
    const body = JSON.parse(options.body); calls.push({ url, options, body });
    if (body.action === 'add' && firstWrite) { firstWrite = false; throw Error('応答が届かない'); }
    const data = body.action === 'start' ? { ok: true, token: '架空トークン' } : { ok: true, items: body.action === 'list' ? [] : ['架空データ'] };
    return { ok: true, json: async () => data };
  });
  await app.element('connect').listeners.click();
  app.element('item-name').value = '架空データ';
  app.element('write-form').listeners.submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(app.element('status').textContent, /保存結果を確認できません/);
  await app.element('retry').listeners.click();
  await new Promise(resolve => setImmediate(resolve));
  const writes = calls.filter(call => call.body.action === 'add');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].body.requestId, writes[1].body.requestId);
  assert.equal(writes[0].options.headers['Content-Type'], 'text/plain;charset=utf-8');
  assert.equal(writes[0].options.credentials, 'omit');
  assert.ok(!writes[0].url.includes('架空トークン'));
  assert.match(app.element('status').textContent, /保存しました/);
  assert.equal(app.storage.size, 0);
});

test('無効セッションと読めない応答を区別する', async () => {
  let count = 0;
  const app = fixture(async () => ({ ok: true, json: async () => ++count === 1 ? { ok: true, token: '仮' } : { ok: false, code: 'SESSION_EXPIRED', error: '期限切れ' } }));
  await app.element('connect').listeners.click();
  assert.match(app.element('status').textContent, /有効期限が切れました/);
  const broken = fixture(async () => ({ ok: true, json: async () => { throw Error('JSONではない'); } }));
  await broken.element('connect').listeners.click();
  assert.match(broken.element('status').textContent, /接続できません/);
});
