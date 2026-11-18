// 本番接続を持たない画面見本。すべての表示データは架空です。
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H5V10"/><path d="M9 20v-7h6v7"/>',
  cases: '<path d="M3 6h7l2 2h9v11H3z"/>',
  questions: '<path d="M3 4h18v13H8l-5 4z"/>',
  notices: '<path d="M6 8a6 6 0 0 1 12 0c0 6 3 9 3 9H3s3-3 3-9"/><path d="M10 21h4"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const svg = name => `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.more}</svg>`;
const mainNav = [['home', 'ホーム'], ['cases', '案件'], ['questions', '確認依頼'], ['notices', 'お知らせ']];
const otherNav = [['cad-month', 'CAD月間実績'], ['cad-team', 'CADチーム'], ['quotes', '見積用'], ['cancel', '受注キャンセル'], ['prevention', 'ミス・再発防止'], ['trouble', '困っていること'], ['daily', '日報'], ['performance', '月間成績'], ['prospects', '新規開拓'], ['schedule', '予定'], ['settings', '設定']];
const work = [
  { id: 'a', state: 'late', badge: '期限超過', title: '見積図面を入力する', site: '架空の受注先 A ／ 架空の現場 A', due: '期限 11/17（昨日）' },
  { id: 'b', state: 'today', badge: '本日まで', title: '木取表を提出する', site: '架空の受注先 B ／ 架空の現場 B', due: '期限 11/18（今日）' },
  { id: 'c', state: 'today', badge: '本日まで', title: '金物を発注する', site: '架空の受注先 C ／ 架空の現場 C', due: '期限 11/18（今日）' },
  { id: 'd', state: 'wait', badge: '相手待ち', title: '確認依頼の回答を確認する', site: '架空の受注先 D ／ 架空の現場 D', due: '期限 11/20 ・ 営業の回答待ち' },
];
const content = document.getElementById('content');
function route() { return location.hash.slice(1).split('?')[0] || 'home'; }
function nav(active) {
  const items = list => list.map(([id, label]) => `<a class="nav-link" href="#${id}" ${active === id ? 'aria-current="page"' : ''}>${svg(id)}<span>${label}</span>${id === 'notices' ? '<b class="badge">1</b>' : ''}</a>`).join('');
  document.getElementById('sidebar').innerHTML = items(mainNav) + '<p class="nav-caption">そのほか</p>' + items(otherNav);
  document.getElementById('tabbar').innerHTML = [...mainNav, ['more', 'その他']].map(([id, label]) => `<a href="#${id}" ${active === id ? 'aria-current="page"' : ''}>${svg(id)}<span>${label}</span></a>`).join('');
}
function workCard(item) { return `<a class="work" href="#detail-${item.id}"><span class="chip chip-${item.state}">${item.badge}</span><strong>${item.title}</strong><p class="work-site">${item.site}</p><p class="sub">${item.due}　›</p></a>`; }
function tiles() { return [['late','期限超過',1], ['today','本日まで',2], ['waiting','引き継ぎ・回答待ち',1], ['none','期限・担当の確認',0]].map(([type, label, count]) => count ? `<a class="tile ${type}" href="#works?state=${type}"><span>${label}</span><strong>${count}<small>件</small></strong></a>` : `<span class="tile ${type}" aria-disabled="true"><span>${label}</span><strong>${count}<small>件</small></strong></span>`).join(''); }
function home() {
  return `<section class="hero"><div><p>11月18日（水）　おはようございます</p><h1>今日の仕事は <strong>4</strong> 件です</h1><p>今日も一緒に進めましょう。</p></div><div class="hero-tools"><a class="hero-notice" href="#notices" aria-label="お知らせ、未読1件">${svg('notices')}<span class="badge">1</span></a><img src="./aibo-bird.png" alt=""></div></section>
    <p class="sync">画面プレビュー：架空データを表示中</p>
    <div class="tiles">${tiles()}</div>
    <a class="strip" href="#team"><span><strong>CADの期限超過・確認待ち</strong><small>期限超過 1件・営業回答・承認待ち等 1件</small></span><span aria-hidden="true">›</span></a>
    <div class="columns"><section class="home-work"><div class="section-head"><h2>期限の近い仕事</h2><a href="#works">すべて 4件</a></div><div class="works">${work.map(workCard).join('')}</div></section>
    <div class="home-side"><section class="notice"><h2>重要連絡 <span class="chip chip-today">確認待ち 1件</span></h2><div class="notice-body"><p class="sub">日程変更</p><strong>架空の受注先 A ／ 架空の現場 A</strong><p>上棟日　12/03 → 12/10</p><p>初回出荷日　11/28 → 12/05</p></div><button type="button" class="button button-accent" data-action="notice">内容を確認した</button></section><a class="link-row" href="#team">工程別の進捗・チームの情報 <span aria-hidden="true">›</span></a></div></div>`;
}
function empty(title, message) { return `<section class="empty"><h1>${title}</h1><p>${message}</p><a class="button" href="#home">ホームへ戻る</a></section>`; }
function render() {
  const active = route(); nav(active);
  if (active === 'home') content.innerHTML = home();
  else if (active === 'cases') content.innerHTML = window.casePreview ? window.casePreview() : empty('案件', 'この画面はまだ作成していません。');
  else if (active === 'works') {
    const selected = new URLSearchParams(location.hash.split('?')[1] || '').get('state');
    const state = selected === 'waiting' ? 'wait' : selected;
    const visible = state ? work.filter(item => item.state === state) : work;
    content.innerHTML = `<h1 class="page-title">期限の近い仕事</h1><div class="works">${visible.map(workCard).join('')}</div>`;
  }
  else if (active === 'team') content.innerHTML = empty('工程別の進捗・チームの情報', 'この画面は、現行の項目を後から組み込む予定です。');
  else if (active === 'more') content.innerHTML = `<section class="empty"><h1>その他</h1><nav class="nav-example" aria-label="その他の画面">${otherNav.map(([id,label]) => `<a class="nav-link" href="#${id}">${svg(id)}${label}</a>`).join('')}</nav></section>`;
  else if (active.startsWith('detail-')) content.innerHTML = empty('案件の詳細', '架空の案件です。詳細画面はまだ作成していません。');
  else { const found = [...mainNav, ...otherNav].find(([id]) => id === active); content.innerHTML = empty(found?.[1] || '画面プレビュー', 'この画面はまだ作成していません。'); }
}
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action="notice"]');
  if (!target) return;
  if (target.dataset.action === 'notice') { const toast = document.getElementById('toast'); toast.textContent = '画面見本のため、実際の確認は記録されません。'; toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 4000); }
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
render();
