// 設定の架空データによる画面見本です。
(() => {
  const { page, panel, select, action } = window.previewHelpers;
  window.registerPreviewView('settings', () => page('設定', '表示とログイン設定の見本です。権限やログイン状態は変わりません。',
    panel('表示する役割', '<p>プレビューでは CAD のホームを表示しています。</p>' + select('役割の見本', ['CAD', '営業', 'CADリーダー', '管理者']) + action('役割を変更')) +
    panel('ログイン', '<p>この見本では実際の認証を行いません。</p>' + action('ログアウト'))));
})();
