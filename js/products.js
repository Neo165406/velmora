// ---------------------------------------------------------------
// Velmora demo product data.
// This is placeholder/static data so the site works standalone.
// Later, swap loadProducts() for a Firestore query against your
// `products` collection (same pattern as StrDust's dashboard.html),
// keeping the same field names so the rendering code needs no changes.
// ---------------------------------------------------------------

const VELMORA_PRODUCTS = [
  {
    id: 'rng-001',
    name: 'Antique Gold Kundan Ring',
    category: 'Rings',
    price: 4200,
    oldPrice: 5200,
    tag: 'New',
  },
  {
    id: 'nck-001',
    name: 'Maroon Stone Bridal Necklace',
    category: 'Necklaces',
    price: 12500,
    oldPrice: null,
    tag: 'Bestseller',
  },
  {
    id: 'ear-001',
    name: 'Pearl Drop Chandbali Earrings',
    category: 'Earrings',
    price: 3100,
    oldPrice: 3800,
    tag: null,
  },
  {
    id: 'brc-001',
    name: 'Layered Gold Cuff Bracelet',
    category: 'Bracelets',
    price: 5400,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'nck-002',
    name: 'Antique Temple Choker',
    category: 'Necklaces',
    price: 9800,
    oldPrice: 11000,
    tag: 'New',
  },
  {
    id: 'rng-002',
    name: 'Rose Gold Solitaire Ring',
    category: 'Rings',
    price: 6600,
    oldPrice: null,
    tag: null,
  },
  {
    id: 'ear-002',
    name: 'Kundan Jhumka Earrings',
    category: 'Earrings',
    price: 2800,
    oldPrice: null,
    tag: 'Bestseller',
  },
  {
    id: 'brc-002',
    name: 'Ruby Studded Bangle Set',
    category: 'Bracelets',
    price: 8200,
    oldPrice: 9500,
    tag: null,
  },
];

function velmoraGemIcon() {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 22L32 6L56 22L32 58L8 22Z" stroke="#6B0F1A" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 22H56M20 22L32 6M44 22L32 6M20 22L32 58M44 22L32 58" stroke="#6B0F1A" stroke-width="1" opacity="0.6"/>
  </svg>`;
}

function formatTaka(amount) {
  return '৳' + amount.toLocaleString('en-IN');
}

function renderProductCard(p) {
  return `
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="product-media">
        ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
        ${velmoraGemIcon()}
      </div>
      <div class="product-info">
        <div class="cat">${p.category}</div>
        <h3>${p.name}</h3>
        <div class="price">${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}</div>
      </div>
    </a>`;
}

// Renders into any element with [data-product-grid], optionally filtered
function renderProductGrid(category) {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;
  const items = category && category !== 'All'
    ? VELMORA_PRODUCTS.filter(p => p.category === category)
    : VELMORA_PRODUCTS;
  grid.innerHTML = items.map(renderProductCard).join('');
}

function setupFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  if (!chips.length) return;
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProductGrid(chip.dataset.filter);
    });
  });
}

function renderFeatured() {
  const grid = document.querySelector('[data-featured-grid]');
  if (!grid) return;
  grid.innerHTML = VELMORA_PRODUCTS.slice(0, 4).map(renderProductCard).join('');
}

function renderProductDetail() {
  const mount = document.querySelector('[data-product-detail]');
  if (!mount) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const p = VELMORA_PRODUCTS.find(item => item.id === id) || VELMORA_PRODUCTS[0];

  mount.innerHTML = `
    <div class="pd-media product-media" style="aspect-ratio:1/1;">
      ${velmoraGemIcon()}
    </div>
    <div class="pd-info">
      <div class="cat">${p.category}</div>
      <h1 class="display" style="font-size:2rem; margin-bottom:14px;">${p.name}</h1>
      <div class="price" style="font-size:1.3rem; margin-bottom:24px;">
        ${formatTaka(p.price)}${p.oldPrice ? `<span class="old">${formatTaka(p.oldPrice)}</span>` : ''}
      </div>
      <p style="color:#6b4a4e; margin-bottom:28px; max-width:440px;">
        Handcrafted detailing with a polished antique finish. Cash on delivery available across Bangladesh — place your order and our team will confirm by phone.
      </p>
      <a class="btn btn-solid" href="contact.html?product=${encodeURIComponent(p.name)}">Order via WhatsApp</a>
    </div>`;
  document.title = p.name + ' — Velmora';
}

document.addEventListener('DOMContentLoaded', function () {
  renderProductGrid('All');
  renderFeatured();
  setupFilters();
  renderProductDetail();
});
