// ---------------------------------------------------------------
// Velmora product data.
// Falls back to the static demo list below until Firebase is
// configured (js/firebase-config.js) — then it loads live products
// from your Firestore `products` collection instead, same as
// StrDust's dashboard.html writes them.
// ---------------------------------------------------------------
import { db, isFirebaseConfigured } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let VELMORA_PRODUCTS = [
  {
    id: 'rng-001',
    name: 'Antique Gold Kundan Ring',
    category: 'Rings',
    gender: 'Women',
    price: 4200,
    oldPrice: 5200,
    tag: 'New',
  },
  {
    id: 'nck-001',
    name: 'Maroon Stone Bridal Necklace',
    category: 'Necklaces',
    gender: 'Women',
    price: 12500,
    oldPrice: null,
    tag: 'Bestseller',
  },
  {
    id: 'ear-001',
    name: 'Pearl Drop Chandbali Earrings',
    category: 'Earrings',
    gender: 'Women',
    price: 3100,
    oldPrice: 3800,
    tag: null,
  },
  {
    id: 'brc-001',
    name: 'Layered Gold Cuff Bracelet',
    category: 'Bracelets',
    gender: 'Women',
    price: 5400,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'nck-002',
    name: 'Antique Temple Choker',
    category: 'Necklaces',
    gender: 'Women',
    price: 9800,
    oldPrice: 11000,
    tag: 'New',
  },
  {
    id: 'rng-002',
    name: 'Rose Gold Solitaire Ring',
    category: 'Rings',
    gender: 'Women',
    price: 6600,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'ear-002',
    name: 'Kundan Jhumka Earrings',
    category: 'Earrings',
    gender: 'Women',
    price: 2800,
    oldPrice: null,
    tag: 'Bestseller',
  },
  {
    id: 'brc-002',
    name: 'Ruby Studded Bangle Set',
    category: 'Bracelets',
    gender: 'Women',
    price: 8200,
    oldPrice: 9500,
    tag: null,
  },
  {
    id: 'pnd-001',
    name: 'Floral Gold Pendant',
    category: 'Pendant',
    gender: 'Women',
    price: 3900,
    oldPrice: null,
    tag: 'New',
  },
  {
    id: 'oth-001',
    name: 'Pearl Hair Accessory Set',
    category: 'Others',
    gender: 'Women',
    price: 950,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'rng-003',
    name: "Men's Gold Signet Ring",
    category: 'Rings',
    gender: 'Men',
    price: 5800,
    oldPrice: null,
    tag: 'New',
  },
  {
    id: 'brc-003',
    name: "Men's Silver Chain Bracelet",
    category: 'Bracelets',
    gender: 'Men',
    price: 3400,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'gls-001',
    name: "Men's Classic Sunglasses",
    category: 'Glasses',
    gender: 'Men',
    price: 2200,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'acc-001',
    name: "Men's Leather Wallet",
    category: 'Other Accessories',
    gender: 'Men',
    price: 1800,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'brc-004',
    name: 'Minimal Gold Bangle',
    category: 'Bracelets',
    gender: 'Unisex',
    price: 4600,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'rng-004',
    name: 'Plain Band Couple Ring',
    category: 'Rings',
    gender: 'Unisex',
    price: 3200,
    oldPrice: null,
    tag: 'Bestseller',
  },
  {
    id: 'cmb-001',
    name: 'Rings & Earrings Duo Set',
    category: 'Combo Deals',
    gender: 'Women',
    price: 6800,
    oldPrice: 8600,
    tag: 'Combo',
  },
  {
    id: 'cmb-002',
    name: 'Necklace + Bracelet Bundle',
    category: 'Combo Deals',
    gender: 'Women',
    price: 11200,
    oldPrice: 14000,
    tag: 'Combo',
  },
  {
    id: 'gft-001',
    name: 'Gold-Wrapped Rose Bouquet',
    category: 'Flower',
    gender: 'Unisex',
    price: 1200,
    oldPrice: null,
    tag: 'Gift',
  },
  {
    id: 'gft-002',
    name: 'Belgian Chocolate Box',
    category: 'Chocolate',
    gender: 'Unisex',
    price: 950,
    oldPrice: null,
    tag: 'Gift',
  },
  {
    id: 'gft-003',
    name: 'Make-Your-Own Bracelet Kit',
    category: 'DIY',
    gender: 'Unisex',
    price: 1600,
    oldPrice: null,
    tag: 'Gift',
  },
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
  } catch (e) { /* corrupt or unavailable cache, ignore */ }
  return false;
}

function saveCachedProducts() {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(VELMORA_PRODUCTS));
  } catch (e) { /* storage full or unavailable, ignore */ }
}

async function loadProducts() {
  if (!isFirebaseConfigured) return; // keep static demo data
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

// Returns { save, percent } when a product has a genuine discount
// (oldPrice set and greater than the current price), otherwise null.
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
      <button class="quick-add-btn" data-add-to-cart="${p.id}" aria-label="Add to cart" ${outOfStock ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
      </button>
      <button class="quick-buy-btn" data-buy-now="${p.id}" aria-label="Buy now" ${outOfStock ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 11-14h-7l1-6z"/></svg>
      </button>
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
  scope.querySelectorAll('.quick-buy-btn[data-buy-now]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const p = VELMORA_PRODUCTS.find(item => item.id === btn.dataset.buyNow);
      if (!p) return;
      addToCart(p, 1);
      window.location.href = 'cart.html';
    });
  });
}

// Renders into any element with [data-product-grid], applying the
// current category, gender, and search filters together.
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

// Keeps the "Filter" trigger's active-count badge and summary label
// in sync with the current category/gender selection.
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

// Draggable dual-handle price range slider — lets the shopper pull the
// two handles to any custom min/max instead of typing numbers in.
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
  if (minVal > maxVal) {
    minVal = maxVal;
    minRange.value = minVal;
  }
  const minPct = (minVal / PRICE_SLIDER_MAX) * 100;
  const maxPct = (maxVal / PRICE_SLIDER_MAX) * 100;
  if (rangeFill) {
    rangeFill.style.left = minPct + '%';
    rangeFill.style.right = (100 - maxPct) + '%';
  }
  if (minLabel) minLabel.textContent = '৳' + minVal.toLocaleString('en-IN');
  if (maxLabel) maxLabel.textContent = maxVal >= PRICE_SLIDER_MAX
    ? `৳${PRICE_SLIDER_MAX.toLocaleString('en-IN')}+`
    : '৳' + maxVal.toLocaleString('en-IN');
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
    filterState.price = `${minVal}-${maxVal}`;
    PRICE_FILTER_LABELS[filterState.price] = `৳${minVal.toLocaleString('en-IN')} – ${
      maxVal >= 999999 ? `৳${PRICE_SLIDER_MAX.toLocaleString('en-IN')}+` : '৳' + maxVal.toLocaleString('en-IN')
    }`;
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
  const catChips = document.querySelectorAll('[data-filter]');
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.category = chip.dataset.filter;
      renderProductGrid();
    });
  });

  const genderChips = document.querySelectorAll('[data-gender-filter]');
  genderChips.forEach(chip => {
    chip.addEventListener('click', () => {
      genderChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.gender = chip.dataset.genderFilter;
      renderProductGrid();
    });
  });

  const priceChips = document.querySelectorAll('[data-price-filter]');
  priceChips.forEach(chip => {
    chip.addEventListener('click', () => {
      priceChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterState.price = chip.dataset.priceFilter;
      resetPriceSlider();
      renderProductGrid();
    });
  });

  setupPriceSlider();
}

// Wires the "Filter" button, its slide-up drawer, and Clear/Show Results
// actions. Safe no-op on pages that don't have a filter drawer.
function setupFilterDrawer() {
  const drawer = document.getElementById('filterDrawer');
  const overlay = document.getElementById('filterDrawerOverlay');
  const toggle = document.getElementById('filterDrawerToggle');
  if (!drawer || !overlay || !toggle) return;

  const closeBtn = document.getElementById('filterDrawerClose');
  const applyBtn = document.getElementById('filterApplyBtn');
  const clearBtn = document.getElementById('filterClearBtn');

  function openDrawer() {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openDrawer);
  overlay.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (applyBtn) applyBtn.addEventListener('click', closeDrawer);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterState.category = 'All';
      filterState.gender = 'All';
      filterState.price = 'All';
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.toggle('active', c.dataset.filter === 'All'));
      document.querySelectorAll('[data-gender-filter]').forEach(c => c.classList.toggle('active', c.dataset.genderFilter === 'All'));
      document.querySelectorAll('[data-price-filter]').forEach(c => c.classList.toggle('active', c.dataset.priceFilter === 'All'));
      resetPriceSlider();
      renderProductGrid();
    });
  }
}

// Reads ?category=, ?gender=, ?search= from the URL (used by nav links
// like Man/Woman/Gift Items/Combo Deals, and by the nav search bar)
// and pre-applies them.
function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const gender = params.get('gender');
  const search = params.get('search');
  const tag = params.get('tag');

  if (category) {
    filterState.category = category;
    document.querySelectorAll('[data-filter]').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === category);
    });
  }
  if (gender) {
    filterState.gender = gender;
    document.querySelectorAll('[data-gender-filter]').forEach(c => {
      c.classList.toggle('active', c.dataset.genderFilter === gender);
    });
  }
  if (tag) {
    filterState.tag = tag;
  }
  if (search) {
    filterState.search = search;
    const input = document.getElementById('search-input');
    if (input) input.value = search;
  }
}

// Exposed so the nav search bar can filter in place when already on shop.html
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

// Homepage "Combo Deals" slider — hides its whole section if no
// products are tagged with this category yet.
function renderComboDeals() {
  const grid = document.querySelector('[data-combo-grid]');
  if (!grid) return;
  const items = VELMORA_PRODUCTS.filter(p => p.category === 'Combo Deals');
  const section = grid.closest('section');
  if (!items.length) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  grid.innerHTML = items.map(renderProductCard).join('');
  wireAddToCartButtons(grid);
}

// Generic homepage section curation: uses products the admin has
// manually tagged for this section (product edit modal → "Show on
// Homepage"); falls back to an automatic rule when nothing has been
// picked yet, so the section never looks empty before setup.
function curatedForSection(key, fallbackPredicate, limit = 8) {
  const manual = VELMORA_PRODUCTS.filter(p => Array.isArray(p.homeSections) && p.homeSections.includes(key));
  const pool = manual.length ? manual : VELMORA_PRODUCTS.filter(fallbackPredicate);
  return pool.slice().sort((a, b) => (Number(a.homeOrder) || 0) - (Number(b.homeOrder) || 0)).slice(0, limit);
}

function renderCuratedSection(gridSelector, key, fallbackPredicate) {
  const grid = document.querySelector(gridSelector);
  if (!grid) return;
  const items = curatedForSection(key, fallbackPredicate);
  const section = grid.closest('section');
  if (!items.length) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';
  grid.innerHTML = items.map(renderProductCard).join('');
  wireAddToCartButtons(grid);
}

function renderNewArrivals() {
  renderCuratedSection('[data-newarrivals-grid]', 'newArrivals', p => (p.tag || '').toLowerCase() === 'new');
}
function renderForWomen() {
  renderCuratedSection('[data-forwomen-grid]', 'forWomen', p => p.gender === 'Women');
}
function renderForMan() {
  renderCuratedSection('[data-forman-grid]', 'forMan', p => p.gender === 'Men');
}
function renderGiftBox() {
  renderCuratedSection('[data-giftbox-grid]', 'giftBox', p => ['Gift Box', 'Flower', 'Chocolate', 'Books'].includes(p.category));
}

function renderRelated(current) {
  const grid = document.querySelector('[data-related-grid]');
  if (!grid) return;
  const related = VELMORA_PRODUCTS.filter(p => p.category === current.category && p.id !== current.id).slice(0, 4);
  grid.innerHTML = related.length
    ? related.map(renderProductCard).join('')
    : `<p style="grid-column:1/-1; text-align:center; color:#6b4a4e;">No other pieces in this category yet.</p>`;
  wireAddToCartButtons(grid);
}

function updateProductSEO(p) {
  const desc = `${p.name} — ${p.category} at Velmora. ${p.description || 'Handcrafted detailing with a polished antique finish.'} ৳${p.price} — cash on delivery across Bangladesh.`.slice(0, 160);
  const img = primaryImage(p) || '';

  const setMeta = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  setMeta('meta[name="description"]', 'content', desc);
  setMeta('meta[property="og:title"]', 'content', p.name + ' — Velmora');
  setMeta('meta[property="og:description"]', 'content', desc);
  if (img) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', img);
  }

  let ld = document.getElementById('product-jsonld');
  if (!ld) {
    ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.id = 'product-jsonld';
    document.head.appendChild(ld);
  }
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: desc,
    image: img || undefined,
    category: p.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: p.price,
      availability: (p.stock === undefined || p.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  });
}

function renderProductDetail() {
  const mount = document.querySelector('[data-product-detail]');
  if (!mount) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const p = VELMORA_PRODUCTS.find(item => item.id === id) || VELMORA_PRODUCTS[0];
  const images = (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []);

  const outOfStock = isOutOfStock(p);
  const bio = p.description && p.description.trim()
    ? p.description
    : `${p.name} is a handcrafted ${p.category.toLowerCase()} piece finished with a polished antique detail. Every Velmora piece is hand-set and hand-polished, made to catch the light without ever feeling heavy. Pair it with everyday looks or festive wear — it holds up either way. A thoughtful pick for yourself or as a gift for someone special. Cash on delivery is available across Bangladesh.`;
  const waNumber = '8801707082002';
  const waText = `Hi, I'm interested in: ${p.name} (${formatTaka(p.price)})`;
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

  mount.innerHTML = `
    <div>
      <div class="pd-media product-media" style="aspect-ratio:4/3; position:relative; touch-action:pan-y;" id="pd-main-media">
        ${outOfStock ? `<span class="product-tag" style="left:auto; right:12px; background:#a15a5a; color:#fff; z-index:2;">Out of Stock</span>` : ''}
        ${images.length ? `<img src="${images[0]}" alt="${p.name}" data-pd-img draggable="false"
            style="width:100%; height:100%; object-fit:contain; background:var(--blush);">` : velmoraGemIcon()}
        ${images.length > 1 ? `
          <button type="button" class="pd-media-arrow pd-media-arrow-prev" data-pd-prev aria-label="Previous image">‹</button>
          <button type="button" class="pd-media-arrow pd-media-arrow-next" data-pd-next aria-label="Next image">›</button>
          <div class="pd-media-dots">${images.map((_, i) => `<span class="pd-media-dot ${i === 0 ? 'is-active' : ''}" data-dot="${i}"></span>`).join('')}</div>
        ` : ''}
      </div>
      ${images.length > 1 ? `
        <div style="display:flex; gap:10px; margin-top:14px;">
          ${images.map((img, i) => `
            <button type="button" class="pd-thumb-btn" data-thumb="${i}"
              style="width:64px; height:64px; padding:0; border:2px solid ${i === 0 ? 'var(--gold)' : 'transparent'}; overflow:hidden; cursor:pointer; background:none;">
              <img src="${img}" style="width:100%; height:100%; object-fit:cover; display:block;">
            </button>`).join('')}
        </div>` : ''}
    </div>
    <div class="pd-info">
      <div class="cat">${p.category}</div>
      <h1 class="display" style="font-size:2rem; margin-bottom:14px;">${p.name}</h1>
      <div class="price" style="font-size:1.3rem; margin-bottom:6px;">
        ${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}
      </div>
      ${discountInfo(p) ? `<div class="save-badge" style="font-size:0.92rem; margin-bottom:16px;">Save ${formatTaka(discountInfo(p).save)} (${discountInfo(p).percent}% off)</div>` : '<div style="margin-bottom:16px;"></div>'}
      <div style="margin-bottom:20px;">
        ${outOfStock
          ? `<span class="status-badge" style="background:#f4d4d4; color:#7a1a1a; padding:5px 12px;">Out of Stock</span>`
          : (p.stock !== undefined && p.stock !== null ? `<span class="status-badge" style="background:#d4edda; color:#155724; padding:5px 12px;">In Stock — ${p.stock} piece${p.stock == 1 ? '' : 's'} left</span>` : '')}
      </div>
      <p style="color:#6b4a4e; margin-bottom:22px; max-width:460px; line-height:1.7;">${bio}</p>
      <p style="color:#6b4a4e; font-size:0.86rem; margin-bottom:28px;">Cash on delivery across Bangladesh — ৳60 inside Dhaka, ৳110 outside Dhaka.</p>
      ${Array.isArray(p.sizes) && p.sizes.length ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:0.78rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--maroon); margin-bottom:10px;">Available Sizes</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${p.sizes.map(s => `<span style="padding:6px 14px; border:1px solid rgba(107,15,26,0.3); font-size:0.85rem;">${s}</span>`).join('')}
          </div>
        </div>` : ''}
      <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
        <div class="qty-stepper">
          <button type="button" data-qty-minus ${outOfStock ? 'disabled' : ''}>−</button>
          <input type="text" value="1" data-qty-input readonly>
          <button type="button" data-qty-plus ${outOfStock ? 'disabled' : ''}>+</button>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px;">
        <button class="add-cart-btn pd-action-btn" data-add-to-cart="${p.id}" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of Stock' : 'Add to Cart'}</button>
        <button class="btn btn-solid pd-action-btn" style="border:none;" data-buy-now="${p.id}" ${outOfStock ? 'disabled' : ''}>Buy Now</button>
        <a href="${waLink}" target="_blank" rel="noopener" class="btn pd-action-btn" style="border-color:#25D366; color:#128C3F;">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.001 3C9.104 3 3.5 8.604 3.5 15.5c0 2.385.663 4.614 1.814 6.516L3 29l7.146-2.267A12.44 12.44 0 0 0 16 28c6.897 0 12.5-5.604 12.5-12.5S22.898 3 16.001 3z" opacity="0"/><path d="M3 21l1.6-4.8A8 8 0 1 1 8.8 19.4L3 21z"/><path d="M8.5 9.5c0 3.5 3 6.5 6.5 6.5.6 0 1-.5.8-1l-1.3-1.9a.8.8 0 0 0-.9-.2l-1 .4a5 5 0 0 1-2.9-2.9l.4-1a.8.8 0 0 0-.2-.9L8.9 8.7c-.5-.2-1 .2-1 .8z"/></svg>
          WhatsApp
        </a>
      </div>
    </div>`;
  document.title = p.name + ' — Velmora';
  updateProductSEO(p);
  renderRelated(p);

  const buyNowBtn = mount.querySelector('[data-buy-now]');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', function () {
      const qty = parseInt(mount.querySelector('[data-qty-input]').value) || 1;
      addToCart(p, qty);
      window.location.href = 'cart.html';
    });
  }

  if (images.length > 1) {
    const mediaEl = document.getElementById('pd-main-media');
    const imgEl = mediaEl.querySelector('[data-pd-img]');
    const thumbBtns = mount.querySelectorAll('[data-thumb]');
    const dots = mediaEl.querySelectorAll('[data-dot]');
    let current = 0;

    function showImage(idx) {
      current = (idx + images.length) % images.length;
      imgEl.src = images[current];
      thumbBtns.forEach((b, i) => { b.style.borderColor = i === current ? 'var(--gold)' : 'transparent'; });
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    thumbBtns.forEach((btn, i) => btn.addEventListener('click', () => showImage(i)));
    dots.forEach(dot => dot.addEventListener('click', () => showImage(Number(dot.dataset.dot))));
    mediaEl.querySelector('[data-pd-prev]').addEventListener('click', () => showImage(current - 1));
    mediaEl.querySelector('[data-pd-next]').addEventListener('click', () => showImage(current + 1));

    // Swipe support (touch) for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    mediaEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    mediaEl.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        showImage(dx < 0 ? current + 1 : current - 1);
      }
    }, { passive: true });

    // Mouse drag support (desktop)
    let dragStartX = null;
    mediaEl.addEventListener('mousedown', (e) => { dragStartX = e.clientX; });
    mediaEl.addEventListener('mouseup', (e) => {
      if (dragStartX === null) return;
      const dx = e.clientX - dragStartX;
      if (Math.abs(dx) > 40) showImage(dx < 0 ? current + 1 : current - 1);
      dragStartX = null;
    });
    mediaEl.addEventListener('mouseleave', () => { dragStartX = null; });
  }

  const qtyInput = mount.querySelector('[data-qty-input]');
  mount.querySelector('[data-qty-minus]').addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  mount.querySelector('[data-qty-plus]').addEventListener('click', () => {
    qtyInput.value = parseInt(qtyInput.value) + 1;
  });
  mount.querySelector('[data-add-to-cart]').addEventListener('click', function () {
    addToCart(p, parseInt(qtyInput.value));
    this.textContent = 'Added ✓';
    this.classList.add('is-added');
    setTimeout(() => {
      this.textContent = 'Add to Cart';
      this.classList.remove('is-added');
    }, 1200);
  });
}

const hasCachedProducts = loadCachedProducts();
const productsReadyPromise = loadProducts().then(() => VELMORA_PRODUCTS);
window.velmoraProductsReady = productsReadyPromise;

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
}

document.addEventListener('DOMContentLoaded', async function () {
  setupFilters();
  setupFilterDrawer();
  if (hasCachedProducts) {
    renderAll(); // instant paint from last visit's cache
  }
  await productsReadyPromise;
  renderAll(); // refresh with live data once it arrives
});
