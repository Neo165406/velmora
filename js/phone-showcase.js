(function () {
  "use strict";

  var C = window.HERO_SHOWCASE_CONTENT;
  if (!C) return;

  // ---------- Build each phone screen's inner HTML from the content object ----------

  function navHTML(menuId) {
    return (
      '<div class="hs-nav">' +
        '<a href="index.html" class="hs-nav-logo">VEL<span>MORA</span></a>' +
        '<div class="hs-nav-actions">' +
          '<button type="button" class="hs-nav-btn" aria-label="Profile">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>' +
          '</button>' +
          '<button type="button" class="hs-nav-btn hs-nav-menu" aria-label="Open menu" data-hs-menu-open="' + menuId + '">' +
            '<span></span><span></span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="hs-menu" id="' + menuId + '">' +
        '<div class="hs-menu-top">' +
          '<button type="button" class="hs-menu-close" data-hs-menu-close="' + menuId + '" aria-label="Close menu">&times;</button>' +
        '</div>' +
        '<nav class="hs-menu-links">' +
          C.menu.links.map(function (link, i) {
            return '<a href="' + link.href + '" style="transition-delay:' + (0.1 + i * 0.08).toFixed(2) + 's">' + link.label + '</a>';
          }).join("") +
        '</nav>' +
        '<a href="' + C.menu.signInHref + '" class="hs-menu-cta">' + C.menu.signInLabel + '</a>' +
      '</div>'
    );
  }

  function screen1HTML() {
    var s = C.screen1;
    return (
      '<div class="hs-screen">' +
        '<div class="hs-screen-bg"></div>' +
        navHTML("hs-menu-1") +
        '<div class="hs-anim hs-delay-300" style="position:relative; z-index:10; margin-top:16px;">' +
          '<div class="hs-eyebrow"><img src="' + s.eyebrowIconUrl + '" alt=""> <span>' + s.eyebrowLabel + '</span></div>' +
          '<h1 class="hs-title-lg">' + s.titleLine1 + '<br>' + s.titleLine2 + '</h1>' +
        '</div>' +
        '<div class="hs-photo-wrap">' +
          '<img src="' + s.photoUrl + '" alt="" class="hs-photo hs-anim hs-scale-in hs-delay-500">' +
          '<div class="hs-photo-blur"></div>' +
        '</div>' +
        '<div class="hs-screen-bottom">' +
          '<img src="' + s.avatarStripUrl + '" alt="" class="hs-avatar-strip hs-anim hs-delay-700">' +
          '<h2 class="hs-name hs-anim hs-speed-reveal hs-delay-800">' + s.nameLine1 + '<br>' + s.nameLine2 + '</h2>' +
        '</div>' +
      '</div>'
    );
  }

  function screen2HTML() {
    var s = C.screen2;
    return (
      '<div class="hs-screen">' +
        '<div class="hs-screen-bg"></div>' +
        navHTML("hs-menu-2") +
        '<div class="hs-anim hs-delay-400" style="position:relative; z-index:10; margin-top:16px; margin-bottom:16px;">' +
          '<div class="hs-eyebrow"><img src="' + s.eyebrowIconUrl + '" alt=""> <span>' + s.eyebrowLabel + '</span></div>' +
          '<h1 class="hs-title-lg">' + s.titleLine1 + '<br>' + s.titleLine2 + '</h1>' +
        '</div>' +
        '<div class="hs-feature-img-wrap hs-anim hs-scale-in hs-delay-600">' +
          '<img src="' + s.featureImageUrl + '" alt="">' +
        '</div>' +
        '<div class="hs-stats hs-anim hs-delay-800">' +
          '<div class="hs-stats-label"><span>' + s.statsLabel + '</span> <img src="' + s.statsIconUrl + '" alt=""></div>' +
          '<div class="hs-stat-row">' +
            '<div class="hs-stat hs-stat-fade" data-hs-count data-target="' + s.stat1 + '" data-delay="800">0</div>' +
            '<div class="hs-stat-sub">' + s.stat1Label + '</div>' +
          '</div>' +
          '<div class="hs-stat-row">' +
            '<div class="hs-stat hs-stat-fade" data-hs-count data-target="' + s.stat2 + '" data-delay="1000">0</div>' +
            '<div class="hs-stat-sub">' + s.stat2Label + '</div>' +
          '</div>' +
          '<div class="hs-stat-row">' +
            '<div class="hs-stat hs-stat-gold" data-hs-count data-target="' + s.stat3 + '" data-delay="1200">0</div>' +
            '<div class="hs-stat-sub">' + s.stat3Label + '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function screen3HTML() {
    var s = C.screen3;
    return (
      '<div class="hs-screen">' +
        '<div class="hs-screen-bg"></div>' +
        navHTML("hs-menu-3") +
        '<div class="hs-anim hs-delay-300" style="position:absolute; top:100px; left:20px; z-index:10;">' +
          '<div class="hs-eyebrow"><img src="' + s.eyebrowIconUrl + '" alt=""> <span>' + s.eyebrow + '</span></div>' +
          '<h1 class="hs-title-md">' + s.titleLine1 + '<br>' + s.titleLine2 + '</h1>' +
        '</div>' +
        '<div class="hs-anim hs-delay-500" style="position:absolute; top:245px; left:20px; z-index:10;">' +
          '<div class="hs-eyebrow"><img src="' + s.specIconUrl + '" alt=""> <span>' + s.specLabel + '</span></div>' +
          '<div class="hs-spec-value">' + s.specValue + '</div>' +
        '</div>' +
        '<img src="' + s.heroImageUrl + '" alt="" class="hs-hero-img hs-anim hs-fade-slide-left hs-delay-700">' +
        '<div class="hs-cards hs-anim hs-delay-900">' +
          '<div class="hs-card">' +
            '<div class="hs-card-name"><img src="' + s.cardLeft.iconUrl + '" alt=""> <span>' + s.cardLeft.name + '</span></div>' +
            '<img src="' + s.cardLeft.statsImageUrl + '" alt="" class="hs-card-stats-img">' +
            '<div class="hs-card-number">' + s.cardLeft.bigNumber + '</div>' +
          '</div>' +
          '<div class="hs-card">' +
            '<div class="hs-card-name"><img src="' + s.cardRight.iconUrl + '" alt=""> <span>' + s.cardRight.name + '</span></div>' +
            '<img src="' + s.cardRight.statsImageUrl + '" alt="" class="hs-card-stats-img">' +
            '<div class="hs-card-number">' + s.cardRight.bigNumber + '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render() {
    var mount1 = document.querySelectorAll("[data-hs-screen='1']");
    var mount2 = document.querySelectorAll("[data-hs-screen='2']");
    var mount3 = document.querySelectorAll("[data-hs-screen='3']");
    mount1.forEach(function (el) { el.innerHTML = screen1HTML(); });
    mount2.forEach(function (el) { el.innerHTML = screen2HTML(); });
    mount3.forEach(function (el) { el.innerHTML = screen3HTML(); });

    document.querySelectorAll(".hs-screen-bg").forEach(function (el) {
      el.style.backgroundImage = "url('" + C.background.imageUrl + "')";
    });
  }

  // ---------- Phone frame scaling: fit fixed 390×844 content to the frame width ----------

  function setupPhoneScaling() {
    var CONTENT_WIDTH = 390;
    document.querySelectorAll(".hs-phone-screen").forEach(function (screenEl) {
      var contentEl = screenEl.querySelector(".hs-phone-content");
      if (!contentEl) return;

      function updateScale() {
        var width = screenEl.getBoundingClientRect().width;
        var scale = width / CONTENT_WIDTH;
        contentEl.style.transform = "scale(" + scale + ")";
      }

      if ("ResizeObserver" in window) {
        new ResizeObserver(updateScale).observe(screenEl);
      } else {
        window.addEventListener("resize", updateScale);
      }
      updateScale();
    });
  }

  // ---------- Menu open/close ----------

  function setupMenus() {
    document.addEventListener("click", function (e) {
      var openBtn = e.target.closest("[data-hs-menu-open]");
      if (openBtn) {
        var id = openBtn.getAttribute("data-hs-menu-open");
        var menu = document.getElementById(id);
        if (menu) menu.classList.add("is-open");
      }
      var closeBtn = e.target.closest("[data-hs-menu-close]");
      if (closeBtn) {
        var closeId = closeBtn.getAttribute("data-hs-menu-close");
        var closeMenu = document.getElementById(closeId);
        if (closeMenu) closeMenu.classList.remove("is-open");
      }
    });
  }

  // ---------- Count-up numbers (cubic ease-out) ----------

  function setupCountUp() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll("[data-hs-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-target")) || 0;
      var delay = parseInt(el.getAttribute("data-delay"), 10) || 0;
      var duration = 2200;

      if (reduceMotion) {
        el.textContent = target;
        return;
      }

      setTimeout(function () {
        var start = null;
        function tick(now) {
          if (start === null) start = now;
          var elapsed = now - start;
          var t = Math.min(elapsed / duration, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(eased * target);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, delay);
    });
  }

  // ---------- Trigger entrance animations once the section is visible ----------

  function setupEntranceAnimations() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      document.querySelectorAll(".hs-anim").forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var hero = document.getElementById("hs-hero");
    if (!hero) return;

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".hs-anim").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          document.querySelectorAll(".hs-anim").forEach(function (el) { el.classList.add("is-in"); });
          io.disconnect();
        }
      });
    }, { threshold: 0.15 });
    io.observe(hero);
  }

  document.addEventListener("DOMContentLoaded", function () {
    render();
    setupPhoneScaling();
    setupMenus();
    setupCountUp();
    setupEntranceAnimations();
  });
})();
