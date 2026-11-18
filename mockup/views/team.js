// 現行ホームにある工程・チーム情報の架空データ見本です。
(() => {
  const { sample, sampleB, page, panel, action, input } = window.previewHelpers;
  const row = (status, title, detail, target, label = '内容を見る') =>
    `<article class="team-entry"><p><span class="chip chip-wait">${status}</span> <strong>${title}</strong></p><p>${detail}</p><a class="button" href="#${target}">${label}</a></article>`;
  const sections = [
    ['更新ダイジェスト', row('更新', sample, '日程変更：上棟日を確認してください。', 'detail-a', '更新内容を開いて確認')],
    ['出荷に向けた工程', row('出荷待ち', sample, '初回出荷日 12/05 ／ 構造材を確認中（2/4）', 'detail-a', '案件の共有進捗を開く')],
    ['今日のCAD作業', row('本日まで', sampleB, '担当者 A：木取表を作成中 ／ 期限 11/18', 'detail-b', '作業した案件を見る')],
    ['リーダー向け表示', row('確認待ち', sample, '図面入力の完了報告：1件', 'cad-team', 'チームの状況を見る')],
    ['図面入力', row('入力中', '架空の現場 D', '見積図面の入力待ち：1件', 'quotes', '見積の状況を見る')],
    ['営業予定', row('今日', '担当者 A', '10:00　架空の訪問 ／ 次の予定 14:00', 'schedule', '明日以降の予定を確認')],
    ['相棒から、今日のひと声', row('確認', sample, '確認依頼への回答を確認しましょう。', 'questions', '今日の確認を見る')],
    ['現場確認・値決め', row('現場確認', sample, '配送条件と値決め金額を確認してください。', 'detail-a', '現場確認・下見依頼へ')],
    ['特殊材', row('手配確認', sampleB, '材料の有無と入荷予定を確認します。', 'detail-b', '確認する案件を見る')],
    ['チーム集計', row('担当状況', '営業・CADチーム', '担当者 A：2件 ／ 担当者 B：1件', 'cad-team', '担当状況を見る')],
    ['月間実績', row('今月', '担当者 A', '完成：3件 ／ 担当中：2件', 'cad-month', '月間実績を見る')],
    ['新規開拓', row('次の対応', '架空の取引先 A', '接触中 ／ 次の対応：資料の準備', 'prospects', '開拓状況を更新する')],
    ['困っていること', row('相談中', '架空の相談', '担当者 A が作業について確認しています。', 'trouble', '相談内容を見る')],
    ['ミス・再発防止', row('未読', '図面と仕様書の確認について', '注意事項の確認と、案件の対策は別々に記録します。', 'prevention', '注意事項を見る')],
    ['フォロー', row('対応待ち', sample, '見積提出後のフォローを記録してください。', 'detail-a', '案件を開いて対応する') + input('実施日', 'date') + '<label class="field">対応内容<textarea rows="3"></textarea></label>' + action('記録する')],
    ['上棟・売上待ち', row('上棟確認', sample, '上棟結果と売上の確認待ちです。', 'detail-a', '上棟・売上を確認する')],
    ['延期', row('日程確認待ち', sampleB, '変更後の上棟日と初回出荷日を確認します。', 'detail-b', '日程を確認・更新する')],
    ['今日の案件・確認事項', row('回答待ち', sample, '図面の確認依頼：回答期限 11/20', 'questions', '確認依頼を見る')],
  ];
  window.registerPreviewView('team', () => page(
    '工程別の進捗・チームの情報',
    '各区画の内容は架空です。入力内容は送信・保存されません。',
    sections.map(([title, body]) => panel(title, body)).join(''),
  ));
})();
