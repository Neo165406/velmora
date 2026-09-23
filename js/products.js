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
      <div class="product-card-actions">
        <a href="product.html?id=${p.id}" class="buy-now-btn" ${outOfStock ? 'aria-disabled="true" tabindex="-1"' : ''}>Buy Now</a>
        <button class="quick-add-btn" data-add-to-cart="${p.id}" aria-label="Add to cart" ${outOfStock ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>
        </button>
      </div>
    </div>`;
}
