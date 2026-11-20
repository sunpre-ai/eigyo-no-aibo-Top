const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('画面見本は架空データで外部へ送信しない', () => {
  const source = fs.readFileSync('mockup/views/quote-reception.html', 'utf8');
  assert.match(source, /id="qr-new"[^>]*>.*新規受付/);
  assert.match(source, /id="qr-calendargrid"/);
  assert.match(source, /default-src 'none'.*form-action 'none'/);
  assert.doesNotMatch(source, /google\.script|\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|setWidgetState/);
});

test('見積用に隔離した受付画面だけを表示し、この画面の高さだけを受け付ける', () => {
  let view;
  let resize;
  const frame = { contentWindow: {}, style: {} };
  const window = {
    registerPreviewView(name, render) { assert.equal(name, 'quotes'); view = render; },
    addEventListener(name, listener) { assert.equal(name, 'message'); resize = listener; },
  };
  const document = { getElementById(name) { return name === 'quote-reception-frame' ? frame : null; } };
  vm.runInNewContext(fs.readFileSync('mockup/views/quotes.js', 'utf8'), { document, window });
  const html = view();
  assert.match(html, /<h1[^>]*>見積用<\/h1>/);
  assert.match(html, /src="\.\/views\/quote-reception\.html\?v=20261120-1"/);
  assert.match(html, /sandbox="allow-scripts"/);
  const data = { type: 'quote-reception-preview:resize', height: 1100 };
  resize({ source: {}, data });
  assert.equal(frame.style.height, undefined);
  resize({ source: frame.contentWindow, data });
  assert.equal(frame.style.height, '1100px');
});
