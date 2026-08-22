// Nav search — toggles a search bar under the header on every page.
// On shop.html it filters the grid in place; elsewhere it redirects
// to shop.html?search=... where the same filtering applies.
document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.querySelector('.search-toggle');
  const bar = document.getElementById('search-bar');
  const input = document.getElementById('search-input');
  if (!toggleBtn || !bar || !input) return;

  toggleBtn.addEventListener('click', () => {
    bar.classList.toggle('is-open');
    if (bar.classList.contains('is-open')) input.focus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const value = input.value.trim();
    if (typeof window.applyVelmoraSearch === 'function') {
      window.applyVelmoraSearch(value);
      bar.classList.remove('is-open');
    } else {
      window.location.href = 'shop.html?search=' + encodeURIComponent(value);
    }
  });
});
