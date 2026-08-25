// Promo slider ("explore our new products" banner) — slide/push transition
// with progress-bar autoplay. Exposed as window.initPromoSlider() so it can
// be called again after slides are dynamically loaded from Firestore
// (see index.html).
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

  // Snap every slide into its starting position with no animation:
  // the current one centered, everything else waiting off-screen right.
  function resetPositions() {
    slides.forEach((slide, i) => {
      slide.style.transition = 'none';
      slide.classList.remove('is-active');
      slide.style.transform = i === current ? 'translateX(0)' : 'translateX(100%)';
    });
    void slides[0].offsetWidth;
    slides.forEach(slide => { slide.style.transition = ''; });
  }

  function goTo(index) {
    const prevSlide = slides[current];
    current = (index + slides.length) % slides.length;
    const nextSlide = slides[current];

    // Outgoing slide pushes out to the left.
    prevSlide.style.transform = 'translateX(-100%)';
    prevSlide.classList.remove('is-active');

    // Incoming slide starts parked off-screen right, then slides to center.
    nextSlide.style.transition = 'none';
    nextSlide.style.transform = 'translateX(100%)';
    void nextSlide.offsetWidth;
    nextSlide.style.transition = '';
    nextSlide.style.transform = 'translateX(0)';
    nextSlide.classList.add('is-active');

    setBars(current);
  }

  function next() { goTo(current + 1); }

  resetPositions();
  setBars(current);
  window.__promoSliderTimer = setInterval(next, 4500);
}

window.initPromoSlider = initPromoSlider;
document.addEventListener('DOMContentLoaded', initPromoSlider);
window.initPromoSlider = initPromoSlider;
document.addEventListener('DOMContentLoaded', initPromoSlider);
