const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor() { this.children = []; this.handlers = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
}

async function fixture({ enabled = true } = {}) {
  const { caseView } = await import('../production-read-pilot/case-view.mjs');
  const ids = ['status', 'login', 'dashboard', 'retry-login', 'past', 'bucket', 'cards', 'counts', 'refresh', 'filters', 'logout', 'google-login'];
  const elements = Object.fromEntries(ids.map(name => [name, new Element()]));
  elements.dashboard.hidden = true;
  elements.login.hidden = true;
  elements.bucket.value = '受注';
  elements.past.checked = false;
  let onSignIn;
  let scripts = 0;
  let expired = false;
  const calls = [];
  const api = {
    renderGoogleButton(_identity, _target, listener) { onSignIn = listener; },
    async cases(role) {
      calls.push(role);
      if (expired) throw { code: 'SESSION_EXPIRED' };
      return { today: '2026-11-24', cases: [
        { customer: '架空の受注先', site: '架空の担当案件', outcome: '受注' },
        { customer: '架空の受注先', site: '架空の過去案件', outcome: '受注', erection: '2026-08-01' },
      ] };
    },
    async logout() { calls.push('logout'); },
  };
  const document = {
    getElementById: name => elements[name], createElement: () => new Element(),
    head: { append(script) { scripts++; script.onload(); } },
  };
  const context = {
    caseView, configuration: {}, createPwaSession: () => { if (!enabled) throw Error(); return api; },
    document, window: { google: {} }, clearTimeout() {}, setTimeout() {},
  };
  const source = readFileSync('app/cases.mjs', 'utf8').replace(/^import .+;$/gm, '');
  vm.runInNewContext(source, context);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  return { elements, calls, scripts, settle, expire: () => { expired = true; },
    signIn: () => onSignIn({ ok: true, roles: ['CAD'], expiresAt: Date.now() + 900000 }) };
}

test('接続未設定の固定入口は、Googleログインもデータ取得も始めない', async () => {
  const { elements, calls, scripts } = await fixture({ enabled: false });
  assert.equal(elements.dashboard.hidden, true);
  assert.equal(elements.login.hidden, true);
  assert.match(elements.status.textContent, /準備中/);
  assert.equal(scripts, 0);
  assert.deepEqual(calls, []);
});

test('固定入口のGoogleログイン後は本人のCAD案件だけを表示し、失効で表示を消す', async () => {
  const f = await fixture();
  const { elements, calls } = f;
  assert.equal(elements.dashboard.hidden, true);
  f.signIn();
  await f.settle();
  assert.equal(elements.dashboard.hidden, false);
  assert.deepEqual(calls, ['CAD']);
  assert.match(elements.cards.children[0].children[0].textContent, /架空の担当案件/);
  assert.match(elements.counts.textContent, /受注 1件/);
  elements.past.checked = true;
  elements.past.handlers.change();
  assert.match(elements.counts.textContent, /受注 2件/);
  f.expire();
  elements.filters.handlers.submit({ preventDefault() {} });
  await f.settle();
  assert.equal(elements.dashboard.hidden, true);
  assert.equal(elements.cards.children.length, 0);
  assert.match(elements.status.textContent, /有効期限/);
});
