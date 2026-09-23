// Auto-scrolls the category strip by nudging scrollLeft each frame.
// Pause/resume is driven by the Pointer Events API with pointerType
// checks (not mouseenter/mouseleave + touchstart/touchend together) —
// mobile browsers fire a synthetic "ghost" mouseenter ~300ms after a
// real touchend for compatibility, and with separate mouse/touch
// listeners that ghost event re-paused the strip with no matching
// mouseleave ever coming, freezing it after a single tap. Checking
// pointerType avoids that conflict entirely.
document.addEventListener('DOMContentLoaded', function () {
  const strip = document.querySelector('.category-strip');
  const track = document.getElementById('category-track');
  if (!strip || !track) return;

  let paused = false;
  let resumeTimer = null;
  const SPEED = 0.5; // px per animation frame

  function step() {
    if (!paused) {
      strip.scrollLeft += SPEED;
      // The circle set is duplicated in the markup, so looping back
      // once we pass the halfway point keeps the scroll seamless.
      const halfWidth = track.scrollWidth / 2;
      if (strip.scrollLeft >= halfWidth) strip.scrollLeft -= halfWidth;
    }
    requestAnimationFrame(step);
  }
  function pause() {
    paused = true;
    clearTimeout(resumeTimer);
  }
  function resumeSoon(delay) {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(function () { paused = false; }, delay);
  }

  if (window.PointerEvent) {
    // Real mouse hover (desktop) — pause while hovered, resume on leave.
    strip.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') pause();
    });
    strip.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') resumeSoon(0);
    });
    // Touch/pen — pause while actively touching, resume shortly after
    // release instead of relying on a hover state that never clears.
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') pause();
    });
    strip.addEventListener('pointerup', function (e) {
      if (e.pointerType !== 'mouse') resumeSoon(1200);
    });
    strip.addEventListener('pointercancel', function (e) {
      if (e.pointerType !== 'mouse') resumeSoon(1200);
    });
  } else {
    // Very old browsers with no Pointer Events support are desktop-only
    // in practice, so plain mouse events are safe here.
    strip.addEventListener('mouseenter', pause);
    strip.addEventListener('mouseleave', function () { resumeSoon(0); });
  }

  step();
});
