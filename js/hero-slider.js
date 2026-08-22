// Hero slider — crossfade autoplay with dot navigation (StrDust-style)
document.addEventListener('DOMContentLoaded', function () {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current] && dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current] && dots[current].classList.add('is-active');
  }

  function next() { goTo(current + 1); }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay();
    });
  });

  startAutoplay();
});
