// 架空データによる画面見本です。
(() => {
  const { sample, sampleB, card, page, form, select, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('daily', () => page('一日の営業日報', '架空の活動を入力する画面です。送信や保存は行いません。',
      panel('日報の日付', input('日付', 'date', '2026-11-18') + action('日付を開く')) +
      panel('活動をひとつ登録', select('何をした？', ['訪問', '打ち合わせ', '電話', 'その他']) + input('開始', 'time', '09:00') + input('終了', 'time', '10:00') + '<label class="field">行き先・場所<input placeholder="架空の行き先"></label>' + select('関連案件を検索（任意）', ['案件に関係しない活動', sample]) + '<label class="field">関連案件名（手入力）<input placeholder="架空の案件名"></label><label class="field">結果<input placeholder="架空の結果"></label><label class="field">内容・次にすること（任意）<textarea rows="3" placeholder="架空の活動内容"></textarea></label>' + action('活動を追加')) +
      card('登録した実績 1件', '09:00〜10:00　架空の打ち合わせ', '内容を見る') +
      panel('一日の最後にまとめる', '<label class="field">今日の成果（任意）<textarea rows="3"></textarea></label><label class="field">明日の予定・次の対応（任意）<textarea rows="3"></textarea></label><label class="field">管理者への相談・困っていること（任意）<textarea rows="3"></textarea></label>' + action('報告書のプレビュー')) +
      card('提出履歴', '見本では提出履歴はありません。', '内容を見る')));
})();
