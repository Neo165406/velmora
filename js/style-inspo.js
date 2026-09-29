// Style Inspo — photos shared by customers.
//  - Customers send a photo from the storefront ("Share your look"); it is saved in
//    Firestore collection `styleInspo` with status 'pending'.
//  - The admin approves photos in Dashboard -> Style Inspo (status 'approved').
//  - The homepage section (#style-inspo) stays hidden until at least one approved photo exists.
import { db, isFirebaseConfigured } from './firebase-config.js';
import { imgbbApiKey } from './imgbb-config.js';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const CACHE_KEY = 'velmora_styleinspo_cache';
const SENT_KEY = 'velmora_styleinspo_sent';
const MAX_SHOWN = 12;
const MAX_PER_DAY = 3;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------- Section: hidden unless there are approved photos ---------- */
const section = document.getElementById('style-inspo');
const list = section ? section.querySelector('[data-si-list]') : null;

function render(items) {
  if (!section || !list) return;
  if (!Array.isArray(items) || !items.length) {
    list.innerHTML = '';
    section.hidden = true;
    return;
  }
  list.innerHTML = items.map(function (it) {
    return '<article class="si-card"><div class="si-main">' +
      '<img src="' + esc(it.image) + '" alt="Velmora style by ' + esc(it.name || 'a customer') + '" loading="lazy">' +
      '<div class="si-cap"><h3>' + esc(it.name || 'Velmora Style') + '</h3>' +
      (it.caption ? '<p>' + esc(it.caption) + '</p>' : '') +
      '</div></div></article>';
  }).join('');
  section.hidden = false;
}

try { render(JSON.parse(localStorage.getItem(CACHE_KEY))); } catch (e) { /* no cache yet */ }

(async function loadApproved() {
  if (!isFirebaseConfigured || !section) return;
  try {
    const snap = await getDocs(query(collection(db, 'styleInspo'), where('status', '==', 'approved')));
    const items = snap.docs.map(function (d) { return d.data(); })
      .filter(function (d) { return d && d.image; })
      .sort(function (a, b) { return ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0); })
      .slice(0, MAX_SHOWN)
      .map(function (d) { return { image: d.image, name: d.name || '', caption: d.caption || '' }; });
    render(items);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable */ }
  } catch (err) {
    console.error('Could not load Style Inspo:', err);
  }
})();

/* ---------- Share modal ---------- */
let overlay = null;

function recentSends() {
  try {
    return (JSON.parse(localStorage.getItem(SENT_KEY)) || []).filter(function (t) { return Date.now() - t < 864e5; });
  } catch (e) { return []; }
}

// Shrinks big phone photos before upload (max 1400px, JPEG).
function shrink(file, max) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not process photo')); }, 'image/jpeg', 0.85);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read photo')); };
    img.src = url;
  });
}

function buildModal() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.className = 'si-overlay';
  overlay.innerHTML =
    '<div class="si-modal" role="dialog" aria-modal="true" aria-label="Share your style">' +
    '<button type="button" class="si-x" data-si-close aria-label="Close">✕</button>' +
    '<div data-si-form>' +
    '<h3>Share your style</h3>' +
    '<p class="si-sub">Wearing Velmora? Send us your photo — it appears on our homepage once our team approves it.</p>' +
    '<div class="si-drop" data-si-drop><span data-si-droplabel>📷 Choose a photo</span></div>' +
    '<input type="file" accept="image/*" data-si-file style="display:none;">' +
    '<label for="si-name">Your name (optional)</label>' +
    '<input type="text" id="si-name" maxlength="60" placeholder="e.g. Nusrat">' +
    '<label for="si-caption">Caption (optional)</label>' +
    '<textarea id="si-caption" rows="2" maxlength="140" placeholder="e.g. My everyday gold look"></textarea>' +
    '<p class="si-note">By sending, you allow Velmora to show this photo on our website.</p>' +
    '<p class="si-status" data-si-status></p>' +
    '<button type="button" class="si-submit" data-si-send>Send photo</button>' +
    '</div>' +
    '<div class="si-thanks" data-si-thanks style="display:none;">' +
    '<h3>Thank you!</h3><p>Your photo was sent. It will show on the homepage once it is approved.</p>' +
    '<button type="button" class="si-submit" data-si-close>Close</button>' +
    '</div></div>';
  document.body.appendChild(overlay);

  const fileInput = overlay.querySelector('[data-si-file]');
  const drop = overlay.querySelector('[data-si-drop]');
  const status = overlay.querySelector('[data-si-status]');
  const sendBtn = overlay.querySelector('[data-si-send]');

  function setStatus(msg, isError) {
    status.textContent = msg || '';
    status.classList.toggle('is-error', !!isError);
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.closest('[data-si-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  drop.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    const f = fileInput.files[0];
    setStatus('');
    if (!f) return;
    if (!/^image\//.test(f.type)) { setStatus('Please choose an image file.', true); fileInput.value = ''; return; }
    const preview = document.createElement('img');
    preview.alt = 'Selected photo';
    preview.src = URL.createObjectURL(f);
    drop.innerHTML = '';
    drop.appendChild(preview);
  });

  sendBtn.addEventListener('click', async function () {
    const file = fileInput.files[0];
    if (!file) { setStatus('Please choose a photo first.', true); return; }
    if (file.size > 15 * 1024 * 1024) { setStatus('That photo is too large (max 15 MB).', true); return; }
    if (recentSends().length >= MAX_PER_DAY) { setStatus('You have shared a few photos today — please try again tomorrow.', true); return; }
    if (!isFirebaseConfigured || !imgbbApiKey) { setStatus('Sharing is not available right now.', true); return; }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    setStatus('');
    try {
      const blob = await shrink(file, 1400);
      const fd = new FormData();
      fd.append('image', blob, 'style.jpg');
      const res = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(imgbbApiKey), { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error((data.error && data.error.message) || 'Upload failed');
      await addDoc(collection(db, 'styleInspo'), {
        image: data.data.url,
        name: overlay.querySelector('#si-name').value.trim().slice(0, 60),
        caption: overlay.querySelector('#si-caption').value.trim().slice(0, 140),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      try { localStorage.setItem(SENT_KEY, JSON.stringify(recentSends().concat(Date.now()))); } catch (e) { /* storage unavailable */ }
      overlay.querySelector('[data-si-form]').style.display = 'none';
      overlay.querySelector('[data-si-thanks]').style.display = 'block';
    } catch (err) {
      console.error('Style Inspo submit failed:', err);
      setStatus('Could not send your photo — please try again.', true);
    }
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send photo';
  });
}

function openModal() {
  buildModal();
  // Reset to a fresh form every time it opens.
  overlay.querySelector('[data-si-form]').style.display = '';
  overlay.querySelector('[data-si-thanks]').style.display = 'none';
  overlay.querySelector('[data-si-file]').value = '';
  overlay.querySelector('[data-si-drop]').innerHTML = '<span data-si-droplabel>📷 Choose a photo</span>';
  overlay.querySelector('#si-name').value = '';
  overlay.querySelector('#si-caption').value = '';
  overlay.querySelector('[data-si-status]').textContent = '';
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
  const t = e.target.closest('[data-si-open]');
  if (!t) return;
  e.preventDefault();
  openModal();
});
