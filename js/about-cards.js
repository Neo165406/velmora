// Homepage content that the admin edits in the dashboard (Firestore settings/site):
//  - aboutCards: the three "About Velmora" cards { title, text, image } x3
//  - customCategories: extra categories added in Dashboard -> Categories
//    { name, gender: 'Women' | 'Men', image } -> shown as tiles under For Women / For Man.
//    Category tiles stay visible even before products have been added.
//  - diySection: where the built-in "Style Your Own – DIY" tile shows:
//    'forWomen' (default) | 'forMan' | 'both' | 'hidden'
//  - tileGrid: fully manual tiles added in Dashboard -> Tile Grid
//    { title, image, category, gender, section: 'forWomen' | 'forMan' | 'both' }
//    Always visible with the admin's own title/photo — not tied to product data.
//    Array order = display order.
//  - tileMode: 'auto' (default) = built-in tiles + manual tiles;
//    'manual' = ONLY the Tile Grid tiles show (built-in and category tiles are hidden),
//    so the admin controls every title, photo, link and order.
//    Manual mode is ignored while the Tile Grid is empty, so the section can never go blank.
// Anything left empty keeps the default already written in index.html.
import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ABOUT_KEY = 'velmora_about_cache';
const CATS_KEY = 'velmora_categories_cache';
const DIY_KEY = 'velmora_diysection_cache';
const TILEGRID_KEY = 'velmora_tilegrid_cache';
const TILEMODE_KEY = 'velmora_tilemode_cache';

let tileModeSetting = 'auto';
let tileGridData = [];

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
      img.removeAttribute('data-jr-photo');
      img.removeAttribute('data-category');
      img.style.display = '';
      img.style.setProperty('--photo-bg', 'url("' + String(c.image).replace(/"/g, '%22') + '")');
    }
  });
}

/* ---------- Shared helpers ---------- */
function photoOf(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  return p.image || null;
}
function tileGrids() {
  const grids = {};
  document.querySelectorAll('.jr-tiles').forEach(function (g) {
    const first = g.querySelector('[data-gender]');
    if (first) grids[first.dataset.gender] = g;
  });
  return grids;
}
function refreshSectionVisibility() {
  document.querySelectorAll('.jr-tiles').forEach(function (grid) {
    const section = grid.closest('section');
    if (!section) return;
    const anyVisible = Array.prototype.some.call(grid.querySelectorAll('.jr-tile'), function (t) {
      return t.style.display !== 'none' && window.getComputedStyle(t).display !== 'none';
    });
    section.style.display = anyVisible ? '' : 'none';
  });
}

/* ---------- Tile mode (auto / manual) ---------- */
// Manual mode hides every tile that is not a Tile Grid tile (pure CSS, fully reversible).
function updateTileModeStyle() {
  let st = document.getElementById('tile-mode-style');
  const on = tileModeSetting === 'manual' && tileGridData.some(function (t) { return t && t.title; });
  if (on && !st) {
    st = document.createElement('style');
    st.id = 'tile-mode-style';
    st.textContent = '.jr-tiles .jr-tile:not([data-manual-tile]){display:none !important;}';
    document.head.appendChild(st);
  } else if (!on && st) {
    st.remove();
  }
  refreshSectionVisibility();
}

/* ---------- Custom category tiles ---------- */
// Admin-created categories remain visible even when there are no products yet.
// If a matching product photo exists, use it only when the admin did not set an image.
// DIY remains product-dependent, as before.
function refreshCustomTiles(products) {
  document.querySelectorAll('[data-custom-tile]').forEach(function (tile) {
    const img = tile.querySelector('.jr-tile-img');
    if (!img) return;
    const match = Array.isArray(products) ? products.find(function (p) {
      return photoOf(p) && p.category === img.dataset.category &&
        (!img.dataset.gender || p.gender === img.dataset.gender);
    }) : null;

    if (match && !img.style.backgroundImage && !img.style.getPropertyValue('--photo-bg')) {
      const photo = photoOf(match);
      img.style.setProperty('--photo-bg', "url('" + String(photo).replace(/'/g, '%27') + "')");
    }

    if (tile.hasAttribute('data-diy-tile')) {
      tile.style.display = match ? '' : 'none';
    } else {
      tile.style.display = '';
    }
  });
  refreshSectionVisibility();
}

function applyCustomCategories(cats) {
  if (!Array.isArray(cats)) return;
  document.querySelectorAll('[data-custom-tile]:not([data-diy-tile])').forEach(function (t) { t.remove(); });
  document.querySelectorAll('[data-all-categories-tile]').forEach(function (t) { t.remove(); });
  const grids = tileGrids();

  cats.forEach(function (c) {
    if (!c || !c.name) return;
    const grid = grids[c.gender];
    if (!grid) return;
    const tile = document.createElement('a');
    tile.className = 'jr-tile';
    tile.setAttribute('data-custom-tile', '');
    tile.href = 'shop.html?gender=' + encodeURIComponent(c.gender) + '&category=' + encodeURIComponent(c.name);

    const img = document.createElement('div');
    img.className = 'jr-tile-img';
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

  try { refreshCustomTiles(JSON.parse(localStorage.getItem('velmora_products_cache'))); } catch (e) { refreshCustomTiles(null); }
  if (window.velmoraProductsReady) window.velmoraProductsReady.then(refreshCustomTiles).catch(function () {});
}

/* ---------- "Style Your Own – DIY" tile ---------- */
function applyDiySection(section) {
  const value = ['forWomen', 'forMan', 'both', 'hidden'].indexOf(section) > -1 ? section : 'forWomen';
  document.querySelectorAll('[data-diy-tile]').forEach(function (t) { t.remove(); });
  if (value === 'hidden') return;
  const grids = tileGrids();
  const targets = value === 'both' ? ['Women', 'Men'] : [value === 'forMan' ? 'Men' : 'Women'];
  targets.forEach(function (genderKey) {
    const grid = grids[genderKey];
    if (!grid) return;
    const tile = document.createElement('a');
    tile.className = 'jr-tile';
    tile.setAttribute('data-diy-tile', '');
    tile.setAttribute('data-custom-tile', '');
    tile.href = 'shop.html?category=DIY';
    const img = document.createElement('div');
    img.className = 'jr-tile-img';
    img.dataset.category = 'DIY';
    const label = document.createElement('div');
    label.className = 'jr-tile-label';
    label.textContent = 'Style Your Own – DIY';
    tile.appendChild(img);
    tile.appendChild(label);
    grid.appendChild(tile);
  });
  try { refreshCustomTiles(JSON.parse(localStorage.getItem('velmora_products_cache'))); } catch (e) { refreshCustomTiles(null); }
  if (window.velmoraProductsReady) window.velmoraProductsReady.then(refreshCustomTiles).catch(function () {});
}

/* ---------- Fully manual tile grid (Dashboard -> Tile Grid) ---------- */
// A manual tile with no photo falls back to a matching product photo (never blank if one exists).
function fillManualPhotos(products) {
  if (!Array.isArray(products)) return;
  document.querySelectorAll('[data-manual-tile] .jr-tile-img[data-auto-photo]').forEach(function (img) {
    if (img.style.getPropertyValue('--photo-bg')) return;
    const match = products.find(function (p) {
      return photoOf(p) &&
        (!img.dataset.autoCategory || p.category === img.dataset.autoCategory) &&
        (!img.dataset.autoGender || p.gender === img.dataset.autoGender);
    });
    if (match) img.style.setProperty('--photo-bg', "url('" + String(photoOf(match)).replace(/'/g, '%27') + "')");
  });
}

function applyTileGrid(tiles) {
  if (!Array.isArray(tiles)) return;
  tileGridData = tiles;
  document.querySelectorAll('[data-manual-tile]').forEach(function (t) { t.remove(); });
  const grids = tileGrids();
  tiles.forEach(function (t) {
    if (!t || !t.title) return;
    const targets = t.section === 'both' ? ['Women', 'Men'] : [t.section === 'forMan' ? 'Men' : 'Women'];
    targets.forEach(function (genderKey) {
      const grid = grids[genderKey];
      if (!grid) return;
      const tile = document.createElement('a');
      tile.className = 'jr-tile';
      tile.setAttribute('data-manual-tile', '');
      const params = [];
      if (t.gender === 'Women' || t.gender === 'Men') params.push('gender=' + t.gender);
      if (t.category) params.push('category=' + encodeURIComponent(t.category));
      tile.href = 'shop.html' + (params.length ? '?' + params.join('&') : '');
      const img = document.createElement('div');
      img.className = 'jr-tile-img';
      if (t.image) {
        img.style.setProperty('--photo-bg', "url('" + String(t.image).replace(/'/g, '%27') + "')");
      } else if (t.category) {
        img.setAttribute('data-auto-photo', '');
        img.dataset.autoCategory = t.category;
        if (t.gender === 'Women' || t.gender === 'Men') img.dataset.autoGender = t.gender;
      }
      const label = document.createElement('div');
      label.className = 'jr-tile-label';
      label.textContent = t.title;
      tile.appendChild(img);
      tile.appendChild(label);
      grid.appendChild(tile);
    });
  });
  try { fillManualPhotos(JSON.parse(localStorage.getItem('velmora_products_cache'))); } catch (e) {}
  if (window.velmoraProductsReady) window.velmoraProductsReady.then(fillManualPhotos).catch(function () {});
  updateTileModeStyle();
}

/* ---------- Load: cached copy first, then fresh from Firestore ---------- */
try { tileModeSetting = localStorage.getItem(TILEMODE_KEY) || 'auto'; } catch (e) {}
try { applyAboutCards(JSON.parse(localStorage.getItem(ABOUT_KEY))); } catch (e) {}
try { applyCustomCategories(JSON.parse(localStorage.getItem(CATS_KEY))); } catch (e) {}
try { applyDiySection(localStorage.getItem(DIY_KEY) || 'forWomen'); } catch (e) { applyDiySection('forWomen'); }
try { applyTileGrid(JSON.parse(localStorage.getItem(TILEGRID_KEY))); } catch (e) {}

(async function () {
  if (!isFirebaseConfigured) return;
  try {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    if (!snap.exists()) return;
    const data = snap.data();
    if (Array.isArray(data.aboutCards)) {
      applyAboutCards(data.aboutCards);
      try { localStorage.setItem(ABOUT_KEY, JSON.stringify(data.aboutCards)); } catch (e) {}
    }
    if (Array.isArray(data.customCategories)) {
      applyCustomCategories(data.customCategories);
      try { localStorage.setItem(CATS_KEY, JSON.stringify(data.customCategories)); } catch (e) {}
    }
    if (typeof data.diySection === 'string') {
      applyDiySection(data.diySection);
      try { localStorage.setItem(DIY_KEY, data.diySection); } catch (e) {}
    }
    if (typeof data.tileMode === 'string') {
      tileModeSetting = data.tileMode;
      try { localStorage.setItem(TILEMODE_KEY, data.tileMode); } catch (e) {}
    }
    if (Array.isArray(data.tileGrid)) {
      applyTileGrid(data.tileGrid);
      try { localStorage.setItem(TILEGRID_KEY, JSON.stringify(data.tileGrid)); } catch (e) {}
    } else {
      updateTileModeStyle();
    }
  } catch (err) {
    console.error('Could not load homepage settings:', err);
  }
})();
