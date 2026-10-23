/* Jewel: fixed top (strip + header) with an in-flow gap, and the narrow-screen menu. */
(() => {
  const top = document.getElementById('fixedtop');
  const setGap = () => {
    if (top) document.documentElement.style.setProperty('--fixed-h', `${top.getBoundingClientRect().height}px`);
  };
  setGap();
  new ResizeObserver(setGap).observe(top);

  const toggle = document.querySelector('.toggle');
  const drawer = document.getElementById('drawer');
  if (!toggle || !drawer) return;

  const show = (open) => {
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  toggle.addEventListener('click', () => show(drawer.hidden));
  drawer.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) show(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || drawer.hidden) return;
    show(false);
    toggle.focus();
  });
  const wide = window.matchMedia('(min-width: 980px)');
  wide.addEventListener('change', () => { if (wide.matches) show(false); });
})();
