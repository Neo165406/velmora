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
})();
