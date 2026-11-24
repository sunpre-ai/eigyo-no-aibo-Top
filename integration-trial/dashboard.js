// 既存の独立した試験GASと試験専用シートだけを使用する読み取り画面。
(() => {
  const sessionKey = 'aibo-pwa-trial-session-v1';
  const endpoint = window.PWA_TRIAL_API_URL || '';
  const status = document.getElementById('status');
  const refresh = document.getElementById('refresh');
  const profile = document.getElementById('profile');
  const cases = document.getElementById('cases');
  let busy = false;
  let lastLoadedAt = null;

  function loadedTime() {
    return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(lastLoadedAt);
  }
  function stale(message) {
    status.textContent = lastLoadedAt ? `前回の情報を表示中（${loadedTime()}取得）。${message}` : message;
  }

  function validEndpoint(value) {
    try {
      const url = new URL(value);
      return url.origin === 'https://script.google.com' && /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password;
    } catch { return false; }
  }
  function session() {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      return saved && saved.endpoint === endpoint && typeof saved.token === 'string' && Number.isFinite(saved.expires) && saved.expires > Date.now() ? saved : null;
    } catch { return null; }
  }
  function clearView() {
    profile.textContent = '未取得';
    cases.replaceChildren();
    lastLoadedAt = null;
  }
  function show(data) {
    if (!data.user || typeof data.user.name !== 'string' || !Array.isArray(data.user.roles) || !Array.isArray(data.cases)) throw new Error('invalid');
    if (!data.cases.every(item => item && ['id', 'customer', 'site', 'status'].every(key => typeof item[key] === 'string'))) throw new Error('invalid');
    clearView();
    profile.textContent = `${data.user.name}（${data.user.roles.join('・')}）`;
    if (!data.cases.length) {
      const empty = document.createElement('p');
      empty.textContent = '表示できる試験案件はありません。';
      cases.append(empty);
    }
    for (const item of data.cases) {
      const card = document.createElement('article');
      card.className = 'panel section-card';
      const title = document.createElement('h3');
      title.textContent = `${item.customer} ／ ${item.site}`;
      const detail = document.createElement('p');
      detail.textContent = `状態：${item.status} ／ 期限：${item.due || '未設定'}`;
      card.append(title, detail);
      cases.append(card);
    }
    lastLoadedAt = new Date();
    status.textContent = `最新情報を取得しました（${loadedTime()}）。`;
  }
  async function load() {
    if (busy) return;
    const current = session();
    if (!validEndpoint(endpoint) || !current) {
      clearView();
      status.textContent = '試験用ログインが必要です。試験用ログイン画面からログインしてください。';
      return;
    }
    busy = true;
    refresh.disabled = true;
    stale('最新情報を取得中です。');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, credentials: 'omit', cache: 'no-store', signal: controller.signal, body: JSON.stringify({ action: 'dashboard', token: current.token }) });
      if (!response.ok) throw new Error('connection');
      const data = await response.json();
      if (!data || typeof data.ok !== 'boolean') throw new Error('invalid');
      if (data.ok) show(data);
      else if (data.code === 'SESSION_EXPIRED') {
        clearView();
        status.textContent = 'ログインの有効期限が切れました。試験用ログインからやり直してください。';
      } else if (data.code === 'FORBIDDEN') {
        clearView();
        status.textContent = '試験用の利用者設定に登録されていません。';
      } else if (data.code === 'NOT_CONFIGURED') {
        clearView();
        status.textContent = '試験用シートの設定が完了していません。';
      } else stale('試験データを取得できませんでした。');
    } catch {
      stale('接続できません。通信を確認して、もう一度お試しください。');
    } finally {
      clearTimeout(timer);
      refresh.disabled = false;
      busy = false;
    }
  }
  refresh.addEventListener('click', load);
  load();
})();
