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
  let callback;
  const google = { accounts: { id: { initialize: options => { callback = options.callback; }, renderButton() {} } } };
  const context = vm.createContext({
    document: { getElementById: element, createElement: () => ({ textContent: '' }) }, navigator: {}, window: { PWA_TRIAL_API_URL: 'https://script.google.com/macros/s/dummy/exec', PWA_TRIAL_GOOGLE_CLIENT_ID: 'client-for-tests', google }, URL, AbortController, setTimeout, clearTimeout,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    crypto: { randomUUID: () => 'a0c0d0e0-1111-4222-8333-444444444444' },
    fetch: async (url, options) => handler(url, options),
  });
  vm.runInContext(fs.readFileSync('trial.js', 'utf8'), context);
  return { element, storage, login: () => callback({ credential: 'fake-id-token' }) };
}

test('ログイン後の再送は元の要求IDを維持し、認証情報は本文で送る', async () => {
  const calls = []; let firstWrite = true;
  const app = fixture(async (url, options) => {
    const body = JSON.parse(options.body); calls.push({ url, options, body });
    if (body.action === 'add' && firstWrite) { firstWrite = false; throw Error('応答が届かない'); }
    const data = body.action === 'login' ? { ok: true, token: '架空トークン', expires: Date.now() + 60000 } : { ok: true, items: body.action === 'list' ? [] : ['架空データ'] };
    return { ok: true, json: async () => data };
  });
  await app.login();
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
  assert.equal(app.storage.has('aibo-pwa-trial-pending-v1'), false);
});

test('期限切れとJSONとして読めない通信を区別する', async () => {
  let count = 0;
  const app = fixture(async () => ({ ok: true, json: async () => ++count === 1 ? { ok: true, token: '仮', expires: Date.now() + 60000 } : { ok: false, code: 'SESSION_EXPIRED', error: '期限切れ' } }));
  await app.login();
  assert.match(app.element('status').textContent, /有効期限が切れました/);
  assert.equal(app.storage.has('aibo-pwa-trial-session-v1'), false);
  const broken = fixture(async () => ({ ok: true, json: async () => { throw Error('JSONではない'); } }));
  await broken.login();
  assert.match(broken.element('status').textContent, /接続できません/);
});

test('再読込後はGoogleログインを繰り返さず、同じ要求IDで再試行する', async () => {
  const calls = [], storage = new Map();
  const handler = async (url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    if (body.action === 'add' && calls.filter(call => call.action === 'add').length === 1) throw Error('応答が届かない');
    return { ok: true, json: async () => body.action === 'login' ? { ok: true, token: '仮', expires: Date.now() + 60000 } : { ok: true, items: [] } };
  };
  const first = fixture(handler, storage);
  await first.login();
  first.element('item-name').value = '架空データ';
  first.element('write-form').listeners.submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  const reopened = fixture(handler, storage);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.filter(call => call.action === 'login').length, 1);
  assert.match(reopened.element('status').textContent, /保存結果を確認/);
  await reopened.element('retry').listeners.click();
  await new Promise(resolve => setImmediate(resolve));
  const writes = calls.filter(call => call.action === 'add');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].requestId, writes[1].requestId);
  assert.equal(storage.has('aibo-pwa-trial-pending-v1'), false);
});

test('ログアウトはサーバー側の無効化が確認できてから端末のセッションを消す', async () => {
  let logoutFails = true;
  const app = fixture(async (url, options) => {
    const body = JSON.parse(options.body);
    if (body.action === 'logout' && logoutFails) throw Error('通信不可');
    return { ok: true, json: async () => body.action === 'login' ? { ok: true, token: '仮', expires: Date.now() + 60000 } : { ok: true, items: [] } };
  });
  await app.login();
  await app.element('logout').listeners.click();
  assert.match(app.element('status').textContent, /ログアウトを確認できません/);
  assert.equal(app.storage.has('aibo-pwa-trial-session-v1'), true);
  logoutFails = false;
  await app.element('logout').listeners.click();
  assert.equal(app.storage.has('aibo-pwa-trial-session-v1'), false);
});
