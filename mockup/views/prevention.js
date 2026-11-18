// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('prevention', () => page('ミス・再発防止', '共有内容と対策の確認は別々に扱います。架空の見本です。',
      panel('共有中の注意事項', '<p><span class="chip chip-today">未読</span> 図面と仕様書の確認について</p><p>架空の注意事項です。対象の案件では必要な対策を確認します。</p>' + action('読みました')) +
      panel('案件での対策確認', `<p>${sample}</p>` + select('対策状況', ['未確認', '確認中', '対策済み']) + '<label class="field">確認内容<textarea rows="3" placeholder="架空の対策内容"></textarea></label>' + action('対策を確認')) +
      card('報告・対策管理', '架空の報告と対策を確認します。', '内容を見る')));
})();
