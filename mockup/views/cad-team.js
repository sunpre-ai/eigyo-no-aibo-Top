// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('cad-team', () => page('CADチーム', 'チームの担当と進捗は架空の見本です。',
      panel('CADチーム全体の状況', '<p>担当者 A：担当 2件　／　期限超過 1件　／　確認待ち 1件</p><p>担当者 B：担当 1件　／　期限超過 0件　／　確認待ち 0件</p><a class="button" href="#trouble">CADの困りごとを見る</a>') +
      panel('担当者 A の案件', `<p><span class="chip chip-late">期限超過</span> ${sample}</p><p>期限：11/17　／　見積図面を確認中</p><a class="button" href="#detail-a">内容を見る</a>`) +
      panel('担当者 B の案件', `<p>${sampleB}</p><p>期限：11/18　／　木取表を確認中</p><a class="button" href="#detail-b">内容を見る</a>`)));
})();
