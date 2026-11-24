// 実際の試験GASで保存後の応答喪失を再現する。業務データは扱わない。
const endpoint = window.PWA_TRIAL_API_URL;
const status = document.getElementById('status');
const results = document.getElementById('results');
const button = document.getElementById('run');
function note(message) { const item = document.createElement('li'); item.textContent = message; results.append(item); }
function getSession() {
  const session = JSON.parse(localStorage.getItem('aibo-pwa-trial-session-v1') || 'null');
  if (!session || session.endpoint !== endpoint || !session.token || session.expires <= Date.now()) throw Error('試験画面でログインしてから、もう一度お試しください。');
  return session.token;
}
async function send(token, action, extra = {}, signal = AbortSignal.timeout(30000)) {
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, credentials: 'omit', body: JSON.stringify({ action, token, ...extra }), signal });
  if (!response.ok) throw Error('試験GASに接続できませんでした。');
  return response;
}
async function read(token) {
  const result = await (await send(token, 'list')).json();
  if (!result.ok || !Array.isArray(result.items) || !Array.isArray(result.notices)) throw Error('架空データと試験通知を確認できませんでした。');
  return result;
}
function counts(result, name, requestId) {
  return {
    saved: result.items.filter(item => item === name).length,
    notices: result.notices.filter(notice => notice.requestId === requestId).length,
  };
}
button.addEventListener('click', async () => {
  button.disabled = true; results.replaceChildren(); status.textContent = '試験しています…';
  try {
    const token = getSession();
    const name = '架空の再送確認 ' + crypto.randomUUID().slice(0, 8);
    const requestId = crypto.randomUUID();
    const before = await read(token);
    const initial = counts(before, name, requestId);
    if (initial.saved || initial.notices) throw Error('試験データが既に存在します。');
    const controller = new AbortController();
    await send(token, 'add', { requestId, name }, controller.signal);
    controller.abort();
    note('初回の応答本文の受信を中断しました。');
    const afterFirst = await read(token);
    const first = counts(afterFirst, name, requestId);
    if (first.saved !== 1 || first.notices !== 1) throw Error('初回の保存・通知を確認できませんでした。');
    note('試験用GASの初回保存と本人宛てのアプリ内通知が各1件でした。');
    const retried = await (await send(token, 'add', { requestId, name })).json();
    if (!retried.ok) throw Error('再送が拒否されました。');
    const afterRetry = await read(token);
    const final = counts(afterRetry, name, requestId);
    if (final.saved !== 1 || final.notices !== 1) throw Error('再送後の保存・通知が各1件ではありません。');
    note('同じ要求IDで再送した後も、保存と通知は各1件でした。');
    status.textContent = '合格：保存1件・アプリ内通知1件。';
  } catch (error) { status.textContent = '未完了：' + error.message; }
  finally { button.disabled = false; }
});
