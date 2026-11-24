const cacheName = 'aibo-trial-shell-v9';
const quotePreview = './mockup/views/quote-reception.html?v=20261120-1';
const shell = ['./', './index.html', './style.css', './trial.css', './trial-config.js', './trial.js', './manifest.json', './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png', './assets/favicon-32.png', './css/tokens.css', './integration-trial/', './integration-trial/index.html', './integration-trial/dashboard.js', './mockup/', './mockup/index.html', './mockup/login.html', './mockup/login.css', './mockup/mockup.css', './mockup/mockup.js', './mockup/cases.js', './mockup/sections.js', './mockup/aibo-bird.png', './css/tokens.css?v=20261118-3', './mockup/mockup.css?v=20261118-3', './mockup/mockup.js?v=20261118-3', './mockup/cases.js?v=20261118-3', './mockup/sections.js?v=20261118-3', './mockup/detail-panels.js?v=20261118-3', './mockup/views/team.js?v=20261118-3', './mockup/views/questions.js?v=20261118-3', './mockup/views/notices.js?v=20261118-3', './mockup/views/cad-month.js?v=20261118-3', './mockup/views/cad-team.js?v=20261118-3', './mockup/views/quotes.js?v=20261120-1', quotePreview, './mockup/views/cancel.js?v=20261118-3', './mockup/views/prevention.js?v=20261118-3', './mockup/views/trouble.js?v=20261118-3', './mockup/views/daily.js?v=20261118-3', './mockup/views/performance.js?v=20261118-3', './mockup/views/prospects.js?v=20261118-3', './mockup/views/schedule.js?v=20261118-3', './mockup/views/settings.js?v=20261118-3'];

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
    const pathname = new URL(event.request.url).pathname;
    if (pathname.endsWith('/mockup/views/quote-reception.html')) {
      event.respondWith(fetch(event.request).catch(() => caches.match(quotePreview)));
      return;
    }
    if (pathname.includes('/integration-trial/')) {
      event.respondWith(fetch(event.request).catch(() => caches.match('./integration-trial/index.html')));
      return;
    }
    const isMockup = pathname.includes('/mockup/');
    const isLogin = pathname.endsWith('/mockup/login.html');
    event.respondWith(fetch(event.request).catch(() => caches.match(isLogin ? './mockup/login.html' : isMockup ? './mockup/index.html' : './index.html')));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
