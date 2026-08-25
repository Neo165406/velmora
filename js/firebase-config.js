// Firebase config + initialization in one file (matches StrDust's setup —
// one less local file to fetch before Firestore calls can start).
//
// apiKey here is a public client identifier, not a secret — safe to commit.
// Do NOT put a service-account / private key here — that's a different,
// sensitive credential that must never go in client-side code.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyAclDfzJ8BB0zJpE56rjHDUgjHXFcpMP8w",
  authDomain: "velmora-84a4a.firebaseapp.com",
  projectId: "velmora-84a4a",
  storageBucket: "velmora-84a4a.firebasestorage.app",
  messagingSenderId: "42615139718",
  appId: "1:42615139718:web:86cf3dd1de593679de5007"
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let app = null;
let db = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export { db };
