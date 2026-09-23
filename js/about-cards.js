// Homepage "About Velmora" cards (For Her / For Him / Gifts).
// Photo, title and text are edited in Dashboard -> About Cards and stored in
// Firestore at settings/site -> aboutCards (array of 3: { title, text, image }).
// Anything left empty keeps the default already written in index.html.
import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const CACHE_KEY = 'velmora_about_cache';

function applyAboutCards(cards) {
  if (!Array.isArray(cards)) return;
  document.querySelectorAll('[data-about-card]').forEach(function (card) {
    const c = cards[Number(card.dataset.aboutCard)];
    if (!c) return;
    const title = card.querySelector('[data-about-title]');
    const text = card.querySelector('[data-about-text]');
    const img = card.querySelector('[data-about-img]');
    if (title && c.title) title.textContent = c.title;
    if (text && c.text) text.textContent = c.text;
    if (img && c.image) {
      // Stop the automatic product-photo / category logic from touching this photo.
      img.removeAttribute('data-jr-photo');
      img.removeAttribute('data-category');
      img.style.display = '';
      img.style.setProperty('--photo-bg', 'url("' + String(c.image).replace(/"/g, '%22') + '")');
    }
  });
}

try { applyAboutCards(JSON.parse(localStorage.getItem(CACHE_KEY))); } catch (e) { /* no cache yet */ }

(async function () {
  if (!isFirebaseConfigured) return;
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    const cards = snap.exists() ? snap.data().aboutCards : null;
    if (!Array.isArray(cards)) return;
    applyAboutCards(cards);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cards)); } catch (e) { /* storage unavailable */ }
  } catch (err) {
    console.error('Could not load About cards:', err);
  }
})();
