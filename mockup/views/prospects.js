// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('prospects', () => page('新規開拓', '開拓先と活動履歴は架空の見本です。送信・保存されません。',
      panel('開拓先の登録・進捗更新', '<label class="field">会社名<input placeholder="架空の会社"></label><label class="field">地域<input placeholder="架空の地域"></label>' + select('進捗', ['未接触', '接触中', '商談中', '保留', '初受注', '終了']) + input('最終接触日', 'date') + '<label class="field">次の対応<input placeholder="架空の対応"></label>' + input('次の対応期限', 'date') + '<label class="field">補足<textarea rows="3"></textarea></label>' + action('保存して管理者と共有')) +
      panel('開拓先の状況', '<p><span class="chip chip-wait">接触中</span> 架空の取引先 A</p><p>最終接触：11/17　／　次の対応：資料を用意する</p>' + action('活動履歴を見る') + ' ' + action('進捗を更新'))));
})();
