// ---------------------------------------------------------------
// Velmora account/login nav icon — shared across all customer pages.
// Injects a person icon into the header's .nav-right (right before
// the hamburger button): links to login.html when signed out, and
// opens an email + "Sign out" dropdown when signed in.
// ---------------------------------------------------------------
import { auth } from './firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

function accountIconSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>`;
}

function buildAccountWrap() {
  const wrap = document.createElement('div');
  wrap.className = 'account-wrap';
  wrap.innerHTML = `
    <a href="login.html" class="icon-btn account-toggle" aria-label="Account">${accountIconSVG()}</a>
    <div class="account-dropdown" data-account-dropdown>
      <div class="account-email" data-account-email></div>
      <button type="button" class="account-signout" data-account-signout>Sign out</button>
    </div>`;
  return wrap;
}

document.addEventListener('DOMContentLoaded', function () {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const hamburger = navRight.querySelector('.hamburger');
  const wrap = buildAccountWrap();
  if (hamburger) navRight.insertBefore(wrap, hamburger);
  else navRight.appendChild(wrap);

  const toggle = wrap.querySelector('.account-toggle');
  const dropdown = wrap.querySelector('[data-account-dropdown]');
  const emailEl = wrap.querySelector('[data-account-email]');
  const signOutBtn = wrap.querySelector('[data-account-signout]');

  function closeDropdown() { dropdown.classList.remove('is-open'); }

  function onToggleClick(e) {
    e.preventDefault();
    dropdown.classList.toggle('is-open');
  }

  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  if (!auth) return; // Firebase not configured yet — icon just links to login.html

  onAuthStateChanged(auth, function (user) {
    toggle.removeEventListener('click', onToggleClick);
    if (user) {
      toggle.setAttribute('href', '#');
      toggle.classList.add('is-signed-in');
      emailEl.textContent = user.email || 'Signed in';
      toggle.addEventListener('click', onToggleClick);
    } else {
      toggle.setAttribute('href', 'login.html');
      toggle.classList.remove('is-signed-in');
      closeDropdown();
    }
  });

  signOutBtn.addEventListener('click', async function () {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    closeDropdown();
    window.location.href = 'index.html';
  });
});
