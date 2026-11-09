// 普段の変更は、転送先URLとメンテナンスの切り替えだけです。
window.ENTRANCE_CONFIG = Object.freeze({
  gasUrl: 'https://script.google.com/macros/s/AKfycbwGXf14sJJ2drGxd9T4qBmyugBktWagjjheHNCSEkh7me_8rw2iI6WM9as5PXsZZEeaLQ/exec',
  maintenance: false,
  maintenanceMessage: 'ただいまメンテナンス中です。再開まで、もう少しお待ちください。',
  resumeAt: '', // 例：11月10日 15:00ごろ再開予定（日本時間）
});
