// Homepage content that the admin edits in the dashboard (Firestore settings/site):
//  - aboutCards: the three "About Velmora" cards  { title, text, image } x3
//  - customCategories: extra categories added in Dashboard -> Categories
//    { name, gender: 'Women' | 'Men', image }  -> shown as tiles under For Women / For Man
// Anything left empty keeps the default already written in index.html.
import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ABOUT_KEY = 'velmora_about_cache';
const CATS_KEY = 'velmora_categories_cache';

/* ---------- About cards ---------- */
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

/* ---------- Custom category tiles ---------- */
function photoOf(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  return p.image || null;
}

// A tile shows only when a product with a photo is in that category (same rule as the
// built-in tiles). Also keeps each For Women / For Man section's visibility correct.
function refreshCustomTiles(products) {
  if (!Array.isArray(products)) return;
  document.querySelectorAll('[data-custom-tile]').forEach(function (tile) {
    const img = tile.querySelector('.jr-tile-img');
    const match = products.find(function (p) {
      return photoOf(p) && p.category === img.dataset.category && p.gender === img.dataset.gender;
    });
    if (match && !img.style.backgroundImage) {
      img.style.setProperty('--photo-bg', "url('" + photoOf(match).replace(/'/g, '%27') + "')");
    }
    tile.style.display = match ? '' : 'none';
  });
  document.querySelectorAll('.jr-tiles').forEach(function (grid) {
    const section = grid.closest('section');
    if (!section) return;
    const anyVisible = Array.prototype.some.call(grid.querySelectorAll('.jr-tile'), function (t) {
      return t.style.display !== 'none';
    });
    section.style.display = anyVisible ? '' : 'none';
  });
}

function applyCustomCategories(cats) {
  if (!Array.isArray(cats)) return;
  document.querySelectorAll('[data-custom-tile]').forEach(function (t) { t.remove(); });
  const grids = {};
  document.querySelectorAll('.jr-tiles').forEach(function (g) {
    const first = g.querySelector('[data-gender]');
    if (first) grids[first.dataset.gender] = g;
  });
  cats.forEach(function (c) {
    const grid = grids[c.gender];
    if (!grid || !c.name) return;
    const tile = document.createElement('a');
    tile.className = 'jr-tile';
    tile.setAttribute('data-custom-tile', '');
    tile.href = 'shop.html?gender=' + encodeURIComponent(c.gender) + '&category=' + encodeURIComponent(c.name);
    const img = document.createElement('div');
    img.className = 'jr-tile-img';
    img.setAttribute('data-jr-photo', '');
    img.dataset.gender = c.gender;
    img.dataset.category = c.name;
    if (c.image) img.style.backgroundImage = 'url("' + String(c.image).replace(/"/g, '%22') + '")';
    const label = document.createElement('div');
    label.className = 'jr-tile-label';
    label.textContent = c.name;
    tile.appendChild(img);
    tile.appendChild(label);
    grid.appendChild(tile);
  });
  try { refreshCustomTiles(JSON.parse(localStorage.getItem('velmora_products_cache'))); } catch (e) { /* no cache */ }
  if (window.velmoraProductsReady) window.velmoraProductsReady.then(refreshCustomTiles).catch(function () {});
}

/* ---------- Load: cached copy first, then fresh from Firestore ---------- */
try { applyAboutCards(JSON.parse(localStorage.getItem(ABOUT_KEY))); } catch (e) { /* no cache yet */ }
try { applyCustomCategories(JSON.parse(localStorage.getItem(CATS_KEY))); } catch (e) { /* no cache yet */ }

(async function () {
  if (!isFirebaseConfigured) return;
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (!snap.exists()) return;
    const data = snap.data();
    if (Array.isArray(data.aboutCards)) {
      applyAboutCards(data.aboutCards);
      try { localStorage.setItem(ABOUT_KEY, JSON.stringify(data.aboutCards)); } catch (e) { /* storage unavailable */ }
    }
    if (Array.isArray(data.customCategories)) {
      applyCustomCategories(data.customCategories);
      try { localStorage.setItem(CATS_KEY, JSON.stringify(data.customCategories)); } catch (e) { /* storage unavailable */ }
    }
  } catch (err) {
    console.error('Could not load homepage settings:', err);
  }
})();
