const cacheName = 'aibo-trial-shell-v5';
const shell = ['./', './index.html', './style.css', './trial.css', './trial-config.js', './trial.js', './manifest.json', './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png', './assets/favicon-32.png', './css/tokens.css', './mockup/', './mockup/index.html', './mockup/login.html', './mockup/login.css', './mockup/mockup.css', './mockup/mockup.js', './mockup/cases.js', './mockup/sections.js', './mockup/aibo-bird.png'];

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
    const isMockup = new URL(event.request.url).pathname.includes('/mockup/');
    const isLogin = new URL(event.request.url).pathname.endsWith('/mockup/login.html');
    event.respondWith(fetch(event.request).catch(() => caches.match(isLogin ? './mockup/login.html' : isMockup ? './mockup/index.html' : './index.html')));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
