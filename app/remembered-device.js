// 取り出せない秘密鍵を、現在のアプリを開いたブラウザ内に保存する。
(() => {
  const database = 'aibo-remembered-device:' + new URL('.', document.baseURI).pathname;
  const store = 'device';
  const name = 'current';
  const algorithm = 'RSASSA-PKCS1-v1_5';
  function readOrWrite(mode, action) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(database, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(store);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('端末のログイン保存先を開けません。'));
      request.onsuccess = () => {
        const db = request.result;
        try {
          const transaction = db.transaction(store, mode);
          const operation = action(transaction.objectStore(store));
          transaction.oncomplete = () => { db.close(); resolve(operation.result); };
          transaction.onabort = () => { db.close(); reject(transaction.error || Error()); };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  }
  async function create() {
    await readOrWrite('readonly', target => target.getKey(name));
    const keys = await crypto.subtle.generateKey(
      { name: algorithm, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
    const { n } = await crypto.subtle.exportKey('jwk', keys.publicKey);
    return { privateKey: keys.privateKey, modulus: n };
  }
  async function sign(device, nonce) {
    const message = new TextEncoder().encode('aibo-device-v1:' + device.id + ':' + nonce);
    const signature = await crypto.subtle.sign(algorithm, device.privateKey, message);
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }
  window.aiboRememberedDevice = Object.freeze({
    load: () => readOrWrite('readonly', target => target.get(name)),
    save: device => readOrWrite('readwrite', target => target.put(device, name)),
    clear: () => readOrWrite('readwrite', target => target.delete(name)),
    create,
    sign,
  });
})();
