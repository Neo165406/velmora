// ---------------------------------------------------------------
// Velmora product data (restored + Buy Now on every product card)
// ---------------------------------------------------------------
import { db, isFirebaseConfigured } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let VELMORA_PRODUCTS = [
  { id: 'rng-001', name: 'Antique Gold Kundan Ring', category: 'Rings', gender: 'Women', price: 4200, oldPrice: 5200, tag: 'New' },
  { id: 'nck-001', name: 'Maroon Stone Bridal Necklace', category: 'Necklaces', gender: 'Women', price: 12500, oldPrice: null, tag: 'Bestseller' },
  { id: 'ear-001', name: 'Pearl Drop Chandbali Earrings', category: 'Earrings', gender: 'Women', price: 3100, oldPrice: 3800, tag: null },
  { id: 'brc-001', name: 'Layered Gold Cuff Bracelet', category: 'Bracelets', gender: 'Women', price: 5400, oldPrice: null, tag: null },
  { id: 'nck-002', name: 'Antique Temple Choker', category: 'Necklaces', gender: 'Women', price: 9800, oldPrice: 11000, tag: 'New' },
  { id: 'rng-002', name: 'Rose Gold Solitaire Ring', category: 'Rings', gender: 'Women', price: 6600, oldPrice: null, tag: null },
  { id: 'ear-002', name: 'Kundan Jhumka Earrings', category: 'Earrings', gender: 'Women', price: 2800, oldPrice: null, tag: 'Bestseller' },
  { id: 'brc-002', name: 'Ruby Studded Bangle Set', category: 'Bracelets', gender: 'Women', price: 8200, oldPrice: 9500, tag: null },
  { id: 'pnd-001', name: 'Floral Gold Pendant', category: 'Pendant', gender: 'Women', price: 3900, oldPrice: null, tag: 'New' },
  { id: 'oth-001', name: 'Pearl Hair Accessory Set', category: 'Others', gender: 'Women', price: 950, oldPrice: null, tag: null },
  { id: 'rng-003', name: "Men's Gold Signet Ring", category: 'Rings', gender: 'Men', price: 5800, oldPrice: null, tag: 'New' },
  { id: 'brc-003', name: "Men's Silver Chain Bracelet", category: 'Bracelets', gender: 'Men', price: 3400, oldPrice: null, tag: null },
  { id: 'gls-001', name: "Men's Classic Sunglasses", category: 'Glasses', gender: 'Men', price: 2200, oldPrice: null, tag: null },
  { id: 'acc-001', name: "Men's Leather Wallet", category: 'Other Accessories', gender: 'Men', price: 1800, oldPrice: null, tag: null },
  { id: 'brc-004', name: 'Minimal Gold Bangle', category: 'Bracelets', gender: 'Unisex', price: 4600, oldPrice: null, tag: null },
  { id: 'rng-004', name: 'Plain Band Couple Ring', category: 'Rings', gender: 'Unisex', price: 3200, oldPrice: null, tag: 'Bestseller' },
  { id: 'cmb-001', name: 'Rings & Earrings Duo Set', category: 'Combo Deals', gender: 'Women', price: 6800, oldPrice: 8600, tag: 'Combo' },
  { id: 'cmb-002', name: 'Necklace + Bracelet Bundle', category: 'Combo Deals', gender: 'Women', price: 11200, oldPrice: 14000, tag: 'Combo' },
  { id: 'gft-001', name: 'Gold-Wrapped Rose Bouquet', category: 'Flower', gender: 'Unisex', price: 1200, oldPrice: null, tag: 'Gift' },
  { id: 'gft-002', name: 'Belgian Chocolate Box', category: 'Chocolate', gender: 'Unisex', price: 950, oldPrice: null, tag: 'Gift' },
  { id: 'gft-003', name: 'Make-Your-Own Bracelet Kit', category: 'DIY', gender: 'Unisex', price: 1600, oldPrice: null, tag: 'Gift' },
];

function velmoraGemIcon() {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 22L32 6L56 22L32 58L8 22Z" stroke="#161616" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 22H56M20 22L32 6M44 22L32 6M20 22L32 58M44 22L32 58" stroke="#161616" stroke-width="1" opacity="0.6"/>
  </svg>`;
}

function formatTaka(amount) {
  return '৳' + amount.toLocaleString('en-IN');
}

const PRODUCTS_CACHE_KEY = 'velmora_products_cache';

function loadCachedProducts() {
  try {
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length) {
        VELMORA_PRODUCTS = parsed;
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function saveCachedProducts() {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(VELMORA_PRODUCTS));
  } catch (e) {}
}

async function loadProducts() {
  if (!isFirebaseConfigured) return;
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (!snapshot.empty) {
      VELMORA_PRODUCTS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      saveCachedProducts();
    }
  } catch (err) {
    console.error('Could not load live products, showing demo data instead:', err);
  }
}

function primaryImage(p) {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  if (p.image) return p.image;
  return null;
}

function productMedia(p) {
  const img = primaryImage(p);
  return img
    ? `<img src="${img}" alt="${p.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">`
    : velmoraGemIcon();
}

function isOutOfStock(p) {
  return p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0;
}

function discountInfo(p) {
  const oldPrice = Number(p.oldPrice);
  const price = Number(p.price);
  if (!oldPrice || oldPrice <= price) return null;
  const save = oldPrice - price;
  const percent = Math.round((save / oldPrice) * 100);
  return { save, percent };
}

function renderProductCard(p) {
  const outOfStock = isOutOfStock(p);
  const discount = discountInfo(p);
  return `
    <div class="product-card">
      <a href="product.html?id=${p.id}">
        <div class="product-media">
          ${outOfStock ? `<span class="product-tag" style="left:auto; right:12px; background:#a15a5a; color:#fff;">Out of Stock</span>` : (p.tag ? `<span class="product-tag">${p.tag}</span>` : '')}
          ${productMedia(p)}
          ${outOfStock ? `<div class="oos-overlay"></div>` : ''}
        </div>
        <div class="product-info">
          <div class="cat">${p.category}</div>
          <h3>${p.name}</h3>
          <div class="price">${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}</div>
          ${discount ? `<div class="save-badge">Save ${formatTaka(discount.save)} (${discount.percent}% off)</div>` : ''}
          ${(p.stock !== undefined && p.stock !== null && !outOfStock) ? `<div class="stock-note">${p.stock} in stock</div>` : ''}
        </div>
      </a>
      <div class="product-card-actions">
        <a href="product.html?id=${p.id}" class="buy-now-btn" ${outOfStock ? 'aria-disabled="true" tabindex="-1"' : ''}>Buy Now</a>
        <button class="quick-add-btn" data-add-to-cart="${p.id}" aria-label="Add to cart" ${outOfStock ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        </button>
      </div>
    </div>`;
}

function wireAddToCartButtons(scope) {
  scope.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = VELMORA_PRODUCTS.find(item => item.id === btn.dataset.addToCart);
      if (!p) return;
      addToCart(p, 1);
      btn.classList.add('is-added');
      if (btn.classList.contains('add-cart-btn')) {
        btn.textContent = 'Added ✓';
      }
      setTimeout(() => {
        if (btn.classList.contains('add-cart-btn')) btn.textContent = 'Add to Cart';
        btn.classList.remove('is-added');
      }, 1200);
    });
  });
}

const filterState = { category: 'All', gender: 'All', search: '', tag: 'All', price: 'All' };

const PRICE_FILTER_LABELS = {
  '0-500': 'Under ৳500',
  '500-1000': '৳500–1,000',
  '1000-3000': '৳1,000–3,000',
  '3000-999999': '৳3,000+'
};

function applyFilters() {
  return VELMORA_PRODUCTS.filter(p => {
    const matchCategory = filterState.category === 'All' || filterState.category.split(',').includes(p.category);
    const matchGender = filterState.gender === 'All' || p.gender === filterState.gender;
    const matchSearch = !filterState.search || p.name.toLowerCase().includes(filterState.search.toLowerCase());
    const matchTag = filterState.tag === 'All' || (p.tag || '').toLowerCase() === filterState.tag.toLowerCase();
    let matchPrice = true;
    if (filterState.price !== 'All') {
      const [min, max] = filterState.price.split('-').map(Number);
      matchPrice = Number(p.price) >= min && Number(p.price) <= max;
    }
    return matchCategory && matchGender && matchSearch && matchTag && matchPrice;
  });
}

function renderProductGrid() {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;
  const items = applyFilters();
  grid.innerHTML = items.length
    ? items.map(renderProductCard).join('')
    : `<p style="grid-column:1/-1; text-align:center; color:#6b4a4e; padding:40px 0;">No products found.</p>`;
  wireAddToCartButtons(grid);
  updateFilterSummary();
}

function updateFilterSummary() {
  const label = document.getElementById('filterActiveLabel');
  const countBadge = document.getElementById('filterActiveCount');
  if (!label && !countBadge) return;
  const parts = [];
  if (filterState.category !== 'All') parts.push(filterState.category);
  if (filterState.gender !== 'All') parts.push(filterState.gender);
  if (filterState.price !== 'All') parts.push(PRICE_FILTER_LABELS[filterState.price] || 'Custom price');
  if (label) label.textContent = parts.length ? parts.join(' · ') : 'All Products';
  if (countBadge) {
    countBadge.textContent = parts.length;
    countBadge.style.display = parts.length ? 'inline-flex' : 'none';
  }
}

const PRICE_SLIDER_MAX = 20000;

function updatePriceSliderVisual() {
  const minRange = document.getElementById('priceRangeMin');
  const maxRange = document.getElementById('priceRangeMax');
  const rangeFill = document.getElementById('priceSliderRange');
  const minLabel = document.getElementById('priceSliderMinLabel');
  const maxLabel = document.getElementById('priceSliderMaxLabel');
  if (!minRange || !maxRange) return;
  let minVal = Number(minRange.value);
  let maxVal = Number(maxRange.value);
  if (minVal > maxVal) { minVal = maxVal; minRange.value = minVal; }
  const minPct = (minVal / PRICE_SLIDER_MAX) * 100;
  const maxPct = (maxVal / PRICE_SLIDER_MAX) * 100;
  if (rangeFill) { rangeFill.style.left = minPct + '%'; rangeFill.style.right = (100 - maxPct) + '%'; }
  if (minLabel) minLabel.textContent = '৳' + minVal.toLocaleString('en-IN');
  if (maxLabel) maxLabel.textContent = maxVal >= PRICE_SLIDER_MAX ? '৳' + PRICE_SLIDER_MAX.toLocaleString('en-IN') + '+' : '৳' + maxVal.toLocaleString('en-IN');
}

function resetPriceSlider() {
  const minRange = document.getElementById('priceRangeMin');
  const maxRange = document.getElementById('priceRangeMax');
  if (minRange) minRange.value = 0;
  if (maxRange) maxRange.value = PRICE_SLIDER_MAX;
  updatePriceSliderVisual();
}

function setupPriceSlider() {
  const minRange = document.getElementById('priceRangeMin');
  const maxRange = document.getElementById('priceRangeMax');
  if (!minRange || !maxRange) return;
  function applySliderFilter() {
    const minVal = Number(minRange.value);
    const maxRaw = Number(maxRange.value);
    const maxVal = maxRaw >= PRICE_SLIDER_MAX ? 999999 : maxRaw;
    filterState.price = minVal + '-' + maxVal;
    PRICE_FILTER_LABELS[filterState.price] = '৳' + minVal.toLocaleString('en-IN') + ' – ' + (maxVal >= 999999 ? '৳' + PRICE_SLIDER_MAX.toLocaleString('en-IN') + '+' : '৳' + maxVal.toLocaleString('en-IN'));
    document.querySelectorAll('[data-price-filter]').forEach(c => c.classList.remove('active'));
    renderProductGrid();
  }
  minRange.addEventListener('input', updatePriceSliderVisual);
  maxRange.addEventListener('input', updatePriceSliderVisual);
  minRange.addEventListener('change', applySliderFilter);
  maxRange.addEventListener('change', applySliderFilter);
  updatePriceSliderVisual();
}

function setupFilters() {
  document.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.category = chip.dataset.filter;
      renderProductGrid();
    });
  });
  document.querySelectorAll('[data-gender-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-gender-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.gender = chip.dataset.genderFilter;
      renderProductGrid();
    });
  });
  document.querySelectorAll('[data-price-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-price-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.price = chip.dataset.priceFilter;
      resetPriceSlider();
      renderProductGrid();
    });
  });
  setupPriceSlider();
}

function setupFilterDrawer() {
  const drawer = document.getElementById('filterDrawer');
  const overlay = document.getElementById('filterDrawerOverlay');
  const toggle = document.getElementById('filterDrawerToggle');
  if (!drawer || !overlay || !toggle) return;
  const closeBtn = document.getElementById('filterDrawerClose');
  const applyBtn = document.getElementById('filterApplyBtn');
  const clearBtn = document.getElementById('filterClearBtn');
  function openDrawer() { drawer.classList.add('is-open'); overlay.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); document.body.style.overflow = ''; }
  toggle.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (applyBtn) applyBtn.addEventListener('click', closeDrawer);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterState.category = 'All'; filterState.gender = 'All'; filterState.price = 'All';
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.toggle('active', c.dataset.filter === 'All'));
      document.querySelectorAll('[data-gender-filter]').forEach(c => c.classList.toggle('active', c.dataset.genderFilter === 'All'));
      document.querySelectorAll('[data-price-filter]').forEach(c => c.classList.toggle('active', c.dataset.priceFilter === 'All'));
      resetPriceSlider();
      renderProductGrid();
    });
  }
}

function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const gender = params.get('gender');
  const search = params.get('search');
  const tag = params.get('tag');
  if (category) {
    filterState.category = category;
    document.querySelectorAll('[data-filter]').forEach(c => c.classList.toggle('active', c.dataset.filter === category));
  }
  if (gender) {
    filterState.gender = gender;
    document.querySelectorAll('[data-gender-filter]').forEach(c => c.classList.toggle('active', c.dataset.genderFilter === gender));
  }
  if (tag) filterState.tag = tag;
  if (search) {
    filterState.search = search;
    const input = document.getElementById('search-input');
    if (input) input.value = search;
  }
}

window.applyVelmoraSearch = function (value) {
  filterState.search = value;
  renderProductGrid();
};

function renderFeatured() {
  const grid = document.querySelector('[data-featured-grid]');
  if (!grid) return;
  const featured = VELMORA_PRODUCTS.filter(p => p.featured);
  const items = (featured.length ? featured : VELMORA_PRODUCTS).slice(0, 4);
  grid.innerHTML = items.map(renderProductCard).join('');
  wireAddToCartButtons(grid);
}

function renderComboDeals() {
  const grid = document.querySelector('[data-combo-grid]');
  if (!grid) return;
  const items = VELMORA_PRODUCTS.filter(p => p.category === 'Combo Deals');
  const section = grid.closest('section');
  if (!items.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = '';
  grid.innerHTML = items.map(renderProductCard).join('');
  wireAddToCartButtons(grid);
}

function curatedForSection(key, fallbackPredicate, limit = 8) {
  const manual = VELMORA_PRODUCTS.filter(p => Array.isArray(p.homeSections) && p.homeSections.includes(key));
  const pool = manual.length ? manual : VELMORA_PRODUCTS.filter(fallbackPredicate);
  return pool.slice(0, limit);
}

function renderSection(selector, items) {
  const grid = document.querySelector(selector);
  if (!grid) return;
  const section = grid.closest('section');
  if (!items.length) { if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = '';
  grid.innerHTML = items.map(renderProductCard).join('');
  wireAddToCartButtons(grid);
}

function renderNewArrivals() {
  renderSection('[data-newarrivals-grid]', curatedForSection('newArrivals', p => (p.tag || '').toLowerCase() === 'new'));
}

function renderForWomen() {
  renderSection('[data-forwomen-grid]', curatedForSection('forWomen', p => p.gender === 'Women'));
}

function renderForMan() {
  renderSection('[data-forman-grid]', curatedForSection('forMan', p => p.gender === 'Men'));
}

function renderGiftBox() {
  renderSection('[data-giftbox-grid]', curatedForSection('giftBox', p => ['Gift Box', 'Flower', 'Chocolate', 'Books'].includes(p.category)));
}

function renderProductDetail() {
  const mount = document.querySelector('[data-product-detail]');
  if (!mount) return;
  const id = new URLSearchParams(window.location.search).get('id');
  const p = VELMORA_PRODUCTS.find(item => item.id === id);
  if (!p) {
    mount.innerHTML = '<p style="text-align:center;padding:40px;">Product not found. <a href="shop.html">Back to shop</a></p>';
    return;
  }
  const outOfStock = isOutOfStock(p);
  const discount = discountInfo(p);
  const imgs = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
  mount.innerHTML = `
    <div class="pd-layout">
      <div class="pd-media" id="pd-main-media">${imgs.length ? `<img src="${imgs[0]}" alt="${p.name}">` : velmoraGemIcon()}</div>
      <div class="pd-info">
        <div class="cat">${p.category}</div>
        <h1>${p.name}</h1>
        <div class="price">${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}</div>
        ${discount ? `<div class="save-badge">Save ${formatTaka(discount.save)} (${discount.percent}% off)</div>` : ''}
        ${p.description ? `<p class="pd-desc">${p.description}</p>` : ''}
        <div class="pd-actions">
          <div class="qty-wrap">
            <button type="button" data-qty-minus>−</button>
            <input type="number" value="1" min="1" data-qty-input>
            <button type="button" data-qty-plus>+</button>
          </div>
          <button class="btn btn-solid add-cart-btn" data-add-to-cart="${p.id}" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
        </div>
      </div>
    </div>`;
  const qtyInput = mount.querySelector('[data-qty-input]');
  mount.querySelector('[data-qty-minus]').addEventListener('click', () => { qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1); });
  mount.querySelector('[data-qty-plus]').addEventListener('click', () => { qtyInput.value = parseInt(qtyInput.value) + 1; });
  mount.querySelector('[data-add-to-cart]').addEventListener('click', function () {
    addToCart(p, parseInt(qtyInput.value));
    this.textContent = 'Added ✓';
    this.classList.add('is-added');
    setTimeout(() => { this.textContent = 'Add to Cart'; this.classList.remove('is-added'); }, 1200);
  });
}

const hasCachedProducts = loadCachedProducts();
const productsReadyPromise = loadProducts().then(() => VELMORA_PRODUCTS);
window.velmoraProductsReady = productsReadyPromise;

function loadCategoryPhotos() {
  const products = VELMORA_PRODUCTS || [];
  if (!products.length) return;
  document.querySelectorAll('[data-category]').forEach(card => {
    const cat = card.dataset.category;
    const hasImg = p => p.category === cat && ((p.images && p.images[0]) || p.image);
    const match = products.find(p => hasImg(p) && p.featured) || products.find(hasImg);
    if (!match) return;
    const img = (match.images && match.images[0]) || match.image;
    if (img) card.style.setProperty('--card-bg', "url('" + img + "')");
  });
}

function renderAll() {
  applyUrlFilters();
  renderProductGrid();
  renderFeatured();
  renderComboDeals();
  renderNewArrivals();
  renderForWomen();
  renderForMan();
  renderGiftBox();
  renderProductDetail();
  loadCategoryPhotos();
}

document.addEventListener('DOMContentLoaded', async function () {
  setupFilters();
  setupFilterDrawer();
  if (hasCachedProducts) renderAll();
  await productsReadyPromise;
  renderAll();
});
