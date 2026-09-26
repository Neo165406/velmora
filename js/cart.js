// ---------------------------------------------------------------
// Velmora cart — localStorage-based, no backend required.
// Delivery: Inside Dhaka ৳60, Outside Dhaka ৳110
// (admin can override in dashboard Theme tab).
// Once Firestore is wired (see firebase-init.js), checkout() can be
// extended to also write the order into an `orders` collection.
// ---------------------------------------------------------------

const CART_KEY = 'velmora_cart';
const COUPON_KEY = 'velmora_coupon';
const DELIVERY_FEES = { dhaka: 60, outside: 110 };

// Simple built-in coupon codes. Admin can add more from the dashboard
// Theme tab later — this list is the fallback used when no Firestore
// coupon settings are configured.
const VELMORA_COUPONS = {
  'VELMORA10': { type: 'percent', value: 10 },
  'WELCOME50': { type: 'flat', value: 50 }
};

function getAppliedCoupon() {
  try {
    return JSON.parse(localStorage.getItem(COUPON_KEY)) || null;
  } catch (e) {
    return null;
  }
}

function applyCoupon(code) {
  const clean = (code || '').trim().toUpperCase();
  const coupon = VELMORA_COUPONS[clean];
  if (!coupon) return { ok: false, message: 'Invalid coupon code.' };
  const record = { code: clean, ...coupon };
  localStorage.setItem(COUPON_KEY, JSON.stringify(record));
  return { ok: true, message: 'Coupon applied ✓', coupon: record };
}

function removeCoupon() {
  localStorage.removeItem(COUPON_KEY);
}

function couponDiscount(subtotal) {
  const coupon = getAppliedCoupon();
  if (!coupon) return 0;
  if (coupon.type === 'percent') return Math.round(subtotal * (coupon.value / 100));
  if (coupon.type === 'flat') return Math.min(coupon.value, subtotal);
  return 0;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    const image = (Array.isArray(product.images) && product.images[0]) || product.image || null;
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: image,
      qty: qty
    });
  }
  saveCart(cart);
  // Lets the slide-in cart drawer (js/johrot-layout.js) open after an add.
  document.dispatchEvent(new CustomEvent('velmora:cart-added'));
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
}

function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getDeliveryFee(zone) {
  return DELIVERY_FEES[zone] || 0;
}

function updateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    const count = cartCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function formatTaka(amount) {
  return '৳' + amount.toLocaleString('en-IN');
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
