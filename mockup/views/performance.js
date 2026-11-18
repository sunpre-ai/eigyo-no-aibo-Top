// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('performance', () => page('営業の月間成績', '架空の数値を表示しています。',
      panel('集計月', input('集計月', 'month', '2026-11') + action('この月を表示')) +
      panel('今月の状況', '<p>見積：3件　／　受注：2件　／　売上確認：1件</p><p>先月からの引き継ぎを含む架空の集計です。</p>' + action('詳細を見る'))));
})();
