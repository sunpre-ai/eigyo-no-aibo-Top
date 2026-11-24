const apiVersion = 2;
const roles = ['営業', 'CAD', '管理者'];
const apiErrors = new Set(['UNAVAILABLE', 'MAINTENANCE', 'INVALID', 'SESSION_EXPIRED', 'FORBIDDEN', 'BUSY', 'SERVER_ERROR']);

class PwaSessionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// 公開時に承認したAPIとクライアントIDを渡す。URLの入力値や試作の設定は参照しない。
export function createPwaSession({ apiUrl, clientId, fetchImpl = fetch, now = Date.now } = {}) {
  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    throw new PwaSessionError('NOT_CONFIGURED');
  }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password ||
      endpoint.search || endpoint.hash || !endpoint.pathname.endsWith('/api/v2') ||
      typeof clientId !== 'string' || !/^[A-Za-z0-9-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    throw new PwaSessionError('NOT_CONFIGURED');
  }

  let session = null;
  let prompt = null;

  async function request(action, fields = {}) {
    let reply;
    try {
      const response = await fetchImpl(endpoint.href, {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ version: apiVersion, action, ...fields }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error();
      reply = await response.json();
    } catch {
      throw new PwaSessionError('CONNECTION');
    }
    if (reply?.version !== apiVersion) throw new PwaSessionError('VERSION');
    if (typeof reply.ok !== 'boolean') throw new PwaSessionError('INVALID_RESPONSE');
    if (!reply.ok) throw new PwaSessionError(apiErrors.has(reply.code) ? reply.code : 'SERVER_ERROR');
    return reply;
  }

  async function renderGoogleButton(google, target, onResult) {
    const identity = google?.accounts?.id;
    if (!identity?.initialize || !identity.renderButton) throw new PwaSessionError('GOOGLE_UNAVAILABLE');
    const current = {};
    prompt = current;
    const { nonce, expiresAt } = await request('loginChallenge');
    if (typeof nonce !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(nonce) ||
        !Number.isSafeInteger(expiresAt) || expiresAt <= now()) {
      throw new PwaSessionError('INVALID_RESPONSE');
    }
    if (prompt !== current) return;

    identity.initialize({
      client_id: clientId,
      nonce,
      auto_select: false,
      async callback(response) {
        if (prompt !== current || current.used) return;
        current.used = true;
        let outcome;
        try {
          if (expiresAt <= now()) throw new PwaSessionError('LOGIN_EXPIRED');
          if (typeof response?.credential !== 'string' || !response.credential) {
            throw new PwaSessionError('INVALID');
          }
          const result = await request('login', { credential: response.credential, nonce });
          if (typeof result.token !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(result.token) ||
              !Number.isSafeInteger(result.expiresAt) || result.expiresAt <= now() ||
              !Array.isArray(result.roles) || !result.roles.length || !result.roles.every(role => roles.includes(role))) {
            throw new PwaSessionError('INVALID_RESPONSE');
          }
          if (prompt !== current) return;
          session = { token: result.token, expiresAt: result.expiresAt };
          outcome = { ok: true, roles: result.roles, expiresAt: result.expiresAt };
        } catch (error) {
          outcome = { ok: false, code: error.code || 'SERVER_ERROR' };
        }
        if (prompt === current) onResult(outcome);
      },
    });
    identity.renderButton(target, { theme: 'outline', size: 'large', text: 'signin_with' });
  }

  async function cases(role, scope = 'personal') {
    const current = session;
    if (!current || current.expiresAt <= now()) {
      session = null;
      throw new PwaSessionError('SESSION_EXPIRED');
    }
    try {
      const result = await request('cases', { token: current.token, role, scope });
      if (session !== current || current.expiresAt <= now()) throw new PwaSessionError('SESSION_EXPIRED');
      if (!Array.isArray(result.cases)) throw new PwaSessionError('INVALID_RESPONSE');
      return result;
    } catch (error) {
      if (session === current && error.code === 'SESSION_EXPIRED') session = null;
      throw error;
    }
  }

  async function logout() {
    const previous = session;
    prompt = null;
    session = null;
    if (previous && previous.expiresAt > now()) {
      try {
        await request('logout', { token: previous.token });
      } catch (error) {
        if (error.code !== 'SESSION_EXPIRED') throw error;
      }
    }
  }

  return { renderGoogleButton, cases, logout };
}
