// 以下の画面は見た目と画面遷移の確認用で、実際の業務処理はありません。
(() => {
  const sample = '架空の受注先 A ／ 架空の現場 A';
  const sampleB = '架空の受注先 B ／ 架空の現場 B';
  const card = (title, body, label = '') => `<article class="panel section-card"><h2>${title}</h2><p>${body}</p>${label ? `<button class="button" type="button" data-demo="${label}">${label}</button>` : ''}</article>`;
  const page = (title, subtitle, body) => `<h1 class="page-title">${title}</h1><p class="sub">${subtitle}</p><div class="section-list">${body}</div>`;
  const form = (title, label, button) => `<section class="panel section-card"><h2>${title}</h2><label class="field">${label}<textarea rows="4" placeholder="架空の内容を入力"></textarea></label><button class="button" type="button" data-demo="${button}">${button}</button></section>`;
  const sections = [
    ['更新ダイジェスト', '架空の案件に更新があります。'],
    ['出荷に向けた工程', '確認対象 3案件・期限の近い仕事 2件'],
    ['今日のCAD作業', '架空の案件の図面とデータを確認します。'],
    ['リーダー向け表示', 'チームの進行状況を表示する予定です。'],
    ['図面入力', '図面の入力状況を確認します。'],
    ['営業予定', '今日の予定を確認します。'],
    ['相棒から、今日のひと声', 'ひとつずつ、進めていきましょう。'],
    ['現場確認・値決め', '確認待ちの架空案件があります。'],
    ['特殊材', '特別な材料の確認状況を表示します。'],
    ['チーム集計', '役割ごとの状況を表示します。'],
    ['月間実績', '今月の架空の実績です。'],
    ['新規開拓', '架空の取引先の状況を表示します。'],
    ['困っていること', 'チームで共有する内容を表示します。'],
    ['ミス・再発防止', '共有した内容と確認状況を表示します。'],
    ['フォロー', '対応が必要な案件を表示します。'],
    ['上棟・売上待ち', '確認が必要な案件を表示します。'],
    ['延期', '日程が延期された案件を表示します。'],
    ['今日の案件・確認事項', '架空の案件と確認事項を表示します。'],
  ];
  const views = {
    team: () => page('工程別の進捗・チームの情報', '現行ホームの情報を集める画面の見本です。内容は架空です。', sections.map(([title, body]) => card(title, body)).join('')),
    questions: () => page('確認依頼', '依頼と回答の見本です。', card('回答待ち', `${sample}：図面の確認をお願いします。`, '内容を見る') + card('確認済み', `${sampleB}：仕様を確認しました。`, '内容を見る') + form('確認依頼の回答', '回答内容', '回答を確認')),
    notices: () => page('お知らせ', '連絡の見本です。', card('未読・日程変更', `${sample}：予定日が変更されました。`, '内容を見る') + card('確認済み', `${sampleB}：確認依頼への回答があります。`, '内容を見る')),
    'cad-month': () => page('CAD月間実績', '架空の集計です。', card('今月の実績', '完成した案件：3件 ／ 担当した案件：5件', '詳細を見る')),
    'cad-team': () => page('CADチーム', '架空のチーム状況です。', card('チームの進捗', '担当者 A：確認中 2件 ／ 担当者 B：確認中 1件', '一覧を見る')),
    quotes: () => page('見積用', '架空の見積一覧です。', card('見積の確認', `${sample}：見積図面を確認中`, '内容を見る')),
    cancel: () => page('受注キャンセル', '取消状況の見本です。', card('対応状況', `${sampleB}：内容を確認中`, '内容を見る')),
    prevention: () => page('ミス・再発防止', '架空の共有内容です。', card('共有・確認', '架空の確認事項：仕様を確認してください。', '内容を見る')),
    trouble: () => page('困っていること', '相談内容の見本です。', card('チームへの相談', '架空の相談内容を表示します。', '内容を見る') + form('新しい相談', '相談内容', '入力内容を確認')),
    daily: () => page('日報', '日報画面の見本です。', card('今日の日報', '今日の活動を確認・入力します。') + form('今日の活動', '活動内容', '入力内容を確認')),
    performance: () => page('月間成績', '架空の集計です。', card('今月の状況', '見積・受注・売上の状況を表示します。', '詳細を見る')),
    prospects: () => page('新規開拓', '架空の活動状況です。', card('取引先の状況', '架空の取引先の活動履歴を表示します。', '詳細を見る') + form('活動を記録', '活動内容', '入力内容を確認')),
    schedule: () => page('予定', '架空の予定です。', card('今日の予定', '10:00　架空の打ち合わせ', '予定を見る')),
    settings: () => page('設定', '画面表示とログインの設定画面です。', card('表示する役割', 'プレビューでは CAD の画面を表示しています。', '役割を変更') + card('ログイン', 'この見本では実際の認証を行いません。', 'ログアウト')),
  };
  window.extraPreview = id => {
    if (id.startsWith('detail-')) return page('案件の詳細', '架空の案件の見本です。', card('案件の概要', `${sample}：構造材のデータを確認中`, '工程を見る') + card('日程と担当', '上棟日・出荷日・担当者を表示します。', '日程を見る') + card('確認依頼', '架空の確認依頼を表示します。', '確認する'));
    return views[id]?.() || '';
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-demo]');
    if (!button) return;
    const toast = document.getElementById('toast');
    toast.textContent = '画面見本のため、この操作はまだ実行されません。';
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 4000);
  });
  if (location.hash && window.extraPreview(location.hash.slice(1))) render();
})();
