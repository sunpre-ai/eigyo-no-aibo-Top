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
  const views = {};
  window.previewHelpers = { sample, sampleB, card, page, form, select, input, panel, action };
  window.registerPreviewView = (id, view) => {
    views[id] = view;
    if (location.hash.slice(1).split('?')[0] === id) render();
  };

  window.extraPreview = id => {
    if (id.startsWith('detail-')) {
      const project = window.previewCaseById?.(id.slice(7));
      if (!project) return page('案件の詳細', '対象の架空案件が見つかりません。', '<a class="button" href="#cases">案件一覧へ戻る</a>');
      return page('案件の詳細', '架空の案件を表示しています。入力内容は送信・保存されません。',
      panel('案件の概要', `<p>${project.name}</p><p>営業：担当者 A　／　CAD：担当者 B</p><p>上棟日：${project.erect}　／　初回出荷日：${project.ship}</p><p>工程：${project.progress}/4</p><a class="button" href="#cases">案件一覧へ戻る</a>`) +
      panel('見積図面の入力完了報告', input('入力完了日', 'date') + '<label class="field">営業への連絡<textarea rows="3" placeholder="架空の連絡内容"></textarea></label>' + action('入力完了を報告')) +
      panel('上棟日・初回出荷日の変更', input('上棟日', 'date') + input('初回出荷日', 'date') + '<label class="field">変更理由<textarea rows="3" placeholder="架空の変更理由"></textarea></label>' + action('変更内容を確認')) +
      panel('現場確認を CAD へ共有', '<label class="field">現場の配送条件<textarea rows="3" placeholder="架空の配送条件"></textarea></label>' + action('共有内容を確認')) +
      panel('営業へ確認依頼', '<label class="field">件名<input placeholder="架空の件名"></label><label class="field">確認内容<textarea rows="3" placeholder="架空の確認内容"></textarea></label>' + input('回答期限', 'date') + action('確認依頼を確認')) +
      card('図面からの確認依頼', '架空の確認依頼の履歴を表示します。', '内容を見る') + (window.detailPreviewPanels?.() || ''));
    }
    return views[id]?.() || '';
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-demo]');
    if (!button) return;
    const dialog = document.getElementById('preview-dialog');
    const title = document.getElementById('preview-dialog-title');
    const values = document.getElementById('preview-dialog-values');
    title.textContent = button.dataset.demo;
    values.replaceChildren();
    const panel = button.closest('details') || button.closest('.section-card');
    if (panel) {
      panel.querySelectorAll('label.field').forEach(label => {
        const field = label.querySelector('input, select, textarea');
        if (!field || !field.value) return;
        const line = document.createElement('p');
        const name = label.childNodes[0]?.textContent?.trim() || '入力内容';
        line.textContent = `${name}：${field.value}`;
        values.appendChild(line);
      });
    }
    dialog.showModal();
  });
  if (location.hash && window.extraPreview(location.hash.slice(1))) render();
})();
