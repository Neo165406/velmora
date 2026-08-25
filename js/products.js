// ----------------------------------------------------------------
// Velmora product data.
// Falls back to the static demo list below until Firebase is
// configured (js/firebase-config.js) — then it loads live products
// from your Firestore `products` collection instead, same as
// StrDust's dashboard.html writes them.
// ---------------------------------------------------------------
import { db, isFirebaseConfigured } from './firebase-init.js';
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

async function loadProducts() {
  if (!isFirebaseConfigured) return; // keep static demo data
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (!snapshot.empty) {
      VELMORA_PRODUCTS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    ? `<img src="${img}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`
    : velmoraGemIcon();
}

function renderProductCard(p) {
  return `
    <div class="product-card">
      <a href="product.html?id=${p.id}">
        <div class="product-media">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
          ${productMedia(p)}
        </div>
        <div class="product-info">
          <div class="cat">${p.category}</div>
          <h3>${p.name}</h3>
          <div class="price">${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}</div>
        </div>
      </a>
      <button class="quick-add-btn" data-add-to-cart="${p.id}" aria-label="Add to cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
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
}

// Renders into any element with [data-product-grid], applying the
// current category, gender, and search filters together.
const filterState = { category: 'All', gender: 'All', search: '' };

function applyFilters() {
  return VELMORA_PRODUCTS.filter(p => {
    const matchCategory = filterState.category === 'All' || p.category === filterState.category;
    const matchGender = filterState.gender === 'All' || p.gender === filterState.gender;
    const matchSearch = !filterState.search || p.name.toLowerCase().includes(filterState.search.toLowerCase());
    return matchCategory && matchGender && matchSearch;
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
}

// Reads ?category=, ?gender=, ?search= from the URL (used by nav links
// like Men/Women/Unisex, and by the nav search bar) and pre-applies them.
function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const gender = params.get('gender');
  const search = params.get('search');

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

function renderRelated(current) {
  const grid = document.querySelector('[data-related-grid]');
  if (!grid) return;
  const related = VELMORA_PRODUCTS.filter(p => p.category === current.category && p.id !== current.id).slice(0, 4);
  grid.innerHTML = related.length
    ? related.map(renderProductCard).join('')
    : `<p style="grid-column:1/-1; text-align:center; color:#6b4a4e;">No other pieces in this category yet.</p>`;
  wireAddToCartButtons(grid);
}

function renderProductDetail() {
  const mount = document.querySelector('[data-product-detail]');
  if (!mount) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const p = VELMORA_PRODUCTS.find(item => item.id === id) || VELMORA_PRODUCTS[0];
  const images = (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []);

  mount.innerHTML = `
    <div>
      <div class="pd-media product-media" style="aspect-ratio:1/1;" id="pd-main-media">
        ${images.length ? `<img src="${images[0]}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">` : velmoraGemIcon()}
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
      <div class="price" style="font-size:1.3rem; margin-bottom:24px;">
        ${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}
      </div>
      <p style="color:#6b4a4e; margin-bottom:28px; max-width:440px;">
        Handcrafted detailing with a polished antique finish. Cash on delivery available across Bangladesh — ৳60 inside Dhaka, ৳130 outside Dhaka.
      </p>
      ${Array.isArray(p.sizes) && p.sizes.length ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:0.78rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--maroon); margin-bottom:10px;">Available Sizes</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${p.sizes.map(s => `<span style="padding:6px 14px; border:1px solid rgba(107,15,26,0.3); font-size:0.85rem;">${s}</span>`).join('')}
          </div>
        </div>` : ''}
      <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
        <div class="qty-stepper">
          <button type="button" data-qty-minus>−</button>
          <input type="text" value="1" data-qty-input readonly>
          <button type="button" data-qty-plus>+</button>
        </div>
        <button class="add-cart-btn" style="width:auto; padding:13px 32px;" data-add-to-cart="${p.id}">Add to Cart</button>
      </div>
    </div>`;
  document.title = p.name + ' — Velmora';
  renderRelated(p);

  if (images.length > 1) {
    mount.querySelectorAll('[data-thumb]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.thumb);
        document.getElementById('pd-main-media').innerHTML =
          `<img src="${images[idx]}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;">`;
        mount.querySelectorAll('[data-thumb]').forEach(b => { b.style.borderColor = 'transparent'; });
        btn.style.borderColor = 'var(--gold)';
      });
    });
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

const productsReadyPromise = loadProducts().then(() => VELMORA_PRODUCTS);
window.velmoraProductsReady = productsReadyPromise;

document.addEventListener('DOMContentLoaded', async function () {
  await productsReadyPromise;
  applyUrlFilters();
  renderProductGrid();
  renderFeatured();
  setupFilters();
  renderProductDetail();
  });
