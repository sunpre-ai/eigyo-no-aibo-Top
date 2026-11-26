import { caseView } from './case-view.mjs';

const byId = id => document.getElementById(id);
const connect = byId('connect'), filters = byId('filters'), code = byId('code');
const role = byId('role'), team = byId('team'), cases = byId('cases'), status = byId('status');
let token = '', snapshot = null, cadLeader = false, pending = null;
let expireTimer;
const live = location.search === '?mode=live';
let bridgeOrigin = '', bridgeRequest = null;

function bridgeFetch(body, signal) {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const abort = () => {
      bridgeRequest = null;
      reject(Error('照合応答なし'));
    };
    signal.addEventListener('abort', abort, { once: true });
    bridgeRequest = { requestId, finish(result) {
      signal.removeEventListener('abort', abort);
      bridgeRequest = null;
      resolve(result);
    } };
    window.opener.postMessage({
      type: 'aibo-pilot:cases', requestId, role: body.role, scope: body.scope,
    }, bridgeOrigin);
  });
}

async function request(body) {
  const controller = new AbortController();
  pending = controller;
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    let result;
    if (live) result = await bridgeFetch(body, controller.signal);
    else {
      const response = await fetch('/api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'omit', cache: 'no-store', body: JSON.stringify(body), signal: controller.signal,
      });
      if (!response.ok) throw Error('通信エラー');
      result = await response.json();
    }
    if (result.version !== 1 || typeof result.ok !== 'boolean') throw Error('応答形式');
    return result;
  } finally {
    clearTimeout(timer);
    if (pending === controller) pending = null;
  }
}
function clearCases() {
  snapshot = null;
  byId('counts').textContent = '';
  cases.replaceChildren();
}
function disconnect(message) {
  pending?.abort();
  pending = null;
  clearTimeout(expireTimer);
  token = '';
  cadLeader = false;
  clearCases();
  role.replaceChildren();
  team.checked = false;
  byId('past').checked = false;
  filters.hidden = true;
  connect.hidden = live;
  if (live && bridgeOrigin && window.opener)
    window.opener.postMessage({ type: 'aibo-pilot:close' }, bridgeOrigin);
  status.textContent = message;
}
async function sessionStarted(data, sessionToken) {
  token = sessionToken;
  cadLeader = data.cadLeader;
  role.replaceChildren(...data.roles.map(value => new Option(value, value)));
  connect.hidden = true;
  filters.hidden = false;
  expireTimer = setTimeout(() => disconnect('照合の有効期限が切れました。'), 15 * 60 * 1000);
  await load();
}
function display() {
  if (!snapshot) return;
  const view = caseView(snapshot.cases, snapshot.today, byId('past').checked, byId('bucket').value);
  byId('counts').textContent = Object.entries(view.counts).map(([name, count]) => name + ' ' + count + '件').join(' ／ ');
  cases.replaceChildren();
  for (const item of view.items) {
    const card = document.createElement('article');
    card.className = 'panel section-card';
    const title = document.createElement('h2');
    title.textContent = item.customer + ' ／ ' + item.site;
    const detail = document.createElement('p');
    detail.textContent = [
      item.receiptNumber && '受付 ' + item.receiptNumber, item.receivedDate && '受付日 ' + item.receivedDate,
      '営業 ' + (item.sales || '未設定'), 'CAD ' + (item.cad || '未設定'),
      item.quoteDeadline && '見積期限 ' + item.quoteDeadline,
      item.shipping && '第一出荷日 ' + item.shipping, item.erection && '上棟日 ' + item.erection,
      item.stage && '工程 ' + item.stage, item.spec && '仕様書 ' + item.spec,
      item.approval && '承認 ' + item.approval,
      item.structural && '主構造 ' + item.structural, item.secondary && '二次部材 ' + item.secondary,
      item.complete && '加工データ完成',
    ].filter(Boolean).join(' ／ ');
    card.append(title, detail);
    cases.append(card);
  }
  if (!view.items.length) cases.textContent = '該当する案件はありません。';
}
async function load() {
  if (!token || pending) return;
  const expected = token, selectedRole = role.value;
  byId('team-label').hidden = selectedRole !== 'CAD' || !cadLeader;
  if (byId('team-label').hidden) team.checked = false;
  const selectedTeam = team.checked;
  clearCases();
  status.textContent = '最新情報を取得中です。';
  try {
    const data = await request({ action: 'cases', token, role: selectedRole, scope: selectedTeam ? 'cad-team' : 'personal' });
    if (token !== expected) return;
    if (selectedRole !== role.value || selectedTeam !== team.checked) return;
    if (!data.ok) {
      disconnect('照合を続けられません。現行版で利用権限を確認し、照合コードを発行し直してください。');
      return;
    }
    snapshot = data;
    status.textContent = data.user.name + '（' + selectedRole + '）の最新情報を取得しました。' +
      (data.projectRowsUnavailable ? ' 一部の案件はID不備のため表示を保留しています。' : '');
    display();
  } catch {
    if (token === expected) status.textContent = '情報を取得できません。案件データを更新してください。';
  } finally {
    // 取得中に役割が変わった場合は、その役割で取り直す。
    if (token === expected && (selectedRole !== role.value || selectedTeam !== team.checked)) load();
  }
}
connect.addEventListener('submit', async event => {
  event.preventDefault();
  if (live || pending) return;
  const pairingCode = code.value.trim();
  code.value = '';
  status.textContent = '接続中です。';
  try {
    const data = await request({ action: 'redeem', pairingCode });
    if (!data.ok) {
      status.textContent = '接続できません。現行版で照合コードを発行し直してください。';
      return;
    }
    await sessionStarted(data, data.token);
  } catch {
    status.textContent = '通信できません。現行版で照合コードを発行し直してください。';
  }
});
filters.addEventListener('submit', event => { event.preventDefault(); load(); });
role.addEventListener('change', load);
team.addEventListener('change', load);
byId('past').addEventListener('change', display);
byId('bucket').addEventListener('change', display);
byId('disconnect').addEventListener('click', () => disconnect('照合を終了しました。'));
window.addEventListener('pagehide', () => disconnect('照合を終了しました。'));

if (live) {
  connect.hidden = true;
  byId('instructions').textContent = 'ログイン済みの現行版を経由して案件を読み取ります。';
  status.textContent = '現行版からの接続を待っています。';
  const handshakeTimeout = setTimeout(() => {
    if (!bridgeOrigin) disconnect('現行版の「PWA案件照合を開く」から開き直してください。');
  }, 25000);
  window.addEventListener('message', event => {
    if (!window.opener || event.source !== window.opener ||
        !/^https:\/\/(?:[a-z0-9-]+-)?script\.googleusercontent\.com$/i.test(event.origin) || !event.data) return;
    if (bridgeOrigin && bridgeOrigin !== event.origin) return;
    const message = event.data;
    if (message.type === 'aibo-pilot:connected' && !bridgeOrigin) {
      bridgeOrigin = event.origin;
      clearTimeout(handshakeTimeout);
      sessionStarted(message, 'browser-bridge');
    } else if (message.type === 'aibo-pilot:error') {
      clearTimeout(handshakeTimeout);
      disconnect('接続できません。照合対象の本人が現行版にログインしてください。');
    } else if (message.type === 'aibo-pilot:close' && bridgeOrigin) {
      disconnect('現行版のログアウトにより照合を終了しました。');
    } else if (bridgeOrigin && message.type === 'aibo-pilot:result' &&
        bridgeRequest?.requestId === message.requestId) {
      bridgeRequest.finish(message.result);
    }
  });
  // 初回の接続準備だけを通知する。取引先や認証情報は送らない。
  window.opener?.postMessage({ type: 'aibo-pilot:ready' }, '*');
}
