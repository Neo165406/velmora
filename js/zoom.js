// Velmora — zoomable product images (product page + every product card).
// Product page: tap/click the main photo to open a fullscreen viewer.
// Product cards (home, shop, related, etc.): tap the small magnifier button on the photo.
// Viewer: pinch or mouse-wheel to zoom, drag to pan, double-tap/click to toggle,
// swipe (when not zoomed) or arrows to switch photos, Esc or × to close.
(function () {
  if (window.__velmoraZoom) return; // loaded once, even if included twice
  window.__velmoraZoom = true;

  var css = '\
[data-pd-img]{cursor:zoom-in;}\
.vz-card-btn{position:absolute;left:10px;bottom:10px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid rgba(228,199,102,.75);background:rgba(22,22,22,.68);color:#E4C766;display:flex;align-items:center;justify-content:center;padding:0;cursor:zoom-in;-webkit-tap-highlight-color:transparent;}\
.vz-card-btn:active{background:rgba(228,199,102,.3);}\
.vz-card-btn svg{width:17px;height:17px;}\
.vz-box{position:fixed;inset:0;z-index:9999;background:rgba(22,22,22,.96);display:none;user-select:none;-webkit-user-select:none;}\
.vz-box.is-open{display:block;}\
.vz-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;}\
.vz-img{max-width:100%;max-height:100%;object-fit:contain;transform-origin:center center;will-change:transform;-webkit-user-drag:none;pointer-events:none;}\
.vz-btn{position:absolute;z-index:2;width:44px;height:44px;border-radius:50%;border:1px solid rgba(228,199,102,.6);background:rgba(22,22,22,.7);color:#E4C766;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}\
.vz-btn:active{background:rgba(228,199,102,.25);}\
.vz-close{top:max(14px,env(safe-area-inset-top));right:14px;}\
.vz-prev{left:12px;top:50%;margin-top:-22px;}\
.vz-next{right:12px;top:50%;margin-top:-22px;}\
.vz-tools{position:absolute;z-index:2;bottom:max(18px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:center;}\
.vz-tools .vz-btn{position:static;}\
.vz-count{color:#FAF6EF;font-size:.85rem;min-width:44px;text-align:center;letter-spacing:.06em;}\
';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var box, stage, img, countEl, prevBtn, nextBtn;
  var srcs = [], idx = 0, syncMain = false;
  var scale = 1, tx = 0, ty = 0;
  var MAX = 5;
  var pointers = {};
  var pinch = null, panLast = null, downInfo = null, lastTap = 0, lastTapX = 0, lastTapY = 0;

  function build() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'vz-box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Zoomed product image');
    box.innerHTML =
      '<div class="vz-stage"><img class="vz-img" alt="" draggable="false"></div>' +
      '<button type="button" class="vz-btn vz-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="vz-btn vz-prev" aria-label="Previous image">&lsaquo;</button>' +
      '<button type="button" class="vz-btn vz-next" aria-label="Next image">&rsaquo;</button>' +
      '<div class="vz-tools">' +
      '<button type="button" class="vz-btn vz-out" aria-label="Zoom out">&minus;</button>' +
      '<span class="vz-count"></span>' +
      '<button type="button" class="vz-btn vz-in" aria-label="Zoom in">+</button>' +
      '</div>';
    document.body.appendChild(box);
    stage = box.querySelector('.vz-stage');
    img = box.querySelector('.vz-img');
    countEl = box.querySelector('.vz-count');
    prevBtn = box.querySelector('.vz-prev');
    nextBtn = box.querySelector('.vz-next');

    box.querySelector('.vz-close').addEventListener('click', close);
    prevBtn.addEventListener('click', function () { go(idx - 1); });
    nextBtn.addEventListener('click', function () { go(idx + 1); });
    box.querySelector('.vz-in').addEventListener('click', function () { zoomAt(scale * 1.6, 0, 0); });
    box.querySelector('.vz-out').addEventListener('click', function () { zoomAt(scale / 1.6, 0, 0); });

    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var c = center(e.clientX, e.clientY);
      zoomAt(scale * Math.exp(-e.deltaY * 0.0018), c.x, c.y);
    }, { passive: false });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === '+' || e.key === '=') zoomAt(scale * 1.4, 0, 0);
      else if (e.key === '-') zoomAt(scale / 1.4, 0, 0);
    });
  }

  // Coordinates relative to the stage centre.
  function center(cx, cy) {
    var r = stage.getBoundingClientRect();
    return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) };
  }

  function clamp() {
    var r = stage.getBoundingClientRect();
    var mx = Math.max(0, (img.offsetWidth * scale - r.width) / 2);
    var my = Math.max(0, (img.offsetHeight * scale - r.height) / 2);
    tx = Math.min(mx, Math.max(-mx, tx));
    ty = Math.min(my, Math.max(-my, ty));
  }

  function apply() {
    clamp();
    img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
  }

  function zoomAt(newScale, cx, cy) {
    newScale = Math.min(MAX, Math.max(1, newScale));
    if (newScale <= 1.001) { scale = 1; tx = 0; ty = 0; apply(); return; }
    var k = newScale / scale;
    tx = cx - (cx - tx) * k;
    ty = cy - (cy - ty) * k;
    scale = newScale;
    apply();
  }

  function reset() { scale = 1; tx = 0; ty = 0; apply(); }

  function go(i) {
    if (srcs.length < 2) return;
    idx = (i + srcs.length) % srcs.length;
    img.src = srcs[idx];
    countEl.textContent = (idx + 1) + ' / ' + srcs.length;
    reset();
    if (syncMain) {
      // keep the product page's own gallery in sync
      var b = document.querySelector('[data-thumb="' + idx + '"]');
      if (b) b.click();
    }
  }

  function open(list, start, sync) {
    build();
    srcs = list;
    idx = start;
    syncMain = !!sync;
    img.src = srcs[idx];
    countEl.textContent = srcs.length > 1 ? (idx + 1) + ' / ' + srcs.length : '';
    prevBtn.style.display = nextBtn.style.display = srcs.length > 1 ? '' : 'none';
    pointers = {}; pinch = null; panLast = null;
    reset();
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    if (!box) return;
    box.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function onDown(e) {
    stage.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      var a = pointers[ids[0]], b = pointers[ids[1]];
      pinch = { d: dist(a, b), s: scale };
      panLast = null; downInfo = null;
    } else if (ids.length === 1) {
      panLast = { x: e.clientX, y: e.clientY };
      downInfo = { x: e.clientX, y: e.clientY, moved: false, t: Date.now() };
    }
  }

  function onMove(e) {
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2 && pinch) {
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var mid = center((a.x + b.x) / 2, (a.y + b.y) / 2);
      zoomAt(pinch.s * dist(a, b) / pinch.d, mid.x, mid.y);
    } else if (ids.length === 1 && panLast) {
      var dx = e.clientX - panLast.x, dy = e.clientY - panLast.y;
      if (downInfo && Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y) > 8) downInfo.moved = true;
      if (scale > 1) {
        tx += dx; ty += dy; apply();
      }
      panLast = { x: e.clientX, y: e.clientY };
    }
  }

  function onUp(e) {
    var wasSingle = Object.keys(pointers).length === 1;
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) pinch = null;
    if (!wasSingle || !downInfo) return;
    var info = downInfo;
    downInfo = null; panLast = null;
    var dx = e.clientX - info.x, dy = e.clientY - info.y;
    if (info.moved) {
      // swipe to change photo (only when not zoomed in)
      if (scale === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? idx + 1 : idx - 1);
      return;
    }
    // tap — double tap toggles zoom
    var now = Date.now();
    if (now - lastTap < 320 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 30) {
      if (scale > 1) reset();
      else { var c = center(e.clientX, e.clientY); zoomAt(2.5, c.x, c.y); }
      lastTap = 0;
    } else {
      lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
    }
  }

  // ---- Product page: open from the main image (rendered dynamically, so delegate) ----
  var downX = 0, downY = 0;
  document.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-pd-img]');
    if (!t) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return; // was a drag/swipe, not a tap
    var thumbs = Array.prototype.map.call(document.querySelectorAll('[data-thumb] img'), function (i) { return i.getAttribute('src'); });
    var list = thumbs.length ? thumbs : [t.getAttribute('src')];
    var start = list.indexOf(t.getAttribute('src'));
    open(list, start < 0 ? 0 : start, true);
  });

  // ---- Product cards: add a magnifier button to every card photo ----
  var ZOOM_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><line x1="20" y1="20" x2="15.8" y2="15.8"/><line x1="11" y1="8.5" x2="11" y2="13.5"/><line x1="8.5" y1="11" x2="13.5" y2="11"/></svg>';

  function cardImages(card, fallbackSrc) {
    var a = card.querySelector('a[href*="id="]');
    var id = null;
    try { id = a ? new URL(a.getAttribute('href'), location.href).searchParams.get('id') : null; } catch (err) { /* ignore */ }
    var ready = window.velmoraProductsReady;
    if (!id || !ready || !ready.then) return Promise.resolve([fallbackSrc]);
    return ready.then(function (list) {
      var p = (list || []).filter(function (x) { return x.id === id; })[0];
      var imgs = p && Array.isArray(p.images) && p.images.length ? p.images : (p && p.image ? [p.image] : []);
      return imgs.length ? imgs : [fallbackSrc];
    }).catch(function () { return [fallbackSrc]; });
  }

  function decorate() {
    var media = document.querySelectorAll('.product-card .product-media');
    Array.prototype.forEach.call(media, function (m) {
      if (m.querySelector('.vz-card-btn')) return;
      var im = m.querySelector('img');
      if (!im) return; // placeholder gem icon — nothing to zoom
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vz-card-btn';
      btn.setAttribute('aria-label', 'Zoom image');
      btn.innerHTML = ZOOM_SVG;
      btn.addEventListener('click', function (e) {
        e.preventDefault();   // don't follow the card's product link
        e.stopPropagation();
        var card = btn.closest('.product-card');
        var fallback = im.getAttribute('src');
        cardImages(card, fallback).then(function (list) {
          var start = list.indexOf(fallback);
          open(list, start < 0 ? 0 : start, false);
        });
      });
      m.appendChild(btn);
    });
  }

  var scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; decorate(); });
  }

  function initCards() {
    decorate();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCards);
  else initCards();
})();
