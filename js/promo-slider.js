// Promo slider ("explore our new products" banner) — progress-bar autoplay.
// Exposed as window.initPromoSlider() so it can be called again after
// slides are dynamically loaded from Firestore (see index.html).
function initPromoSlider() {
  const slides = document.querySelectorAll('.promo-slide');
  const bars = document.querySelectorAll('.promo-progress-bar');
  if (!slides.length) return;
  if (window.__promoSliderTimer) clearInterval(window.__promoSliderTimer);

  let current = 0;

  function setBars(index) {
    bars.forEach((bar, i) => {
      bar.classList.remove('active', 'done');
      const fill = bar.querySelector('.fill');
      fill.style.transition = 'none';
      fill.style.width = '0%';
      if (i < index) bar.classList.add('done');
    });
    void bars[index].offsetWidth;
    bars[index].classList.add('active');
  }

  function goTo(index) {
    slides[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    setBars(current);
  }

  function next() { goTo(current + 1); }

  setBars(current);
  window.__promoSliderTimer = setInterval(next, 4500);
}

window.initPromoSlider = initPromoSlider;
document.addEventListener('DOMContentLoaded', initPromoSlider);
