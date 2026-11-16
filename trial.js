// 架空データだけを扱うログイン試験。正式な業務用の認証ではない。
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});

const byId = id => document.getElementById(id);
const endpoint = window.PWA_TRIAL_API_URL || '';
const googleClientId = window.PWA_TRIAL_GOOGLE_CLIENT_ID || '';
const pendingKey = 'aibo-pwa-trial-pending-v1', sessionKey = 'aibo-pwa-trial-session-v1';
let token = '', pending = null, busy = false, googleInitialized = false;
const setStatus = message => { byId('status').textContent = message; };
function removeLocal(key) { try { localStorage.removeItem(key); } catch { /* 次回も期限とサーバーの認証を確認する。 */ } }
function clearSession() { token = ''; removeLocal(sessionKey); }
function setBusy(value) {
  busy = value;
  byId('signin-area').hidden = !!token;
  byId('read').disabled = value || !token;
  byId('logout').disabled = value || !token || !!pending;
  byId('item-name').disabled = value || !token || !!pending;
  byId('write').disabled = value || !token || !!pending;
  byId('retry').disabled = value || !token;
}
function validEndpoint(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}
async function request(action, details = {}) {
  if (!validEndpoint(endpoint)) return { kind: 'failure', error: '試験用の接続先が設定されていません。' };
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
  if (result.code === 'SESSION_EXPIRED') { clearSession(); showItems([]); setStatus('ログインの有効期限が切れました。Googleでログインしてください。'); return; }
  setStatus(result.error);
}
async function readItems() {
  const result = await request('list');
  if (result.kind === 'success' && Array.isArray(result.data.items)) { showItems(result.data.items); setStatus(pending ? '保存結果を確認してください。' : '架空データを読み込みました。'); }
  else if (result.kind === 'success') setStatus('接続できません。応答を確認できませんでした。');
  else handleFailure(result);
}
async function handleGoogleCredential(response) {
  if (busy || token || !response?.credential) return;
  setBusy(true); setStatus('Googleログインを確認しています…');
  const result = await request('login', { credential: response.credential });
  if (result.kind === 'success' && typeof result.data.token === 'string' && Number.isFinite(result.data.expires) && result.data.expires > Date.now()) {
    token = result.data.token;
    let retained = false;
    try { localStorage.setItem(sessionKey, JSON.stringify({ endpoint, token, expires: result.data.expires })); retained = true; } catch { /* この画面では継続して利用できる。 */ }
    await readItems();
    if (token && !retained) setStatus('ログインできました。この端末では保持できないため、次回は再ログインが必要です。');
  } else if (result.kind === 'success') setStatus('ログインの応答を確認できませんでした。');
  else handleFailure(result);
  setBusy(false);
}
function initializeGoogle() {
  if (googleInitialized || !window.google?.accounts?.id) return;
  if (!googleClientId) { if (!token) setStatus('Googleログインの試験設定を準備しています。'); return; }
  window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
  window.google.accounts.id.renderButton(byId('google-signin'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ja' });
  googleInitialized = true;
  if (!token && !pending) setStatus('Googleでログインしてください。');
}
byId('google-identity').addEventListener('load', initializeGoogle);
byId('google-identity').addEventListener('error', () => { if (!token) setStatus('Googleログインを読み込めません。通信状態を確認してください。'); });
initializeGoogle();
byId('read').addEventListener('click', async () => { if (busy) return; setBusy(true); await readItems(); setBusy(false); });
byId('logout').addEventListener('click', async () => {
  if (busy || !token || pending) return;
  setBusy(true); setStatus('ログアウトしています…');
  const result = await request('logout');
  if (result.kind === 'success' || result.code === 'SESSION_EXPIRED') { clearSession(); showItems([]); setStatus('ログアウトしました。'); }
  else if (result.kind === 'connection') setStatus('ログアウトを確認できません。通信状態を確認して再試行してください。');
  else handleFailure(result);
  setBusy(false);
});
async function submitPending() {
  setBusy(true); setStatus('保存結果を確認しています…');
  const result = await request('add', pending);
  if (result.kind === 'success' && Array.isArray(result.data.items)) {
    pending = null; removeLocal(pendingKey); byId('retry').hidden = true; byId('item-name').value = ''; showItems(result.data.items); setStatus('架空データを保存しました。');
  } else if (result.kind === 'failure' && ['INVALID', 'CONFLICT', 'LIMIT', 'BUSY'].includes(result.code)) {
    pending = null; removeLocal(pendingKey); byId('retry').hidden = true; handleFailure(result);
  } else {
    byId('retry').hidden = false;
    if (result.code === 'SESSION_EXPIRED') clearSession();
    setStatus(token ? '保存結果を確認できません。通信を確認して再試行してください。' : 'ログインの有効期限が切れました。再ログインして保存結果を確認してください。');
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
    pending = saved.pending; byId('retry').hidden = false;
  }
  const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
  if (session && session.endpoint === endpoint && typeof session.token === 'string' && Number.isFinite(session.expires) && session.expires > Date.now()) token = session.token;
  else removeLocal(sessionKey);
} catch { /* 壊れた保存情報は使用せず、ログインし直す。 */ }
setBusy(false);
if (token) { setBusy(true); setStatus('ログインを確認しています…'); readItems().finally(() => setBusy(false)); }
else if (pending) setStatus('前回の保存結果を確認するため、Googleでログインしてください。');
