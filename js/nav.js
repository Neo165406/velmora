// Shared hamburger navigation — include on every page
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  if (!hamburger || !navLinks) return;

  function closeNav() {
    hamburger.classList.remove('is-open');
    navLinks.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleNav() {
    const opening = !navLinks.classList.contains('is-open');
    hamburger.classList.toggle('is-open', opening);
    navLinks.classList.toggle('is-open', opening);
    if (overlay) overlay.classList.toggle('is-open', opening);
    document.body.style.overflow = opening ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleNav);
  if (overlay) overlay.addEventListener('click', closeNav);

  // "Shop" submenu toggle (mobile accordion) — separate from regular links
  navLinks.querySelectorAll('.sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const submenu = btn.parentElement.querySelector('.sub-menu');
      if (submenu) submenu.classList.toggle('is-open');
    });
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close on resize back to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) closeNav();
  });
});
