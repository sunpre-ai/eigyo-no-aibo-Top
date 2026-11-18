const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('画面見本の静的ファイルだけを保存し、外部APIをキャッシュしない', async () => {
  const handlers = {};
  let saved = [];
  const cache = { addAll: async entries => { saved = [...entries]; } };
  const self = { location: { origin: 'https://example.test' }, addEventListener: (name, fn) => { handlers[name] = fn; } };
  const caches = { open: async () => cache, keys: async () => [], match: async key => key };
  vm.runInNewContext(fs.readFileSync('service-worker.js', 'utf8'), { self, caches, URL, fetch: async () => { throw Error('offline'); } });
  let pending;
  handlers.install({ waitUntil: value => { pending = value; } });
  await pending;
  for (const name of ['./mockup/index.html', './mockup/login.html', './mockup/cases.js', './mockup/sections.js']) assert.ok(saved.includes(name));
  assert.ok(saved.every(name => !name.startsWith('https://script.google.com/')));
  let intercepted = false;
  handlers.fetch({ request: { method: 'POST', url: 'https://script.google.com/macros/s/test/exec' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://example.test/eigyo-no-aibo-Top/mockup/login.html' }, respondWith: value => { pending = value; } });
  assert.equal(await pending, './mockup/login.html');
});
