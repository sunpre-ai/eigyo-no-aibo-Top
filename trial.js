// 表示用ファイルだけを保管し、業務データや認証情報は保存しない。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(() => {
    // 通信できる場合は、登録できなくても通常の画面を表示する。
  });
}
