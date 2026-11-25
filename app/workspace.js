// 新デザインのナビから、業務画面の既存の表示・操作を呼ぶ。
(() => {
  const mobile = [['home', 'ホーム'], ['cases', '案件'], ['questions', '確認依頼'],
    ['notifications', 'お知らせ'], ['more', 'その他']];
  const glyphs = {
    home: '<path d="m3 10 9-7 9 7v10H5V10"/><path d="M9 20v-7h6v7"/>',
    cases: '<path d="M3 6h7l2 2h9v11H3z"/>',
    questions: '<path d="M3 4h18v13H8l-5 4z"/>',
    notifications: '<path d="M6 8a6 6 0 0 1 12 0c0 6 3 9 3 9H3s3-3 3-9"/><path d="M10 21h4"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  };
  const icon = tab => '<svg class="pwa-nav-icon" aria-hidden="true" viewBox="0 0 24 24">' +
    (glyphs[tab] || glyphs.more) + '</svg>';
  let mobileNav, homeSummary;
  function labelButton(button, tab, label) {
    const text = document.createElement('span');
    text.textContent = label;
    button.replaceChildren(text);
    button.insertAdjacentHTML('afterbegin', icon(tab));
  }
  function setup() {
    if (mobileNav) return;
    const app = document.getElementById('app');
    const toolbar = app.querySelector('.app-toolbar');
    document.getElementById('pwa-header-tools').prepend(toolbar);
    const controls = app.querySelector('.app-controls');
    const settings = document.getElementById('pwa-settings');
    controls.id = 'pwa-settings-panel';
    settings.setAttribute('aria-controls', controls.id);
    controls.addEventListener('toggle', () => settings.setAttribute('aria-expanded', String(controls.open)));
    settings.addEventListener('click', () => {
      controls.open = !controls.open;
      if (controls.open) controls.scrollIntoView({ block: 'nearest' });
    });
    const navigation = document.getElementById('main-nav');
    for (const button of navigation.querySelectorAll('button[data-tab]'))
      if (glyphs[button.dataset.tab])
        labelButton(button, button.dataset.tab, button.textContent.replace(/^[^\p{L}\p{N}]+/u, ''));
    const content = document.getElementById('content');
    const page = document.createElement('div');
    page.className = 'pwa-page';
    homeSummary = document.createElement('div');
    homeSummary.className = 'pwa-home-summary';
    content.before(page);
    page.append(homeSummary);
    for (const id of ['project-data-warning', 'admin-preview-banner', 'schedule-priority', 'today-erections'])
      page.append(document.getElementById(id));
    page.append(content);
    const menu = document.getElementById('menu-toggle');
    mobileNav = document.createElement('nav');
    mobileNav.id = 'pwa-mobile-nav';
    mobileNav.setAttribute('aria-label', '画面の切り替え');
    for (const [tab, label] of mobile) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.destination = tab;
      labelButton(button, tab, label);
      if (tab === 'more') {
        button.setAttribute('aria-controls', navigation.id);
        button.setAttribute('aria-expanded', 'false');
      }
      button.addEventListener('click', () => {
        const destination = tab === 'more' ? menu
          : tab === 'notifications' ? document.getElementById('notifications')
          : navigation.querySelector('[data-tab="' + tab + '"]');
        destination?.click();
        if (tab === 'more') button.setAttribute('aria-expanded', menu.getAttribute('aria-expanded'));
      });
      mobileNav.append(button);
    }
    app.append(mobileNav);
  }
  function update(tab, selected) {
    setup();
    const current = selected && (tab === 'home' || tab === 'cases') ? 'cases' : tab;
    const destination = mobile.some(item => item[0] === current) ? current : 'more';
    for (const button of mobileNav.querySelectorAll('button')) {
      if (button.dataset.destination === 'more')
        button.setAttribute('aria-expanded', document.getElementById('menu-toggle').getAttribute('aria-expanded'));
      if (button.dataset.destination === destination) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    const content = document.getElementById('content');
    const work = current === 'home' ? content.querySelector('.today-work') : null;
    // renderPage が更新したホームの集計だけを、重要なお知らせの上に置く。
    if (!work || work.querySelector('.today-work-heading')) homeSummary.replaceChildren();
    if (work) {
      // 期限・件数・リンクは業務画面の集計機能を使う。
      const heading = work.querySelector('.today-work-heading');
      const previous = heading?.querySelector('.case-bird');
      if (previous) {
        const bird = document.createElement('img');
        bird.className = 'pwa-home-bird';
        bird.src = './workspace-bird.png';
        bird.alt = '';
        previous.replaceWith(bird);
      }
      if (heading) homeSummary.append(heading, work.querySelector('.work-counts'));
      content.prepend(work);
    }
  }
  document.addEventListener('DOMContentLoaded', setup);
  window.aiboWorkspace = Object.freeze({ update });
})();
