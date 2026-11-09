(() => {
  'use strict';
  const config = window.ENTRANCE_CONFIG;
  const status = document.querySelector('#status');
  const caption = document.querySelector('#caption');
  const button = document.querySelector('#open-app');
  if (!config) {
    document.body.classList.add('maintenance');
    status.textContent = 'ただいま入口を準備しています';
    caption.textContent = 'しばらくしてから、もう一度お試しください。';
    return;
  }
  if (config.maintenance) {
    window.location.replace('./maintenance.html');
    return;
  }
  let destination;
  try {
    destination = new URL(config.gasUrl);
    if (destination.origin !== 'https://script.google.com' || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(destination.pathname) || destination.username || destination.password) throw new Error();
  } catch {
    document.body.classList.add('maintenance');
    status.textContent = 'ただいま入口を準備しています';
    caption.textContent = 'しばらくしてから、もう一度お試しください。';
    return;
  }
  button.href = destination.href;
  // 入口のアニメーションは、移動先のページに切り替わるまで表示されます。
  // GAS内の読込状態は別オリジンのため、ここでは計測しません。
  window.setTimeout(() => {
    button.hidden = false;
    window.location.replace(destination.href);
  }, 900);
  window.setTimeout(() => {
    status.textContent = 'もう少し、お待ちください';
    caption.textContent = '自動で開かない場合は、下のボタンを押してください。';
    button.hidden = false;
  }, 12000);
})();
