(function () {
  'use strict';

  const root = document.documentElement;
  const languageButton = document.querySelector('[data-language]');
  const progress = document.getElementById('progress');
  const sideToc = document.getElementById('sidetoc');
  const sideFill = document.getElementById('stfill');
  const sidePct = document.getElementById('stpct');
  const collapseButton = document.getElementById('sthide');
  const tocLinks = Array.from(document.querySelectorAll('.side-toc a[href^="#"]'));
  const sections = tocLinks.map((link) => document.getElementById(link.getAttribute('href').slice(1))).filter(Boolean);

  function setLanguage(language, remember) {
    const next = language === 'zh' ? 'zh-CN' : 'en';
    root.lang = next;
    if (languageButton) {
      languageButton.textContent = next === 'zh-CN' ? 'EN' : '中文';
      languageButton.setAttribute('aria-label', next === 'zh-CN' ? 'Switch to English' : '切换为中文');
    }
    if (remember) {
      try { localStorage.setItem('zhonghui-site-language', next); } catch (error) { /* storage may be unavailable */ }
    }
  }

  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  let savedLanguage = null;
  try { savedLanguage = localStorage.getItem('zhonghui-site-language'); } catch (error) { /* storage may be unavailable */ }
  setLanguage(queryLanguage === 'zh' ? 'zh' : queryLanguage === 'en' ? 'en' : savedLanguage === 'zh-CN' ? 'zh' : 'en', true);

  languageButton?.addEventListener('click', function () {
    setLanguage(root.lang === 'zh-CN' ? 'en' : 'zh', true);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', root.lang === 'zh-CN' ? 'zh' : 'en');
    history.replaceState(null, '', url);
    updateProgress();
  });

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    if (progress) progress.style.width = amount + '%';
    let current = 0;
    const marker = window.scrollY + Math.min(150, window.innerHeight * 0.24);
    sections.forEach((section, index) => { if (section.offsetTop <= marker) current = index; });
    tocLinks.forEach((link, index) => {
      const item = link.parentElement;
      item?.classList.toggle('on', index === current);
      item?.classList.toggle('done', index < current);
    });
    if (sideFill && sections.length) sideFill.style.height = (current / Math.max(1, sections.length - 1)) * 100 + '%';
    if (sidePct) sidePct.textContent = Math.round(amount) + '%';
  }

  collapseButton?.addEventListener('click', function () {
    const collapsed = sideToc?.classList.toggle('is-collapsed');
    collapseButton.textContent = collapsed ? '›' : '‹';
    collapseButton.setAttribute('aria-expanded', String(!collapsed));
    collapseButton.setAttribute('aria-label', collapsed ? 'Expand contents' : 'Collapse contents');
  });

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  window.addEventListener('load', updateProgress);
  updateProgress();
})();
