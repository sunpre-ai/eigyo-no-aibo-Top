// 案件画面専用の架空データ。外部への読み書きは行いません。
(() => {
  const cases = [
    { id: 'a', kind: '受注', name: '架空の受注先 A ／ 架空の現場 A', erect: '12/10', erectState: '確定', ship: '12/05', shipState: '未確定', progress: 2, newCount: 2 },
    { id: 'b', kind: '受注', name: '架空の受注先 B ／ 架空の現場 B', erect: '1/15', erectState: '未確定', ship: '未登録', shipState: '未確定', progress: 1, newCount: 0 },
    { id: 'c', kind: '受注', name: '架空の受注先 C ／ 架空の現場 C', erect: '12/20', erectState: '確定', ship: '12/16', shipState: '確定', progress: 0, newCount: 1 },
    { id: 'd', kind: '見積', name: '架空の受注先 D ／ 架空の現場 D', erect: '未登録', erectState: '未確定', ship: '未登録', shipState: '未確定', progress: 0, newCount: 0 },
    { id: 'e', kind: '上棟済', name: '架空の受注先 E ／ 架空の現場 E', erect: '10/20', erectState: '確定', ship: '10/12', shipState: '確定', progress: 4, newCount: 0 },
    { id: 'f', kind: '失注', name: '架空の受注先 F ／ 架空の現場 F', erect: '未登録', erectState: '未確定', ship: '未登録', shipState: '未確定', progress: 0, newCount: 0 },
    { id: 'g', kind: '受注', name: '架空の受注先 G ／ 過去の現場 G', erect: '9/10', erectState: '確定', ship: '9/01', shipState: '確定', progress: 4, newCount: 0, past: true },
  ];
  let filter = '受注';
  let past = false;
  function progress(item) {
    const names = ['仕様書', '承認', '構造材', '羽柄・合板'];
    const segments = names.map((name, index) => `<span class="${index < item.progress ? 'done' : index === item.progress && item.progress < 4 ? 'current' : ''}">${index < item.progress ? '✓ ' : index === item.progress && item.progress < 4 ? '● ' : ''}${name}</span>`).join('');
    return `<div class="progress" aria-label="工程 ${item.progress}/4">${segments}</div>`;
  }
  function caseCard(item) {
    return `<a class="case" href="#detail-${item.id}"><div><span class="chip chip-ok">${item.kind}</span> ${item.newCount ? `<span class="chip chip-wait">更新 ${item.newCount}件</span>` : ''}</div><strong class="case-title">${item.name}　›</strong><div class="dates"><p class="date"><span>上棟日</span><strong>${item.erect}</strong><span>${item.erectState}</span></p><p class="date"><span>初回出荷日</span><strong>${item.ship}</strong><span>${item.shipState}</span></p></div><p class="sub">営業：担当 A ／ CAD：担当 B</p><p>${item.progress === 4 ? '✓ 加工データ完成' : `工程を確認中（${item.progress}/4）`}</p>${progress(item)}<p class="sub">次：案件の内容を確認</p></a>`;
  }
  window.casePreview = () => {
    const kinds = ['見積', '受注', '上棟済', '失注'];
    const allowed = cases.filter(item => past || !item.past);
    const visible = allowed.filter(item => item.kind === filter);
    return `<h1 class="page-title">案件</h1><p class="sub">案件の進み具合を確認できます。</p><div class="filters" aria-label="案件の種類">${kinds.map(kind => `<button class="button filter" type="button" data-filter="${kind}" aria-pressed="${kind === filter}">${kind} ${allowed.filter(item => item.kind === kind).length}件</button>`).join('')}</div><label class="toggle"><input type="checkbox" data-action="past" ${past ? 'checked' : ''}>過去物件を表示</label><div class="cases">${visible.map(caseCard).join('')}</div>`;
  };
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-filter]');
    if (target) { filter = target.dataset.filter; render(); }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-action="past"]')) { past = event.target.checked; render(); }
  });
  if (location.hash.startsWith('#cases')) render();
})();
