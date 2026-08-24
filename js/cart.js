// ---------------------------------------------------------------
// Velmora cart — localStorage-based, no backend required.
// Delivery: Inside Dhaka ৳60, Outside Dhaka ৳130.
// Once Firestore is wired (see firebase-init.js), checkout() can be
// extended to also write the order into an `orders` collection.
// ---------------------------------------------------------------

const CART_KEY = 'velmora_cart';
const DELIVERY_FEES = { dhaka: 60, outside: 130 };

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
