const prefix = 'aibo-pwa-workflow:' + new URL(self.registration.scope).pathname + ':';
const cacheName = prefix + "f85b0a35b6f84523";
const assets = ["./index.html","./operations.js","./workspace.css","./workspace.js","./workspace-bird.png","./remembered-device.js","./configuration.js","./manifest.json","./icon-192.png","./icon-512.png"];
const shell = new Set(assets.map(file => new URL(file, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(prefix) && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data === 'activate') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const href = new URL(request.url);
  const atRoot = href.href === self.registration.scope;
  if (!atRoot && !shell.has(href.href)) return;
  event.respondWith(caches.open(cacheName).then(async cache => {
    // 版がそろった画面資材だけを使う。ログインや業務APIの応答は保存しない。
    const cached = await cache.match(atRoot ? './index.html' : request);
    return cached || fetch(request);
  }));
});
