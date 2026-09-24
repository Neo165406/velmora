// ---------------------------------------------------------------
// Velmora buyer accounts — shared across all customer pages
// (loaded by js/nav.js).
//  - Header: a person icon before the hamburger. Signed out -> goes to
//    the sign-in page; signed in -> dropdown with name/email,
//    "My Account" and "Sign out".
//  - Mobile menu: adds "Login / Sign up" (or "My Account" + "Sign out")
//    at the bottom of the slide-out menu.
// ---------------------------------------------------------------
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

function accountIconSVG() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
}

function loginHref() {
  const page = (window.location.pathname.split('/').pop() || 'index.html') + window.location.search;
  return 'login.html?redirect=' + encodeURIComponent(page);
}

async function doSignOut() {
  try { if (auth) await signOut(auth); } catch (err) { console.error('Sign out failed:', err); }
  window.location.href = 'index.html';
}

function initAccount() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight || navRight.querySelector('.account-wrap')) return;

  // Header icon + dropdown
  const wrap = document.createElement('div');
  wrap.className = 'account-wrap';
  wrap.innerHTML =
    '<a href="' + loginHref() + '" class="icon-btn account-toggle" aria-label="Account">' + accountIconSVG() + '</a>' +
    '<div class="account-dropdown">' +
    '<div class="account-name" data-account-name></div>' +
    '<div class="account-email" data-account-email></div>' +
    '<a href="account.html">My Account</a>' +
    '<button type="button" class="account-signout">Sign out</button>' +
    '</div>';
  const hamburger = navRight.querySelector('.hamburger');
  if (hamburger) navRight.insertBefore(wrap, hamburger);
  else navRight.appendChild(wrap);

  const toggle = wrap.querySelector('.account-toggle');
  const dropdown = wrap.querySelector('.account-dropdown');
  const nameEl = wrap.querySelector('[data-account-name]');
  const emailEl = wrap.querySelector('[data-account-email]');
  const navLinks = document.querySelector('.nav-links');

  function onToggleClick(e) {
    e.preventDefault();
    dropdown.classList.toggle('is-open');
  }
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) dropdown.classList.remove('is-open');
  });
  wrap.querySelector('.account-signout').addEventListener('click', doSignOut);

  // Entries in the slide-out mobile menu
  function renderMenu(user) {
    if (!navLinks) return;
    navLinks.querySelectorAll('.nav-account-item').forEach(function (li) { li.remove(); });
    const items = user
      ? [['account.html', 'My Account'], ['#', 'Sign out']]
      : [[loginHref(), 'Login / Sign up']];
    items.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'nav-account-item';
      const a = document.createElement('a');
      a.href = item[0];
      a.textContent = item[1];
      if (item[1] === 'Sign out') a.addEventListener('click', function (e) { e.preventDefault(); doSignOut(); });
      li.appendChild(a);
      navLinks.appendChild(li);
    });
  }

  renderMenu(null);
  if (!auth) return; // Firebase not configured — icon just links to the sign-in page

  onAuthStateChanged(auth, function (user) {
    toggle.removeEventListener('click', onToggleClick);
    if (user) {
      toggle.setAttribute('href', '#');
      toggle.classList.add('is-signed-in');
      nameEl.textContent = user.displayName || 'My account';
      emailEl.textContent = user.email || '';
      toggle.addEventListener('click', onToggleClick);
    } else {
      toggle.setAttribute('href', loginHref());
      toggle.classList.remove('is-signed-in');
      dropdown.classList.remove('is-open');
    }
    renderMenu(user);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAccount);
else initAccount();
