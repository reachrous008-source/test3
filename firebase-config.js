// ============================================================
// PRIME KITS STORE — Firebase Configuration
// ============================================================
// SETUP INSTRUCTIONS:
//   1. Go to Firebase Console → https://console.firebase.google.com
//   2. Create a project or open existing one
//   3. Project Settings → General → Your apps → Web app → Config
//   4. Paste your config values below
//
// SERVICES USED:
//   • Firestore  — Products, Orders, Categories, Settings
//   • Storage    — Product images (NOT external URLs)
//   • Auth       — Admin-only authentication
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ============================================================
// TELEGRAM ORDER NOTIFICATIONS
// Get botToken from @BotFather, chatId from @userinfobot
// ============================================================
export const TELEGRAM_CONFIG = {
  botToken: "YOUR_BOT_TOKEN",
  chatId:   "YOUR_CHAT_ID"
};

// ============================================================
// DO NOT EDIT BELOW — Firebase SDK Initialization
// ============================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app     = initializeApp(FIREBASE_CONFIG);
const db      = getFirestore(app);
const storage = getStorage(app);
const auth    = getAuth(app);

export { app, db, storage, auth };
