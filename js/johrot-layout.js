// Johrot-inspired layout behaviour for Velmora:
// announcement bar, slide-in cart drawer, slider pager, category-tile photos, shop count.
(function () {
  if (window.__jrLayout) return;
  window.__jrLayout = true;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Announcement bar ---------- */
  function initAnnouncement() {
    var header = document.querySelector('.site-header');
    if (!header || document.querySelector('.announce-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'announce-bar';
    bar.textContent = window.VELMORA_ANNOUNCEMENT || 'Cash on Delivery available across Bangladesh';
    header.parentNode.insertBefore(bar, header);
  }

  /* ---------- Cart drawer ---------- */
  var drawer, overlay;
  var NOTE_KEY = 'velmora_order_note';

  function buildDrawer() {
    if (drawer) return;
    overlay = document.createElement('div');
    overlay.className = 'jr-overlay';
    drawer = document.createElement('aside');
    drawer.className = 'jr-cart';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Your cart');
    drawer.innerHTML =
      '<div class="jr-cart-head"><h3>Your cart</h3>' +
      '<button type="button" data-jr-close aria-label="Close cart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>' +
      '<div class="jr-cart-cols"><span>Product</span><span>Total</span></div>' +
      '<div class="jr-cart-body"></div>' +
      '<div class="jr-cart-foot">' +
      '<details class="jr-note"><summary>Order instruction</summary><textarea rows="3" placeholder="Anything we should know?"></textarea></details>' +
      '<div class="jr-est"><span>Estimated total</span><strong data-jr-total>৳0</strong></div>' +
      '<p class="jr-fine">Discounts and delivery charge are calculated at checkout.</p>' +
      '<a href="cart.html" class="jr-checkout-btn">Check out</a></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener('click', closeDrawer);
    drawer.addEventListener('click', function (e) {
      var t = e.target.closest('[data-jr-close],[data-jr-minus],[data-jr-plus],[data-jr-remove]');
      if (!t) return;
      if (t.hasAttribute('data-jr-close')) return closeDrawer();
      var id = t.dataset.jrMinus || t.dataset.jrPlus || t.dataset.jrRemove;
      var item = getCart().find(function (i) { return i.id === id; });
      if (!item) return;
      if (t.dataset.jrMinus) updateQty(id, item.qty - 1);
      else if (t.dataset.jrPlus) updateQty(id, item.qty + 1);
      else removeFromCart(id);
      renderDrawer();
    });
    var note = drawer.querySelector('textarea');
    try { note.value = localStorage.getItem(NOTE_KEY) || ''; } catch (e) {}
    note.addEventListener('input', function () {
      try { localStorage.setItem(NOTE_KEY, note.value); } catch (e) {}
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  }

  function renderDrawer() {
    var body = drawer.querySelector('.jr-cart-body');
    var cart = getCart();
    if (!cart.length) {
      body.innerHTML = '<div class="jr-empty"><p>Your cart is empty.</p><a href="shop.html" class="btn btn-aqua">Continue shopping</a></div>';
    } else {
      body.innerHTML = cart.map(function (item) {
        return '<div class="jr-line">' +
          '<div class="jr-line-thumb">' + (item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '">' : '') + '</div>' +
          '<div class="jr-line-info"><h4>' + esc(item.name) + '</h4><div class="unit">' + formatTaka(item.price) + '</div>' +
          '<div class="jr-line-controls"><div class="qty-stepper">' +
          '<button type="button" data-jr-minus="' + esc(item.id) + '" aria-label="Decrease">−</button>' +
          '<input type="text" value="' + item.qty + '" readonly>' +
          '<button type="button" data-jr-plus="' + esc(item.id) + '" aria-label="Increase">+</button></div>' +
          '<button type="button" class="jr-trash" data-jr-remove="' + esc(item.id) + '" aria-label="Remove">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></div></div>' +
          '<div class="jr-line-total">' + formatTaka(item.price * item.qty) + '</div></div>';
      }).join('');
    }
    drawer.querySelector('[data-jr-total]').textContent = formatTaka(cartSubtotal());
  }

  function openDrawer() {
    if (typeof getCart !== 'function') { window.location.href = 'cart.html'; return; }
    buildDrawer();
    renderDrawer();
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initCartDrawer() {
    if (document.getElementById('checkout-form')) return; // cart page has its own checkout
    document.querySelectorAll('a.cart-icon-wrap').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
    });
    document.addEventListener('velmora:cart-added', openDrawer);
  }

  /* ---------- Slider pager (‹ 1/3 ›) ---------- */
  function initPagers() {
    document.querySelectorAll('.deal-slider-wrap').forEach(function (wrap) {
      var scroller = wrap.querySelector('.deal-slider');
      if (!scroller || (wrap.nextElementSibling && wrap.nextElementSibling.classList.contains('jr-pager'))) return;
      wrap.querySelectorAll('.deal-arrow').forEach(function (b) { b.remove(); });
      var pager = document.createElement('div');
      pager.className = 'jr-pager';
      pager.innerHTML = '<button type="button" data-prev aria-label="Previous">‹</button><span data-count>1/1</span><button type="button" data-next aria-label="Next">›</button>';
      wrap.after(pager);
      var prev = pager.querySelector('[data-prev]');
      var next = pager.querySelector('[data-next]');
      var count = pager.querySelector('[data-count]');

      function update() {
        var w = Math.max(1, scroller.clientWidth);
        var pages = Math.max(1, Math.ceil((scroller.scrollWidth - 4) / w));
        var max = scroller.scrollWidth - scroller.clientWidth;
        var cur = pages > 1 && max > 0 ? Math.round(scroller.scrollLeft / max * (pages - 1)) + 1 : 1;
        count.textContent = cur + '/' + pages;
        pager.hidden = pages <= 1;
        prev.disabled = cur <= 1;
        next.disabled = cur >= pages;
      }
      prev.addEventListener('click', function () { scroller.scrollBy({ left: -scroller.clientWidth * 0.9, behavior: 'smooth' }); });
      next.addEventListener('click', function () { scroller.scrollBy({ left: scroller.clientWidth * 0.9, behavior: 'smooth' }); });
      scroller.addEventListener('scroll', update, { passive: true });
      scroller.addEventListener('load', update, true);
      window.addEventListener('resize', update);
      new MutationObserver(update).observe(scroller, { childList: true, subtree: true });
      update();
    });
  }

  /* ---------- Photos for tiles / brand cards (from product images) ---------- */
  // All image URLs a product has, in order (gallery first, then the single image).
  function photosOf(p) {
    var list = [];
    if (Array.isArray(p.images)) list = list.concat(p.images);
    if (p.image) list.push(p.image);
    return list.filter(function (u) { return typeof u === 'string' && u; });
  }

  // Checks that an image URL really serves an image. Hosts like imgbb answer a deleted
  // photo with a placeholder ("image not found"), so a plain <img> would show that
  // placeholder instead of failing. Results are cached per URL.
  var imageChecks = {};
  function imageWorks(url) {
    if (imageChecks[url]) return imageChecks[url];
    imageChecks[url] = new Promise(function (resolve) {
      function viaImage() {
        var im = new Image();
        im.onload = function () { resolve(im.naturalWidth > 0); };
        im.onerror = function () { resolve(false); };
        im.src = url;
      }
      if (!window.fetch) return viaImage();
      fetch(url, { mode: 'cors', cache: 'force-cache' }).then(function (r) {
        var type = r.headers.get('content-type') || '';
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

  // Hide a whole "For Women" / "For Man" section when none of its tiles has a product.
  function hideEmptySections() {
    document.querySelectorAll('.jr-tiles').forEach(function (grid) {
      var section = grid.closest('section');
      if (!section) return;
      var anyVisible = Array.prototype.some.call(grid.querySelectorAll('.jr-tile'), function (t) {
        return t.style.display !== 'none';
      });
      section.style.display = anyVisible ? '' : 'none';
    });
  }

  function applyPhotos(products) {
    if (!Array.isArray(products)) return;
    var jobs = [];
    document.querySelectorAll('[data-jr-photo]').forEach(function (el) {
      var cats = (el.dataset.category || '').split(',').filter(Boolean);
      var gender = el.dataset.gender || '';
      var urls = [];
      products.forEach(function (p) {
        if ((!cats.length || cats.indexOf(p.category) > -1) && (!gender || p.gender === gender)) {
          photosOf(p).forEach(function (u) { if (urls.indexOf(u) < 0) urls.push(u); });
        }
      });
      urls = urls.slice(0, 10);
      var tile = el.closest('.jr-tile');
      // Category tiles (For Women / For Man): hide a tile when no product is assigned to it.
      if (!urls.length) {
        if (tile) tile.style.display = 'none';
        return;
      }
      if (tile) tile.style.display = '';
      // Use the first photo that actually loads; skip dead links.
      jobs.push(firstWorking(urls).then(function (url) {
        if (url) el.style.setProperty('--photo-bg', "url('" + url.replace(/'/g, '%27') + "')");
        else if (tile) tile.style.display = 'none';
      }));
    });
    hideEmptySections();
    Promise.all(jobs).then(hideEmptySections);
  }
  function initPhotos() {
    if (!document.querySelector('[data-jr-photo]')) return;
    try {
      applyPhotos(JSON.parse(localStorage.getItem('velmora_products_cache')));
    } catch (e) {}
    if (window.velmoraProductsReady) window.velmoraProductsReady.then(applyPhotos).catch(function () {});
  }

  /* ---------- Shop page: "N products" ---------- */
  function initShopCount() {
    var grid = document.querySelector('[data-product-grid]');
    var row = document.querySelector('.filter-bar-row');
    if (!grid || !row || row.querySelector('.jr-count')) return;
    var badge = document.createElement('span');
    badge.className = 'jr-count';
    row.appendChild(badge);
    function update() {
      var n = grid.querySelectorAll('.product-card').length;
      badge.textContent = n + (n === 1 ? ' product' : ' products');
    }
    new MutationObserver(update).observe(grid, { childList: true });
    update();
  }

  ready(function () {
    initAnnouncement();
    initCartDrawer();
    initPagers();
    initPhotos();
    initShopCount();
  });
})();
