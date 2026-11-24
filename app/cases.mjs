import { createPwaSession } from '../production-auth/session.mjs';
import { caseView } from '../production-read-pilot/case-view.mjs';
import { configuration } from './config.mjs';

const byId = id => document.getElementById(id);
const status = byId('status');
const login = byId('login');
const dashboard = byId('dashboard');
const retry = byId('retry-login');
const past = byId('past');
const bucket = byId('bucket');
const cards = byId('cards');
const counts = byId('counts');
const refresh = byId('refresh');
const messages = {
  SESSION_EXPIRED: 'ログインの有効期限が切れました。ログインし直してください。',
  LOGIN_EXPIRED: 'ログインの有効期限が切れました。ログインし直してください。',
  FORBIDDEN: 'CAD担当案件の閲覧権限を確認できませんでした。',
  UNAVAILABLE: '現在、固定URLからの読み取りは利用できません。',
  MAINTENANCE: '現在、案件データの取得を停止しています。',
  VERSION: '画面とAPIの版が異なります。ページを再読み込みしてください。',
  CONNECTION: '接続できませんでした。通信を確認してください。',
};
let latest = null;
let expiryTimer;
let api;
let identityLoad;

function text(tag, value) {
  const el = document.createElement(tag);
  el.textContent = value;
  return el;
}

function display() {
  if (!latest) return;
  const model = caseView(latest.cases, latest.today, past.checked, bucket.value);
  counts.textContent = Object.entries(model.counts).map(([name, count]) => `${name} ${count}件`).join(' ／ ');
  cards.replaceChildren();
  for (const item of model.items) {
    const card = document.createElement('article');
    card.className = 'panel section-card';
    card.append(text('h3', `${item.customer} ／ ${item.site}`));
    const detail = [item.receiptNumber && `受付 ${item.receiptNumber}`, item.stage && `工程 ${item.stage}`,
      item.quoteDeadline && `見積期限 ${item.quoteDeadline}`, item.shipping && `出荷 ${item.shipping}`,
      item.erection && `上棟 ${item.erection}`].filter(Boolean);
    if (detail.length) card.append(text('p', detail.join(' ／ ')));
    cards.append(card);
  }
  if (!model.items.length) cards.append(text('p', '該当する案件はありません。'));
}

function clearDashboard() {
  clearTimeout(expiryTimer);
  latest = null;
  counts.textContent = '';
  cards.replaceChildren();
  dashboard.hidden = true;
  login.hidden = false;
  byId('google-login').replaceChildren();
  retry.hidden = false;
}

async function load() {
  if (refresh.disabled) return;
  refresh.disabled = true;
  status.textContent = latest ? '前回の情報を表示中。最新情報を取得しています。' : '最新情報を取得しています。';
  try {
    const result = await api.cases('CAD');
    if (dashboard.hidden) return;
    latest = result;
    display();
    status.textContent = result.projectRowsUnavailable ? '最新情報を取得しました。一部の案件を表示できません。' : '最新情報を取得しました。';
  } catch (error) {
    if (dashboard.hidden) return;
    const message = messages[error.code] || '案件データを取得できませんでした。';
    if (['SESSION_EXPIRED', 'FORBIDDEN', 'UNAVAILABLE', 'MAINTENANCE', 'VERSION'].includes(error.code)) {
      clearDashboard();
      status.textContent = message;
    } else status.textContent = latest ? '前回の情報を表示中。' + message : message;
  } finally {
    refresh.disabled = false;
  }
}

function googleIdentity() {
  if (!identityLoad) identityLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      script.remove();
      identityLoad = null;
      reject(Error('Google認証を読み込めませんでした。'));
    };
    document.head.append(script);
  });
  return identityLoad;
}

async function signIn() {
  login.hidden = false;
  retry.hidden = true;
  const target = byId('google-login');
  target.replaceChildren();
  status.textContent = 'Googleログインを準備しています。';
  try {
    await api.renderGoogleButton(await googleIdentity(), target, result => {
      if (!result.ok) {
        target.replaceChildren();
        retry.hidden = false;
        status.textContent = messages[result.code] || 'Googleログインを確認できませんでした。';
        return;
      }
      login.hidden = true;
      dashboard.hidden = false;
      expiryTimer = setTimeout(() => {
        clearDashboard();
        status.textContent = messages.SESSION_EXPIRED;
      }, Math.max(0, result.expiresAt - Date.now()));
      void load();
    });
    status.textContent = 'Googleでログインしてください。';
  } catch (error) {
    retry.hidden = false;
    status.textContent = messages[error.code] || 'Googleログインを準備できませんでした。';
  }
}

byId('filters').addEventListener('submit', event => { event.preventDefault(); void load(); });
bucket.addEventListener('change', display);
past.addEventListener('change', display);
retry.addEventListener('click', signIn);
byId('logout').addEventListener('click', async () => {
  clearDashboard();
  status.textContent = 'ログアウトしています。';
  retry.hidden = true;
  try {
    await api.logout();
    status.textContent = 'ログアウトしました。';
  } catch {
    status.textContent = '画面の情報を消去しました。サーバーでのログアウトは確認できません。';
  } finally {
    retry.hidden = false;
  }
});

try {
  api = createPwaSession(configuration);
  void signIn();
} catch {
  status.textContent = '固定URLからの閲覧は準備中です。';
}
