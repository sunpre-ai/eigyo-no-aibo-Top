// 以下の画面は見た目と画面遷移の確認用で、実際の業務処理はありません。
(() => {
  const sample = '架空の受注先 A ／ 架空の現場 A';
  const sampleB = '架空の受注先 B ／ 架空の現場 B';
  const card = (title, body, label = '') => `<article class="panel section-card"><h2>${title}</h2><p>${body}</p>${label ? `<button class="button" type="button" data-demo="${label}">${label}</button>` : ''}</article>`;
  const page = (title, subtitle, body) => `<h1 class="page-title">${title}</h1><p class="sub">${subtitle}</p><div class="section-list">${body}</div>`;
  const form = (title, label, button) => `<section class="panel section-card"><h2>${title}</h2><label class="field">${label}<textarea rows="4" placeholder="架空の内容を入力"></textarea></label><button class="button" type="button" data-demo="${button}">${button}</button></section>`;
  const option = label => `<option>${label}</option>`;
  const select = (label, choices) => `<label class="field">${label}<select>${choices.map(option).join('')}</select></label>`;
  const input = (label, type, value = '') => `<label class="field">${label}<input type="${type}" value="${value}"></label>`;
  const panel = (title, body) => `<section class="panel section-card"><h2>${title}</h2>${body}</section>`;
  const action = label => `<button class="button" type="button" data-demo="${label}">${label}</button>`;
  const sections = [
    ['更新ダイジェスト', '本日更新：2件 ／ 新しい確認依頼：1件', 'cases'],
    ['出荷に向けた工程', '初回出荷が近い案件：3件 ／ 確認待ち：1件', 'cases'],
    ['今日のCAD作業', '期限超過：1件 ／ 本日まで：2件', 'works'],
    ['リーダー向け表示', 'チームの確認待ち：1件 ／ 対応中：2件', 'cad-team'],
    ['図面入力', '入力待ち：1件 ／ 入力完了：2件', 'quotes'],
    ['営業予定', '本日の予定：1件 ／ 今後の予定：2件', 'schedule'],
    ['相棒から、今日のひと声', 'ひとつずつ、進めていきましょう。', 'home'],
    ['現場確認・値決め', '現場確認待ち：1件 ／ 値決め確認中：1件', 'cases'],
    ['特殊材', '確認中：1件 ／ 入荷予定：1件', 'cases'],
    ['チーム集計', '営業・CADの架空の担当状況', 'cad-team'],
    ['月間実績', '今月の架空の実績を確認', 'cad-month'],
    ['新規開拓', '架空の開拓先：1件 ／ 次の対応待ち：1件', 'prospects'],
    ['困っていること', '相談中：1件 ／ 確認済み：0件', 'trouble'],
    ['ミス・再発防止', '未読の注意事項：1件', 'prevention'],
    ['フォロー', '次の対応を確認：1件', 'cases'],
    ['上棟・売上待ち', '上棟の確認待ち：1件', 'cases'],
    ['延期', '予定の確認待ち：1件', 'cases'],
    ['今日の案件・確認事項', '今日の確認事項：1件', 'questions'],
  ];
  const views = {
    team: () => page('工程別の進捗・チームの情報', '現行ホームの情報を集める画面の見本です。内容は架空です。', sections.map(([title, body, target]) => panel(title, `<p>${body}</p><a class="button" href="#${target}">内容を見る</a>`)).join('')),
    questions: () => page('確認依頼・回答', '確認依頼と回答は架空の見本です。',
      panel('自分の対応待ち 1件', `<p><span class="chip chip-today">回答待ち</span> ${sample}</p><p>件名：図面の確認　／　回答期限：11/20</p><p>図面の仕様について確認をお願いします。</p><label class="field">回答内容<textarea rows="3" placeholder="架空の回答"></textarea></label>` + action('回答を確認')) +
      panel('相手の確認・回答待ち 1件', `<p><span class="chip chip-wait">相手待ち</span> ${sampleB}</p><p>件名：仕様の確認　／　営業の回答待ち</p>` + action('内容を見る')) +
      panel('✓ 解決済み 1件', '<p>架空の案件：仕様を確認しました。</p>' + action('内容を見る'))),
    notices: () => page('お知らせ', '確認状況は架空の見本です。',
      panel('未読のお知らせ 1件', `<p><span class="chip chip-today">日程変更</span> ${sample}</p><p>上棟日：12/03 → 12/10</p><p>初回出荷日：11/28 → 12/05</p>` + action('内容を確認した')) +
      panel('✓ 確認済みのお知らせ 1件', `<p>${sampleB}：確認依頼への回答があります。</p>` + action('内容を見る'))),
    'cad-month': () => page('CADの月間実績', '架空の数値を表示しています。',
      panel('集計月', input('集計月', 'month', '2026-11') + action('この月を表示')) +
      panel('今月の実績', '<p>完成した案件：3件　／　担当した案件：5件</p><p>図面入力：2件　／　加工データ完成：1件</p>' + action('詳細を見る'))),
    'cad-team': () => page('CADチーム', 'チームの担当と進捗は架空の見本です。',
      panel('CADチーム全体の状況', '<p>担当者 A：担当 2件　／　期限超過 1件　／　確認待ち 1件</p><p>担当者 B：担当 1件　／　期限超過 0件　／　確認待ち 0件</p><a class="button" href="#trouble">CADの困りごとを見る</a>') +
      panel('担当者 A の案件', `<p><span class="chip chip-late">期限超過</span> ${sample}</p><p>期限：11/17　／　見積図面を確認中</p><a class="button" href="#detail-a">内容を見る</a>`) +
      panel('担当者 B の案件', `<p>${sampleB}</p><p>期限：11/18　／　木取表を確認中</p><a class="button" href="#detail-b">内容を見る</a>`)),
    quotes: () => page('見積用', '架空の見積一覧です。', card('見積の確認', `${sample}：見積図面を確認中`, '内容を見る')),
    cancel: () => page('受注キャンセル', '取消状況の見本です。', card('対応状況', `${sampleB}：内容を確認中`, '内容を見る')),
    prevention: () => page('ミス・再発防止', '架空の共有内容です。', card('共有・確認', '架空の確認事項：仕様を確認してください。', '内容を見る')),
    trouble: () => page('困っていること・対応状況', '架空の相談内容と入力画面です。', panel('選ぶだけで簡単に報告', select('困っていること', ['確認したいこと', '作業が進まない', 'その他']) + select('緊急度', ['通常', '急ぎ', '作業停止']) + select('関連案件（任意）', ['案件に関係しない相談', sample]) + '<label class="field">補足（任意）<textarea rows="3" placeholder="架空の相談内容"></textarea></label>' + action('管理者へ報告')) + card('チームへの相談', '架空の相談内容を表示します。', '内容を見る')),
    daily: () => page('一日の営業日報', '活動ごとに短く記録し、最後に確認して提出します。画面は架空の見本です。', panel('日報の日付', input('日付', 'date', '2026-11-18') + action('日付を開く')) + panel('活動をひとつ登録', select('活動の種類', ['訪問', '打ち合わせ', '電話', 'その他']) + input('開始時間', 'time', '09:00') + input('終了時間', 'time', '10:00') + select('関連案件', ['案件に関係しない活動', sample]) + '<label class="field">活動内容<textarea rows="3" placeholder="架空の活動内容"></textarea></label>' + action('活動を追加')) + card('今日の活動', '架空の活動：打ち合わせ 1件', '内容を見る') + card('提出内容の確認', '入力した活動を確認します。', '提出内容を確認')),
    performance: () => page('営業の月間成績', '架空の集計です。', panel('集計月', input('集計月', 'month', '2026-11') + action('この月を表示')) + card('今月の状況', '見積・受注・売上の状況を表示します。', '詳細を見る')),
    prospects: () => page('新規開拓', '架空の活動状況です。', card('取引先の状況', '架空の取引先の活動履歴を表示します。', '詳細を見る') + form('活動を記録', '活動内容', '入力内容を確認')),
    schedule: () => page('自分の予定', '打ち合わせ・訪問などの予定を確認する画面の見本です。', card('今日の予定', '10:00　架空の打ち合わせ', '予定を見る') + panel('日時を指定して予定を登録', input('日付', 'date', '2026-11-18') + input('開始時間', 'time', '10:00') + input('終了時間', 'time', '11:00') + '<label class="field">予定の内容<input type="text" placeholder="架空の予定"></label>' + action('入力内容を確認'))),
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
