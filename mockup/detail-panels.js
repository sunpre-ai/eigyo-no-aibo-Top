// 案件詳細の追加項目。入力は見本であり、外部には送信しません。
(() => {
  const field = (label, type = 'text') => `<label class="field">${label}<input type="${type}"></label>`;
  const note = label => `<label class="field">${label}<textarea rows="3"></textarea></label>`;
  const choice = (label, options) => `<label class="field">${label}<select>${options.map(item => `<option>${item}</option>`).join('')}</select></label>`;
  const action = label => `<button class="button" type="button" data-demo="${label}">${label}</button>`;
  const panel = (title, text, contents) => `<section class="panel section-card"><details><summary>${title}</summary><p>${text}</p>${contents}</details></section>`;

  window.detailPreviewPanels = () => [
    panel('受注先の引き継ぎメモ', '営業・CADで共有する架空の引き継ぎ事項です。', note('次回に引き継ぐ要望・確認事項') + action('同じ受注先の営業・CADへ共有する')),
    panel('最終明細書・値決め金額', '最終明細書の共有と値決め状況を表示します。', field('値決め・交渉金額（円）', 'number') + note('値決め・交渉のメモ（任意）') + action('値決め金額を保存')),
    panel('上棟後メモ・次回に活かすこと', '上棟結果と次回への対応を記録します。', field('確認日', 'date') + choice('上棟の状況', ['未確認', '実施済み', '確認中']) + note('先方の要望・言われたこと（任意）') + note('次回へのメモ・必要な対応（任意）') + action('上棟後メモを保存')),
    panel('この案件で気をつけること', '過去のミスや再発防止の注意事項を表示します。', note('確認した対策') + action('対策を確認')),
    panel('見積の失注を登録', '受注前の失注を登録する画面です。', field('失注日', 'date') + note('失注理由') + action('失注を登録する')),
    panel('見積の版・変更履歴', '過去の見積や再見積の依頼を表示します。', note('変更内容') + field('変更後の階数', 'number') + field('変更後の坪数', 'number') + note('変更後の仕様') + field('新しい図面の共有リンク（任意）', 'url') + field('見積期限', 'date') + field('担当CAD') + action('CADへ再見積を依頼')),
    panel('金物の発注・入荷目標', '架空の発注状況です。', field('発注日', 'date') + field('入荷予定日', 'date') + action('内容を確認')),
    panel('確認・対応の履歴', '架空の更新と確認履歴です。', '<p>11/18　担当者 A：内容を確認</p>' + action('変更内容を確認しました')),
    panel('営業・CADの共有進捗', '営業とCADが次の対応を共有します。', choice('現在の進捗', ['未着手', '対応中', '確認待ち', '完了']) + note('次の対応・共有メモ（任意）') + field('対応期限（任意）', 'date') + action('シートに保存して共有')),
    panel('仮木取表', '仮木取表の状況を確認します。', choice('仮木取表の状況', ['未着手', '作成中', '提出済み']) + field('提出日（提出済の場合）', 'date') + note('共有メモ（任意）') + action('仮木取表の状況を登録')),
    panel('特殊材・指定材の有無と発注状況', '特殊材の状況と入荷予定を共有します。', choice('特殊材の状況', ['未確認', 'あり', 'なし', '確認中']) + field('入荷予定日（分かる場合）', 'date') + note('材料名・発注先・共有メモ（任意）') + action('営業・CADで共有する')),
    panel('発注前の在庫確認', '現場担当者への確認状況を表示します。', choice('状況', ['未確認', '確認依頼中', '確認済み']) + field('在庫を確認する現場担当者') + field('確認・依頼日', 'date') + field('確認結果') + note('対象材料・必要数・使える在庫・不足数・発注残のメモ') + action('在庫確認を営業・CADで共有する')),
    panel('構造計算の外注管理', '外注先・依頼・納品状況を共有します。', choice('状況', ['未依頼', '依頼中', '納品済み']) + field('外注先名') + field('依頼日', 'date') + field('納品予定日', 'date') + field('受領日', 'date') + note('計算内容・修正依頼・確認事項') + action('外注状況をCADへ共有する')),
    panel('現場・配送条件', '営業とCADで共有する架空の現場情報です。', note('現場の配送条件') + action('内容を確認')),
    panel('配車担当への現場下見依頼', '搬入条件などを事前に確認します。', field('配車担当') + field('現場住所・目印') + field('下見希望日', 'date') + note('確認してほしい内容') + action('配車担当に下見を依頼・メール送信')),
    panel('上棟の延期・日程変更', '延期した場合の新しい日程を記録します。', field('新しい上棟予定日', 'date') + note('延期理由') + action('延期を登録する')),
  ].join('');
})();
