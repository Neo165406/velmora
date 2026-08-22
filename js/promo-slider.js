// Promo slider ("explore our new products" banner) — progress-bar autoplay
document.addEventListener('DOMContentLoaded', function () {
  const slides = document.querySelectorAll('.promo-slide');
  const bars = document.querySelectorAll('.promo-progress-bar');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function setBars(index) {
    bars.forEach((bar, i) => {
      bar.classList.remove('active', 'done');
      const fill = bar.querySelector('.fill');
      fill.style.transition = 'none';
      fill.style.width = '0%';
      if (i < index) bar.classList.add('done');
    });
    // Force reflow so the "active" transition restarts cleanly
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

  function start() {
    setBars(current);
    clearInterval(timer);
    timer = setInterval(next, 4500);
  }

  start();
});
