// Run in the head so the saved theme is applied before the first paint.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const key = 'mmbajo-theme';
  const valid = (value) => value === 'light' || value === 'dark';
  const read = () => {
    try { const value = localStorage.getItem(key); return valid(value) ? value : null; }
    catch { return null; }
  };
  let preference = read();
  const current = () => {
    // Same-origin embeds also follow a choice made with storage disabled.
    try {
      const inherited = window.parent !== window && window.parent.document.documentElement.dataset.theme;
      if (valid(inherited)) return inherited;
    } catch { /* A cross-origin embed uses its own preference. */ }
    return preference || (system.matches ? 'dark' : 'light');
  };
  const apply = (theme) => {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.hidden = false;
    });
    window.dispatchEvent(new Event('themechange'));
  };
  apply(current());
  document.addEventListener('DOMContentLoaded', () => {
    apply(current());
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(key, preference); } catch { /* Still works for this page. */ }
        apply(preference);
      });
    });
  }, { once: true });
  system.addEventListener('change', () => { if (!preference) apply(current()); });
  window.addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) { preference = read(); apply(current()); }
  });
  window.addEventListener('message', (event) => {
    if (window.parent !== window && event.source === window.parent && event.origin === location.origin
      && event.data?.type === 'site:theme' && valid(event.data.theme)) apply(event.data.theme);
  });
})();
