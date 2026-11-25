// 現行画面の処理をPWAのJSON APIへつなぐ。画面の状態と認証情報はキャッシュしない。
(() => {
  const config = window.AIBO_PWA_CONFIG;
  const reads = new Set(config.readMethods);
  const productionRead = config.mode === 'preview' &&
    new URLSearchParams(location.search).get('mode') === 'production-read';
  const liveMethods = new Set([
    'getDashboard', 'getCadMonthly', 'getSalesMovementMonth', 'getNotifications', 'getQuoteWorkspace',
  ]);
  const readFilter = '#cad-month-form, #sales-movement-month-form';
  const liveCalls = new Map();
  let liveSession = null;
  let liveEnded = false;
  let stopLiveConnection = null;
  const sessionKey = 'aibo-pwa-operations:session';
  const receiptPrefix = 'aibo-pwa-operations:request:';
  const messages = {
    CONNECTION: '通信できませんでした。接続を確認してください。',
    SESSION_EXPIRED: 'ログインの有効期限が切れました。もう一度ログインしてください。',
    FORBIDDEN: '利用者設定に登録されているGoogleアカウントを確認してください。',
    UNAVAILABLE: 'PWAの接続を利用できません。',
    VERSION: '画面とAPIの版が一致しません。画面を更新してください。',
    MAINTENANCE: '現在、業務データの取得を停止しています。',
    READ_ONLY: 'この環境では更新操作が停止されています。',
    RESULT_PENDING: '保存結果を確認中です。入力を残したまま、少し待って同じ操作を行ってください。',
    RESULT_UNKNOWN: '保存結果を確認できませんでした。案件や履歴を確認してから次の操作を行ってください。',
    RESULT_CONFIRMED: '処理は完了しています。最新情報を取得して結果を確認してください。',
    CONFLICT: '同じ保存要求で入力が変わっています。保存結果を確認してください。',
    BUSY: '処理が混み合っています。少し待ってから再試行してください。',
    INVALID_REQUEST_ID: '保存要求の期限が切れました。画面と端末時刻を確認してください。',
  };
  const errorFor = (code, detail) => Object.assign(Error([detail, messages[code] || '操作を完了できませんでした。'].filter(Boolean).join(' ')), { code });
  const status = value => { const line = document.querySelector('#pwa-operation-status'); if (line) line.textContent = value; };
  let session;
  let dashboardLoaded = false;
  if (!productionRead && config.mode !== 'production') {
    try { session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch (_) { /* 保存できない端末ではログイン画面を表示する。 */ }
  }
  const pending = new Map();
  const remember = value => {
    session = value;
    dashboardLoaded = false;
    if (config.mode === 'production') return;
    try {
      if (value) sessionStorage.setItem(sessionKey, JSON.stringify(value));
      else sessionStorage.removeItem(sessionKey);
    } catch (_) { /* 表示中はメモリのセッションを使う。 */ }
  };
  const token = () => productionRead
    ? liveSession?.id || ''
    : session?.expiresAt > Date.now() ? session.token : '';

  function endLive() {
    const source = liveSession?.source;
    const origin = liveSession?.origin;
    liveSession = null;
    liveEnded = true;
    stopLiveConnection?.();
    stopLiveConnection = null;
    for (const entry of liveCalls.values()) entry.reject(errorFor('SESSION_EXPIRED'));
    if (source && !source.closed) source.postMessage({ type: 'aibo-pilot:close' }, origin);
  }

  function expireLive() {
    endLive();
    window.dispatchEvent(new Event('aibo-session-expired'));
  }

  function liveRequest(method, args) {
    if (!liveMethods.has(method)) throw Error('本番データは閲覧専用です。操作は「架空データで操作」で試せます。');
    if (!liveSession || liveSession.source.closed || Date.now() >= liveSession.expiresAt) {
      expireLive();
      throw errorFor('SESSION_EXPIRED');
    }
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const clear = () => { clearTimeout(timeout); liveCalls.delete(requestId); };
      const timeout = setTimeout(() => {
        clear();
        reject(errorFor('CONNECTION'));
      }, 45000);
      liveCalls.set(requestId, {
        resolve: value => { clear(); resolve(value); },
        reject: error => { clear(); reject(error); },
      });
      try {
        liveSession.source.postMessage({ type: 'aibo-pilot:screen', requestId, method, args }, liveSession.origin);
      } catch (_) {
        clear();
        reject(errorFor('CONNECTION'));
      }
    });
  }

  function connectLive(onLogin, onError) {
    const source = window.opener;
    if (liveEnded || !config.productionLoginUrl || !source || source.closed) {
      onError('現行GAS版で「PWAで本番データを閲覧」を押して開いてください。');
      return;
    }
    stopLiveConnection?.();
    const trusted = /^https:\/\/(?:[a-z0-9-]+-)?script\.googleusercontent\.com$/i;
    const handler = event => {
      if (event.source !== source || !trusted.test(event.origin) || !event.data) return;
      const message = event.data;
      if (liveSession && event.origin !== liveSession.origin) return;
      if (message.type === 'aibo-pilot:connected' && !liveSession) {
        if (!Array.isArray(message.roles) || message.roles.length !== 1 ||
            message.roles[0] !== 'CAD' || message.cadLeader) {
          endLive();
          onError('CAD本人の閲覧権限を確認できませんでした。');
          return;
        }
        // 画面内での取り違えを防ぐ識別子。GASの認証情報は受け取らない。
        liveSession = { source, origin: event.origin, id: crypto.randomUUID(), expiresAt: Date.now() + 900000 };
        onLogin(liveSession.id);
      } else if (message.type === 'aibo-pilot:close' && liveSession) {
        expireLive();
      } else if (message.type === 'aibo-pilot:error' && !liveSession) {
        endLive();
        onError('現行GAS版で、照合対象のCAD本人としてログインしてください。');
      } else if (message.type === 'aibo-pilot:result' && liveSession) {
        const entry = liveCalls.get(message.requestId);
        if (!entry) return;
        const result = message.result;
        if (result?.version !== 1) entry.reject(errorFor('VERSION'));
        else if (result.ok) entry.resolve(result.value);
        else if (['SESSION_EXPIRED', 'UNAVAILABLE', 'MAINTENANCE'].includes(result.code)) {
          entry.reject(errorFor(result.code));
          expireLive();
        } else entry.reject(errorFor(result.code));
      }
    };
    window.addEventListener('message', handler);
    const started = Date.now();
    const heartbeat = () => {
      if (liveSession) {
        if (source.closed || Date.now() >= liveSession.expiresAt) expireLive();
      } else if (source.closed || Date.now() - started >= 15000) {
        endLive();
        onError('現行GAS版との接続を確認できません。現行版のボタンから開き直してください。');
      } else {
        // 相手のオリジンは応答で確認する。最初の要求にデータや認証情報は含めない。
        source.postMessage({ type: 'aibo-pilot:ready' }, '*');
      }
    };
    const timer = setInterval(heartbeat, 1000);
    stopLiveConnection = () => {
      clearInterval(timer);
      window.removeEventListener('message', handler);
    };
    heartbeat();
  }

  function showMode() {
    if (!config.productionLoginUrl) return;
    const label = document.querySelector('#pwa-context');
    const link = document.createElement('a');
    const login = new URL(config.productionLoginUrl);
    login.searchParams.set('pwaOperationsPilot', '1');
    if (productionRead) {
      document.body.classList.add('pwa-production-read');
      label.textContent = '本番データ（読み取り専用） ';
      document.querySelector('#pwa-preview-instruction').textContent =
        '現行GAS版のCAD本人ログインと接続します。';
      link.href = './';
      link.textContent = '架空データで操作';
      link.onclick = event => { event.preventDefault(); endLive(); location.replace('./'); };
      window.addEventListener('pagehide', endLive);
      window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
      document.addEventListener('submit', event => {
        if (event.target.matches(readFilter)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        status('本番データは閲覧専用です。');
      }, true);
    } else {
      link.href = login.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '本番データを閲覧';
      label.append(' ／ ');
    }
    label.append(link);
    if (productionRead) {
      const reconnect = link.cloneNode();
      reconnect.href = login.href;
      reconnect.target = '_blank';
      reconnect.rel = 'noopener noreferrer';
      reconnect.textContent = '現行GAS版から接続する';
      document.querySelector('#pwa-google-login').before(reconnect);
    }
  }

  function restrictEditing() {
    if (!productionRead) return;
    document.querySelectorAll('#content form').forEach(form => {
      if (form.matches(readFilter)) return;
      form.querySelectorAll('button, input, select, textarea').forEach(control => { control.disabled = true; });
    });
  }

  async function call(body) {
    if (productionRead) throw errorFor('READ_ONLY');
    let result;
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ version: 3, ...body }), signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw Error();
      result = await response.json();
    } catch (_) { throw errorFor('CONNECTION'); }
    if (result?.version !== 3) throw errorFor('VERSION');
    if (!result.ok) throw errorFor(result.code, result.message);
    return result;
  }

  async function requestKey(method, args) {
    const data = new TextEncoder().encode(JSON.stringify([method, args]));
    const hash = await crypto.subtle.digest('SHA-256', data);
    return receiptPrefix + Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2, '0')).join('');
  }

  function requestId(key) {
    let existing = pending.get(key);
    try { existing ||= sessionStorage.getItem(key); } catch (_) { /* メモリ内で再送を扱う。 */ }
    if (existing) return existing;
    const id = Date.now() + '.' + crypto.randomUUID();
    pending.set(key, id);
    try { sessionStorage.setItem(key, id); } catch (_) { /* メモリ内で再送を扱う。 */ }
    return id;
  }

  function clearRequest(key) {
    pending.delete(key);
    try { sessionStorage.removeItem(key); } catch (_) { /* メモリ内の記録は削除済み。 */ }
  }

  async function invoke(method, args) {
    const [supplied, ...parameters] = args;
    if (!supplied || supplied !== token()) {
      window.dispatchEvent(new Event('aibo-session-expired'));
      throw errorFor('SESSION_EXPIRED');
    }
    if (productionRead) {
      if (method === 'logout') {
        expireLive();
        return true;
      }
      if (method === 'getDashboard') status('本番シートから取得中…');
      try {
        const result = await liveRequest(method, parameters);
        if (method === 'getDashboard') status('本番シートから取得しました。');
        return result;
      } catch (error) {
        if (method === 'getDashboard') status('本番シートからの取得に失敗しました。');
        throw error;
      }
    }
    if (method === 'logout') {
      await call({ action: 'logout', token: supplied });
      remember(null);
      return true;
    }
    const payload = { action: 'rpc', token: supplied, method, args: parameters };
    const write = !reads.has(method);
    const key = write ? await requestKey(method, parameters) : null;
    if (write) {
      payload.requestId = requestId(key);
      status('保存中…');
    } else if (method === 'getDashboard') {
      status(dashboardLoaded ? '前回の情報を表示中。最新情報を取得中…' : '最新情報を取得中…');
    }
    try {
      let response;
      try { response = await call(payload); }
      catch (error) {
        if (!write || !['CONNECTION', 'RESULT_PENDING', 'BUSY'].includes(error.code)) throw error;
        status('保存結果を確認中…');
        await new Promise(resolve => setTimeout(resolve, 400));
        response = await call(payload);
      }
      if (write) {
        clearRequest(key);
        status(response.value?.saved === true ? '保存しました。' : '処理結果を確認しました。');
      }
      if (method === 'getDashboard') { dashboardLoaded = true; status('最新情報を取得しました。'); }
      return response.value;
    } catch (error) {
      if (error.code === 'SESSION_EXPIRED') {
        remember(null);
        window.dispatchEvent(new Event('aibo-session-expired'));
      }
      if (write) {
        if (['RESULT_CONFIRMED', 'READ_ONLY', 'INVALID', 'INVALID_REQUEST_ID'].includes(error.code)) clearRequest(key);
        status(['RESULT_UNKNOWN', 'RESULT_PENDING', 'CONNECTION'].includes(error.code) ? '保存結果の確認が必要です。' : '保存要求の状態を確認してください。');
      } else if (method === 'getDashboard') status(dashboardLoaded ? '前回の情報を表示中。最新情報の取得に失敗しました。' : '最新情報の取得に失敗しました。');
      throw error;
    }
  }

  let gsi;
  function loadGoogle() {
    if (!gsi) gsi = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = 'https://accounts.google.com/gsi/client';
      tag.async = true;
      tag.onload = () => resolve(window.google.accounts.id);
      tag.onerror = () => { tag.remove(); gsi = null; reject(errorFor('CONNECTION')); };
      document.head.append(tag);
    });
    return gsi;
  }

  async function setupLogin(onLogin, onError) {
    const target = document.querySelector('#pwa-google-login');
    target.replaceChildren();
    if (productionRead) {
      connectLive(onLogin, onError);
      return;
    }
    const complete = async value => {
      remember({ token: value.token, expiresAt: value.expiresAt });
      await onLogin(value.token);
    };
    if (config.mode === 'preview') {
      for (const role of ['営業', 'CAD', '管理者']) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = role + 'で開く';
        button.onclick = async () => {
          try { await complete(await call({ action: 'previewLogin', role })); }
          catch (error) { onError(error.message); }
        };
        target.append(button);
      }
      return;
    }
    try {
      const identity = await loadGoogle();
      const challenge = await call({ action: 'loginChallenge' });
      identity.initialize({ client_id: config.clientId, nonce: challenge.nonce, auto_select: false,
        callback: async response => {
          try {
            const result = await call({ action: 'login', credential: response.credential, nonce: challenge.nonce });
            await complete(result);
          } catch (error) { onError(error.message); }
        },
      });
      identity.renderButton(target, { theme: 'outline', size: 'large' });
    } catch (error) { onError(error.message); }
  }

  window.aiboOperations = Object.freeze({
    token, forget: () => productionRead ? endLive() : remember(null),
    setupLogin, invoke, productionRead, showMode, restrictEditing,
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').then(registration => {
    const offer = () => {
      if (!registration.waiting || !navigator.serviceWorker.controller) return;
      const button = document.querySelector('#pwa-refresh-shell');
      if (!button) return;
      button.hidden = false;
      button.onclick = () => {
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
        registration.waiting?.postMessage('activate');
      };
    };
    offer();
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', offer));
  }).catch(() => { /* キャッシュが使えない環境でも画面は使える。 */ });
})();
