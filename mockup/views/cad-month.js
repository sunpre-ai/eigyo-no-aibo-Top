// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('cad-month', () => page('CADの月間実績', '架空の数値を表示しています。',
      panel('集計月', input('集計月', 'month', '2026-11') + action('この月を表示')) +
      panel('今月の実績', '<p>完成した案件：3件　／　担当した案件：5件</p><p>図面入力：2件　／　加工データ完成：1件</p>' + action('詳細を見る'))));
})();
