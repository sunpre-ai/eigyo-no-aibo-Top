// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('quotes', () => page('見積用', '見積案件と図面入力状況は架空の見本です。',
      panel('見積案件の進捗', '<p>見積用：1件　／　図面入力待ち：1件</p><label class="field">案件を探す<input type="search" placeholder="受注先・現場名"></label>') +
      panel('架空の受注先 D', '<p><span class="chip chip-wait">見積中</span> 架空の現場 D</p><p>営業：担当 A　／　CAD：担当 B</p><p>図面入力：確認中　／　回答期限：11/20</p><a class="button" href="#detail-d">内容を見る</a>')));
})();
