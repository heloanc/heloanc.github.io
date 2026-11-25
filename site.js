(() => {
  const buttons = document.querySelectorAll('[data-language]');
  const setLanguage = lang => {
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
    buttons.forEach(button => {
      button.textContent = lang === 'zh-CN' ? 'English' : '中文';
      button.setAttribute('aria-label', lang === 'zh-CN' ? 'Switch to English' : '切换到中文');
    });
    try { localStorage.setItem('zhonghui-site-language', document.documentElement.lang); } catch {}
  };
  let saved; try { saved = localStorage.getItem('zhonghui-site-language'); } catch {}
  const requested = new URLSearchParams(location.search).get('lang');
  setLanguage(requested === 'zh' ? 'zh-CN' : requested === 'en' ? 'en' : saved || 'en');
  buttons.forEach(button => button.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'zh-CN' : 'en')));
  document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));
})();
