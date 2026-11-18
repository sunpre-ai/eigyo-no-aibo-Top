// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('questions', () => page('確認依頼・回答', '確認依頼と回答は架空の見本です。',
      panel('自分の対応待ち 1件', `<p><span class="chip chip-today">回答待ち</span> ${sample}</p><p>件名：図面の確認　／　回答期限：11/20</p><p>図面の仕様について確認をお願いします。</p><label class="field">回答内容<textarea rows="3" placeholder="架空の回答"></textarea></label>` + action('回答を確認')) +
      panel('相手の確認・回答待ち 1件', `<p><span class="chip chip-wait">相手待ち</span> ${sampleB}</p><p>件名：仕様の確認　／　営業の回答待ち</p>` + action('内容を見る')) +
      panel('✓ 解決済み 1件', '<p>架空の案件：仕様を確認しました。</p>' + action('内容を見る'))));
})();
