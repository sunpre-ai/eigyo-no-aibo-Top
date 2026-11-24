const test = require('node:test');
const assert = require('node:assert/strict');

const endpoint = 'https://api.example.test/api/v2';
const appsScriptEndpoint = 'https://script.google.com/macros/s/AKfycb-example_123/exec';
const clientId = 'sample.apps.googleusercontent.com';
const nonce = 'n'.repeat(48);
const token = 's'.repeat(50);
const ok = fields => Response.json({ version: 2, ok: true, ...fields });

async function fixture(apiUrl = endpoint) {
  const { createPwaSession } = await import('../production-auth/session.mjs');
  const calls = [];
  const outcomes = [];
  const config = { now: 1000 };
  const handlers = {
    loginChallenge: () => ok({ nonce, expiresAt: 1100 }),
    login: () => ok({ token, expiresAt: 1400, roles: ['CAD'] }),
    cases: () => ok({ cases: [] }),
    logout: () => ok({}),
  };
  const identity = {
    initialize(options) { this.options = options; },
    renderButton(target) { this.target = target; },
  };
  const api = createPwaSession({ apiUrl, clientId, now: () => config.now, fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, options, body });
    return handlers[body.action](body);
  } });
  const target = {};
  async function render() {
    await api.renderGoogleButton({ accounts: { id: identity } }, target, value => outcomes.push(value));
    return identity.options.callback;
  }
  return { api, calls, outcomes, config, handlers, identity, target, render, createPwaSession };
}

test('本番API接続先は明示設定を必要とし、試験用・HTTP・URL認証情報へは接続しない', async () => {
  const { createPwaSession } = await fixture();
  for (const apiUrl of [undefined, 'http://example.test/api/v2', 'https://a:b@example.test/api/v2',
    endpoint + '?test=1', endpoint.replace('/v2', '/v1'), appsScriptEndpoint.replace('script.google.com', 'example.test'),
    appsScriptEndpoint.replace('/exec', '/dev'), appsScriptEndpoint + '?test=1']) {
    assert.throws(() => createPwaSession({ apiUrl, clientId }), { code: 'NOT_CONFIGURED' });
  }
  assert.throws(() => createPwaSession({ apiUrl: endpoint }), { code: 'NOT_CONFIGURED' });
});

test('専用GASの /exec へAPIの版をPOSTし、Googleログインボタンを初期化する', async () => {
  const f = await fixture(appsScriptEndpoint);
  await f.render();
  assert.equal(f.identity.options.nonce, nonce);
  assert.equal(f.calls[0].url, appsScriptEndpoint);
  assert.deepEqual(f.calls[0].body, { version: 2, action: 'loginChallenge' });
});

test('発行されたnonceでGoogleボタンを初期化し、IDトークンとセッションを別の用途に使う', async () => {
  const f = await fixture();
  await assert.rejects(f.api.cases('CAD'), { code: 'SESSION_EXPIRED' });
  const callback = await f.render();
  assert.equal(f.identity.target, f.target);
  assert.equal(f.identity.options.nonce, nonce);
  assert.equal(f.identity.options.client_id, clientId);
  await Promise.all([callback({ credential: 'fake-id-token' }), callback({ credential: 'same-callback' })]);
  assert.deepEqual(f.outcomes, [{ ok: true, roles: ['CAD'], expiresAt: 1400 }]);
  await f.api.cases('CAD');
  await f.api.logout();
  await assert.rejects(f.api.cases('CAD'), { code: 'SESSION_EXPIRED' });
  assert.deepEqual(f.calls.map(({ body }) => body), [
    { version: 2, action: 'loginChallenge' },
    { version: 2, action: 'login', credential: 'fake-id-token', nonce },
    { version: 2, action: 'cases', token, role: 'CAD', scope: 'personal' },
    { version: 2, action: 'logout', token },
  ]);
  assert.ok(f.calls.every(({ url, options }) => url === endpoint && options.cache === 'no-store' &&
    options.credentials === 'omit' && options.referrerPolicy === 'no-referrer'));
});

test('期限切れ・古いGoogleの結果・ログアウト後の結果からセッションを復元しない', async () => {
  const f = await fixture();
  const old = await f.render();
  let callback = await f.render();
  await old({ credential: 'fake' });
  f.config.now = 1100;
  await callback({ credential: 'fake' });
  assert.equal(f.outcomes[0].code, 'LOGIN_EXPIRED');
  assert.equal(f.calls.length, 2);
  f.config.now = 1000;
  callback = await f.render();
  let continueResponse;
  f.handlers.login = () => new Promise(resolve => { continueResponse = resolve; });
  const pending = callback({ credential: 'fake' });
  await f.api.logout();
  continueResponse(ok({ token, expiresAt: 1400, roles: ['CAD'] }));
  await pending;
  await assert.rejects(f.api.cases('CAD'), { code: 'SESSION_EXPIRED' });
  assert.equal(f.outcomes.length, 1);
});

test('非JSON通信・アプリの権限エラー・API版違いを区別し、失効後は再取得しない', async () => {
  const f = await fixture();
  const callback = await f.render();
  await callback({ credential: 'fake' });
  for (const [response, code] of [
    [new Response('<html></html>'), 'CONNECTION'],
    [Response.json({ version: 1, ok: true, cases: [] }), 'VERSION'],
    [Response.json({ version: 2, ok: false, code: 'FORBIDDEN' }), 'FORBIDDEN'],
    [Response.json({ version: 2, ok: false, code: 'SESSION_EXPIRED' }), 'SESSION_EXPIRED'],
  ]) {
    f.handlers.cases = () => response;
    await assert.rejects(f.api.cases('CAD'), { code });
  }
  const count = f.calls.length;
  await assert.rejects(f.api.cases('CAD'), { code: 'SESSION_EXPIRED' });
  assert.equal(f.calls.length, count);
});

test('保存されていないローカルのセッションは、通信断でログアウト通知が届かなくても消える', async () => {
  const f = await fixture();
  const callback = await f.render();
  await callback({ credential: 'fake' });
  f.handlers.logout = () => { throw Error('通信断'); };
  await assert.rejects(f.api.logout(), { code: 'CONNECTION' });
  await assert.rejects(f.api.cases('CAD'), { code: 'SESSION_EXPIRED' });
});
