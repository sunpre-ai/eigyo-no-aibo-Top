// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('cancel', () => page('受注キャンセル', '架空の取消状況と対応の見本です。送信・保存されません。',
      panel('受注キャンセルを登録', select('対象の受注案件', [sample, sampleB]) + input('キャンセル日', 'date') + '<label class="field">理由<textarea rows="3" placeholder="架空の理由"></textarea></label>' + action('受注キャンセルを登録する')) +
      panel('対応中の案件', `<p><span class="chip chip-today">対応中</span> ${sampleB}</p><p>キャンセル日：11/17　／　理由：架空の理由</p><h3>通知状況</h3><p>営業・CAD・関係者への通知状況を確認します。</p>` + select('対応状況', ['未対応', '対応中', '対応済み']) + '<label class="field">今回の対応内容<textarea rows="3"></textarea></label>' + action('対応を保存する') + '<details><summary>キャンセル・対応の履歴</summary><p>11/17　キャンセルの見本を登録</p></details><details><summary>誤登録の場合：キャンセル登録を取り消す</summary><label class="field">取消理由<textarea rows="3"></textarea></label>' + action('キャンセル登録を取り消す') + '</details>') + card('対応確認済みの案件', '✓ 架空の案件 1件', '内容を見る')));
})();
