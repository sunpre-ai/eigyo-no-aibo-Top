// 予定の架空データによる画面見本です。
(() => {
  const { page, input, panel, action } = window.previewHelpers;
  window.registerPreviewView('schedule', () => page('自分の予定', '架空の予定です。入力内容は送信・保存されません。',
    panel('今日の予定', '<p>10:00〜11:00　架空の打ち合わせ</p><p>14:00〜15:00　架空の訪問</p>' + action('予定を見る')) +
    panel('今後の予定', '<p>11/19　10:00　架空の予定</p><p>11/20　14:00　架空の予定</p>' + action('予定を見る')) +
    panel('日時を指定して予定を登録', input('日付', 'date', '2026-11-18') + input('開始時間', 'time', '10:00') + input('終了時間', 'time', '11:00') + '<label class="field">予定の内容<input type="text" placeholder="架空の予定"></label>' + action('入力内容を確認'))));
})();
