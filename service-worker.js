const cacheName = 'aibo-trial-shell-v1';
const shell = ['./', './index.html', './style.css', './trial.css', './trial.js', './manifest.json', './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png', './assets/favicon-32.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('aibo-trial-shell-') && key !== cacheName).map(key => caches.delete(key)))));
});

// この試作では同じサイトの画面だけを対象にし、通信先のデータは保存しない。
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
