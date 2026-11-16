// この画面は架空データ専用。試験セッションは本人確認ではない。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

const byId = id => document.getElementById(id);
const endpoint = window.PWA_TRIAL_API_URL || '';
let token = '', pending = null, busy = false;
const pendingKey = 'aibo-pwa-trial-pending-v1';
function clearPendingStorage() { try { localStorage.removeItem(pendingKey); } catch { /* 保存情報の消去は次回の確認でも安全に再試行できる。 */ } }
const setStatus = message => { byId('status').textContent = message; };
function setBusy(value) {
  busy = value;
  byId('connect').disabled = value;
  byId('read').disabled = value || !token;
  byId('item-name').disabled = value || !token || !!pending;
  byId('write').disabled = value || !token || !!pending;
  byId('retry').disabled = value;
}
function validEndpoint(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}
async function request(action, details = {}) {
  let response, result;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, credentials: 'omit', signal: controller.signal, body: JSON.stringify({ action, token, ...details }) });
    if (!response.ok) throw new Error();
    result = await response.json();
    if (!result || typeof result.ok !== 'boolean') throw new Error();
  } catch { return { kind: 'connection' }; } finally { clearTimeout(timeout); }
  return result.ok ? { kind: 'success', data: result } : { kind: 'failure', error: result.error || '試験を完了できませんでした。', code: result.code };
}
function showItems(items) {
  const list = byId('items'); list.replaceChildren();
  for (const item of items) { const li = document.createElement('li'); li.textContent = item; list.append(li); }
}
function handleFailure(result) {
  if (result.kind === 'connection') { setStatus('接続できません。通信状態を確認してください。'); return; }
  if (result.code === 'SESSION_EXPIRED') { token = ''; setStatus('試験の有効期限が切れました。「試験を開始」を押してください。'); return; }
  setStatus(result.error);
}
async function readItems() {
  const result = await request('list');
  if (result.kind === 'success' && Array.isArray(result.data.items)) { showItems(result.data.items); setStatus('架空データを読み込みました。'); }
  else if (result.kind === 'success') setStatus('接続できません。応答を確認できませんでした。');
  else handleFailure(result);
}
byId('connect').addEventListener('click', async () => {
  if (!validEndpoint(endpoint)) { setStatus('試験用の接続先が設定されていません。'); return; }
  token = ''; setBusy(true); setStatus('試験を開始しています…');
  const result = await request('start');
  if (result.kind === 'success' && typeof result.data.token === 'string' && result.data.token) { token = result.data.token; if (pending) setStatus('試験を再開しました。保存結果を確認してください。'); else await readItems(); }
  else if (result.kind === 'success') setStatus('接続できません。応答を確認できませんでした。');
  else handleFailure(result);
  setBusy(false);
});
byId('read').addEventListener('click', async () => { if (busy) return; setBusy(true); await readItems(); setBusy(false); });
async function submitPending() {
  setBusy(true); setStatus('保存結果を確認しています…');
  const result = await request('add', pending);
  if (result.kind === 'success' && Array.isArray(result.data.items)) {
    pending = null; clearPendingStorage(); byId('retry').hidden = true; byId('item-name').value = ''; showItems(result.data.items); setStatus('架空データを保存しました。');
  } else if (result.kind === 'failure' && ['INVALID', 'CONFLICT', 'LIMIT', 'BUSY'].includes(result.code)) {
    pending = null; clearPendingStorage(); byId('retry').hidden = true; handleFailure(result);
  } else {
    byId('retry').hidden = false;
    if (result.code === 'SESSION_EXPIRED') token = '';
    setStatus(token ? '保存結果を確認できません。通信を確認して再試行してください。' : '試験セッションが切れました。「試験を開始」を押してから保存結果を確認してください。');
  }
  setBusy(false);
}
byId('write-form').addEventListener('submit', event => {
  event.preventDefault(); if (busy || pending || !token) return;
  const name = byId('item-name').value.trim(); if (!name) return;
  if (!crypto.randomUUID) { setStatus('この端末では安全な要求IDを作成できません。'); return; }
  const candidate = { requestId: crypto.randomUUID(), name };
  try { localStorage.setItem(pendingKey, JSON.stringify({ endpoint, pending: candidate })); }
  catch { setStatus('保存結果の確認情報を端末に記録できないため、送信しませんでした。'); return; }
  pending = candidate; byId('retry').hidden = false; submitPending();
});
byId('retry').addEventListener('click', () => { if (!busy && token && pending) submitPending(); });

try {
  const saved = JSON.parse(localStorage.getItem(pendingKey) || 'null');
  if (saved && saved.endpoint === endpoint && validEndpoint(endpoint) && typeof saved.pending?.requestId === 'string' && typeof saved.pending?.name === 'string') {
    pending = saved.pending;
    byId('retry').hidden = false; setStatus('前回の保存結果を確認します。「試験を開始」を押してください。');
  }
} catch { /* 端末の保存情報が使えない場合は、新しい試験として開始する。 */ }
setBusy(false);
