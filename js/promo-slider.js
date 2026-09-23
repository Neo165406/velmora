// Promo slider ("explore our new products" banner) — slide/push transition
// with progress-bar autoplay. Exposed as window.initPromoSlider() so it can
// be called again after slides are dynamically loaded from Firestore
// (see loadPromoSlides() at the bottom of this file).
const PROMO_SCRIPT_SRC = document.currentScript ? document.currentScript.src : '/js/promo-slider.js';

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

// ---------------------------------------------------------------
// Hero banner photos: the slides (photo, headline, link) an admin
// saves under Dashboard → Slides live in the Firestore `slides`
// collection. This swaps them in for the plain gradient placeholder
// slides in index.html, then restarts the slider.
// ---------------------------------------------------------------
function promoEsc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadPromoSlides() {
  const wrap = document.querySelector('.promo-slider');
  if (!wrap) return;
  try {
    const { db, isFirebaseConfigured } = await import(new URL('firebase-config.js', PROMO_SCRIPT_SRC).href);
    if (!isFirebaseConfigured) return;
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

    const snapshot = await getDocs(collection(db, 'slides'));
    if (snapshot.empty) return;
    const slides = snapshot.docs
      .map(d => d.data())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const slideHtml = slides.map((s, i) => `
      <div class="promo-slide p-${String.fromCharCode(97 + (i % 3))} ${i === 0 ? 'is-active' : ''}">
        <div>
          <div class="eyebrow">${promoEsc(s.eyebrow)}</div>
          <h3>${promoEsc(s.title)}</h3>
          ${s.price ? `<div class="price">৳${Number(s.price).toLocaleString('en-IN')}${s.oldPrice ? `<span class="old">৳${Number(s.oldPrice).toLocaleString('en-IN')}</span>` : ''}</div>` : ''}
          <a href="${promoEsc(s.link || 'shop.html')}" class="btn btn-solid" style="margin-top:14px; display:inline-block;">Shop Now</a>
        </div>
      </div>`).join('');
    const barsHtml = slides.map(() => `<div class="promo-progress-bar"><span class="fill"></span></div>`).join('');
    wrap.innerHTML = slideHtml + `<div class="promo-progress-track">${barsHtml}</div>`;

    // Put each slide's photo behind its text, with a light dark fade at the
    // bottom-left so the white headline stays readable on any picture.
    wrap.querySelectorAll('.promo-slide').forEach((el, i) => {
      const img = slides[i].image;
      if (!img) return;
      el.style.backgroundImage =
        'linear-gradient(15deg, rgba(12,12,12,0.7) 0%, rgba(12,12,12,0.15) 60%, rgba(12,12,12,0) 100%), url("' + String(img).replace(/"/g, '%22') + '")';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    });

    initPromoSlider();
  } catch (err) {
    console.error('Could not load slides:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadPromoSlides);
} else {
  loadPromoSlides();
}
