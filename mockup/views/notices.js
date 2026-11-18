// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('notices', () => page('お知らせ', '確認状況は架空の見本です。',
      panel('未読のお知らせ 1件', `<p><span class="chip chip-today">日程変更</span> ${sample}</p><p>上棟日：12/03 → 12/10</p><p>初回出荷日：11/28 → 12/05</p>` + action('内容を確認した')) +
      panel('✓ 確認済みのお知らせ 1件', `<p>${sampleB}：確認依頼への回答があります。</p>` + action('内容を見る'))));
})();
