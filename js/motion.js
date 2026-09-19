(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('motion-ready');

  const targets = [
    '.section-head', '.page-hero > .container', '.product-card',
    '.category-circle', '.gender-tile', '.contact-wrap > *',
    '.cart-layout > *', '.footer-grid > *'
  ].join(',');
  const seen = new WeakSet();

  const reveal = (element) => {
    if (seen.has(element)) return;
    seen.add(element);
    element.classList.add('motion-reveal');
    const siblings = element.parentElement ? [...element.parentElement.children] : [];
    const index = Math.max(0, siblings.indexOf(element));
    element.style.setProperty('--motion-delay', `${Math.min(index % 5, 4) * 70}ms`);
    if (reduced || !('IntersectionObserver' in window)) {
      element.classList.add('motion-in');
      return;
    }
    observer.observe(element);
  };

  const observer = reduced || !('IntersectionObserver' in window) ? null : new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  const scan = (scope = document) => {
    if (scope.matches && scope.matches(targets)) reveal(scope);
    scope.querySelectorAll?.(targets).forEach(reveal);
  };

  const start = () => {
    scan();
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) scan(node);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  // ---------- Button tap glow + ripple ----------
  // Event delegation, so it also covers .btn elements rendered later by JS.
  // pointerdown fires instantly on touch, so the glow starts the moment the
  // finger lands (the CSS burst then plays to completion even on a quick tap).
  const TAP_CLASS = 'is-tapped';

  const glowButton = (btn, x, y) => {
    if (!btn || btn.disabled) return;

    // Restart the burst animation if the button is tapped again quickly
    btn.classList.remove(TAP_CLASS);
    void btn.offsetWidth;
    btn.classList.add(TAP_CLASS);
    clearTimeout(btn._tapTimer);
    btn._tapTimer = setTimeout(() => btn.classList.remove(TAP_CLASS), 700);

    if (reduced) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const cx = x == null ? rect.width / 2 : x - rect.left;
    const cy = y == null ? rect.height / 2 : y - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (cx - size / 2) + 'px';
    ripple.style.top = (cy - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  };

  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest && e.target.closest('.btn');
    if (btn) glowButton(btn, e.clientX, e.clientY);
  }, { passive: true });

  // Keyboard activation (Enter / Space) has no pointerdown — detail === 0 marks it
  document.addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const btn = e.target.closest && e.target.closest('.btn');
    if (btn) glowButton(btn);
  });

  // iOS Safari only applies :active styles when a touch listener exists
  document.addEventListener('touchstart', () => {}, { passive: true });
})();
