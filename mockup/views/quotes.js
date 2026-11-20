(() => {
  const frameId = 'quote-reception-frame';
  window.registerPreviewView('quotes', () =>
    '<h1 class="page-title">見積用</h1>' +
    `<iframe id="${frameId}" title="見積受付とカレンダーの画面プレビュー" src="./views/quote-reception.html?v=20261120-1" sandbox="allow-scripts" style="display:block;width:100%;height:48rem;border:0"></iframe>`
  );

  window.addEventListener('message', ({ source, data }) => {
    const frame = document.getElementById(frameId);
    if (!frame || frame.contentWindow !== source || data?.type !== 'quote-reception-preview:resize') return;
    if (Number.isFinite(data.height) && data.height > 0) {
      frame.style.height = `${Math.ceil(data.height)}px`;
    }
  });
})();
