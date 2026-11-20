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
//
// Dead image links: every admin-set photo (tile, category, about card) is checked first.
// Hosts like imgbb answer a deleted photo with an "image not found" placeholder, so a plain
// background-image would show that placeholder. A dead link is skipped and the tile falls
// back to a working product photo from the same category (or is hidden if there is none).
import { db, isFirebaseConfigured } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const ABOUT_KEY = 'velmora_about_cache';
const CATS_KEY = 'velmora_categories_cache';
const DIY_KEY = 'velmora_diysection_cache';
const TILEGRID_KEY = 'velmora_tilegrid_cache';
const TILEMODE_KEY = 'velmora_tilemode_cache';

let tileModeSetting = 'auto';
let tileGridData = [];

/* ---------- Dead-image check ---------- */
const imageChecks = {};
function imageWorks(url) {
  if (imageChecks[url]) return imageChecks[url];
  imageChecks[url] = new Promise(function (resolve) {
    function viaImage() {
      const im = new Image();
      im.onload = function () { resolve(im.naturalWidth > 0); };
      im.onerror = function () { resolve(false); };
      im.src = url;
    }
    if (!window.fetch) return viaImage();
    fetch(url, { mode: 'cors', cache: 'force-cache' }).then(function (r) {
      const type = r.headers.get('content-type') || '';
      resolve(r.ok && (!type || type.indexOf('image') === 0 || type.indexOf('octet') > -1));
    }).catch(viaImage); // CORS blocked or offline: fall back to a normal image load
  });
  return imageChecks[url];
}
// Resolves to the first URL in the list that works, or null.
function firstWorking(urls) {
  return urls.reduce(function (chain, url) {
    return chain.then(function (found) {
      if (found) return found;
      return imageWorks(url).then(function (ok) { return ok ? url : null; });
    });
  }, Promise.resolve(null));
}

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
      // Only replace the default product photo when the admin's photo really loads.
      imageWorks(String(c.image)).then(function (ok) {
        if (!ok) return;
        img.removeAttribute('data-jr-photo');
        img.removeAttribute('data-category');
        img.style.display = '';
        img.style.setProperty('--photo-bg', 'url("' + String(c.image).replace(/"/g, '%22') + '")');
      });
    }
  });
}

/* ---------- Shared helpers ---------- */
function photoOf(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  return p.image || null;
}
// All image URLs a product has, in order (gallery first, then the single image).
function photosOf(p) {
  let list = [];
  if (Array.isArray(p.images)) list = list.concat(p.images);
  if (p.image) list.push(p.image);
  return list.filter(function (u) { return typeof u === 'string' && u; });
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
    if (c.image) {
      // Set the admin's photo only if it really loads; otherwise the product-photo fallback applies.
      const url = String(c.image);
      imageWorks(url).then(function (ok) {
        if (ok) img.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
      });
    }

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
// A manual tile with no photo (or a dead photo link) falls back to a working product photo
// from the tile's category. A tile whose photo link is dead and that has no product photo
// to fall back on is hidden, so the "image not found" placeholder is never shown.
function fillManualPhotos(products) {
  if (!Array.isArray(products)) return;
  document.querySelectorAll('[data-manual-tile] .jr-tile-img[data-auto-photo]').forEach(function (img) {
    if (img.style.getPropertyValue('--photo-bg')) return;
    const tile = img.closest('.jr-tile');
    const urls = [];
    products.forEach(function (p) {
      if ((!img.dataset.autoCategory || p.category === img.dataset.autoCategory) &&
          (!img.dataset.autoGender || p.gender === img.dataset.autoGender)) {
        photosOf(p).forEach(function (u) { if (urls.indexOf(u) < 0) urls.push(u); });
      }
    });
    firstWorking(urls.slice(0, 10)).then(function (url) {
      if (img.style.getPropertyValue('--photo-bg')) return;
      if (url) {
        img.style.setProperty('--photo-bg', "url('" + String(url).replace(/'/g, '%27') + "')");
        if (tile) tile.style.display = '';
      } else if (img.hasAttribute('data-dead') && tile) {
        tile.style.display = 'none';
      }
      refreshSectionVisibility();
    });
  });
}

function runManualFill() {
  try { fillManualPhotos(JSON.parse(localStorage.getItem('velmora_products_cache'))); } catch (e) {}
  if (window.velmoraProductsReady) window.velmoraProductsReady.then(fillManualPhotos).catch(function () {});
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
        // Show the admin's photo only if the link really serves an image.
        const url = String(t.image);
        imageWorks(url).then(function (ok) {
          if (ok) {
            img.style.setProperty('--photo-bg', "url('" + url.replace(/'/g, '%27') + "')");
            tile.style.display = '';
            refreshSectionVisibility();
            return;
          }
          // Dead link (e.g. a deleted imgbb photo): use a product photo from the tile's category.
          img.setAttribute('data-dead', '');
          if (t.category) {
            img.setAttribute('data-auto-photo', '');
            img.dataset.autoCategory = t.category;
            if (t.gender === 'Women' || t.gender === 'Men') img.dataset.autoGender = t.gender;
            runManualFill();
          } else {
            tile.style.display = 'none';
            refreshSectionVisibility();
          }
        });
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
  runManualFill();
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
