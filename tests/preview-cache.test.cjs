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
  const previewHtml = fs.readFileSync('mockup/index.html', 'utf8');
  for (const name of ['./css/tokens.css', './mockup/mockup.css', './mockup/mockup.js', './mockup/cases.js', './mockup/sections.js', './mockup/detail-panels.js']) {
    assert.ok(saved.includes(`${name}?v=20261118-3`));
    assert.ok(previewHtml.includes(`${name.startsWith('./css/') ? '../css/' + name.slice('./css/'.length) : './' + name.slice('./mockup/'.length)}?v=20261118-3`));
  }
  for (const name of fs.readdirSync('mockup/views').filter(name => name.endsWith('.js'))) {
    assert.ok(previewHtml.includes(`./views/${name}?v=20261118-3`));
    assert.ok(saved.includes(`./mockup/views/${name}?v=20261118-3`));
  }
  assert.ok(saved.every(name => !name.startsWith('https://script.google.com/')));
  let intercepted = false;
  handlers.fetch({ request: { method: 'POST', url: 'https://script.google.com/macros/s/test/exec' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
  handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://example.test/eigyo-no-aibo-Top/mockup/login.html' }, respondWith: value => { pending = value; } });
  assert.equal(await pending, './mockup/login.html');
});
