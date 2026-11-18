// 困りごとの架空データによる画面見本です。
(() => {
  const { sample, page, select, panel, action } = window.previewHelpers;
  window.registerPreviewView('trouble', () => page('困っていること・対応状況', '架空の相談内容です。入力内容は送信・保存されません。',
    panel('選ぶだけで簡単に報告', select('困っていること', ['確認したいこと', '作業が進まない', 'その他']) + select('緊急度', ['通常', '急ぎ', '作業停止']) + select('関連案件（任意）', ['案件に関係しない相談', sample]) + '<label class="field">補足（任意）<textarea rows="3" placeholder="架空の相談内容"></textarea></label>' + action('管理者へ報告')) +
    panel('チームへの相談', `<p><span class="chip chip-wait">対応中</span> ${sample}</p><p>担当者 A：架空の相談内容</p><details><summary>報告・対応の履歴</summary><p>11/18　相談を報告</p></details>` + select('対応状況', ['未対応', '対応中', '解決済み']) + '<label class="field">今回の対応内容<textarea rows="3"></textarea></label>' + action('対応を記録・共有') + '<details><summary>解決していない場合は再相談</summary><label class="field">再相談の内容<textarea rows="3"></textarea></label>' + action('再相談する') + '</details>')));
})();
