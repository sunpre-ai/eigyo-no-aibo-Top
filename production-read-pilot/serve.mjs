import http from 'node:http';
import fs from 'node:fs/promises';

const useFixture = process.argv[2] === '--fixture';
if (!useFixture && process.argv[2] !== '--live')
  throw Error('起動引数に --fixture または --live を指定してください。');
const port = 8787, host = '127.0.0.1:' + port, origin = 'http://' + host;
const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/pilot.js': ['pilot.js', 'text/javascript; charset=utf-8'],
  '/case-view.mjs': ['case-view.mjs', 'text/javascript; charset=utf-8'],
  '/pilot.css': ['pilot.css', 'text/css; charset=utf-8'],
  '/css/tokens.css': ['../css/tokens.css', 'text/css; charset=utf-8'],
  '/mockup/mockup.css': ['../mockup/mockup.css', 'text/css; charset=utf-8'],
};
function fixture(input) {
  const roles = ['営業', 'CAD', '管理者'];
  if (input.action === 'redeem') {
    if (input.pairingCode !== '00000000-0000-4000-8000-000000000001')
      return { version: 1, ok: false, code: 'CODE_EXPIRED' };
    return { version: 1, ok: true, token: 'fixture-only', roles, cadLeader: true };
  }
  if (input.token !== 'fixture-only' || !roles.includes(input.role))
    return { version: 1, ok: false, code: 'FORBIDDEN' };
  const all = [
    { id: 'q-1', customer: '架空の受注先A', site: '営業の架空担当案件', sales: '担当A', cad: '担当B', outcome: '見積', stage: '見積提出', receivedDate: '2026-11-20', receiptNumber: '0001', quoteDeadline: '2026-11-30' },
    { id: 'q-2', customer: '架空の受注先B', site: 'CADの架空担当案件', sales: '担当B', cad: '担当A', outcome: '見積', stage: '入力中', receivedDate: '2026-11-21', receiptNumber: '0002', quoteDeadline: '2026-12-03' },
  ];
  const limited = input.role === '管理者' || (input.role === 'CAD' && input.scope === 'cad-team') ? all :
    all.filter(p => (input.role === 'CAD' ? p.cad : p.sales) === '担当A');
  return { version: 1, ok: true, user: { name: '架空の試験利用者' }, today: '2026-11-24', cases: limited };
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  const finish = (status, body = '', mime = 'text/plain; charset=utf-8') =>
    res.writeHead(status, { 'Content-Type': mime }).end(body);
  if (req.headers.host !== host) return finish(421);
  const pathname = !useFixture && req.url === '/?mode=live' ? '/' : req.url;
  if (req.method === 'GET' && Object.hasOwn(staticFiles, pathname)) {
    const [file, mime] = staticFiles[pathname];
    try {
      return finish(200, await fs.readFile(new URL(file, import.meta.url)), mime);
    } catch {
      return finish(404);
    }
  }
  if (!useFixture || req.method !== 'POST' || req.url !== '/api') return finish(404);
  if (req.headers.origin !== origin || req.headers['content-type'] !== 'application/json')
    return finish(403);
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 2048) return finish(413);
    }
    const input = JSON.parse(body);
    if (!['redeem', 'cases'].includes(input?.action)) return finish(400);
    return finish(200, JSON.stringify(fixture(input)), 'application/json; charset=utf-8');
  } catch {
    return finish(502);
  }
});
server.listen(port, '127.0.0.1', () => console.log('Local: ' + origin + '/'));
