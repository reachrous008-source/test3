// ============================================================
// PRIME KITS STORE — store.js
// Core Firestore data layer
// All product images are stored in Firebase Storage — NOT URLs
// ============================================================

import { db, storage } from './firebase-config.js';
import {
  collection, doc,
  getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ── COLLECTION NAMES ─────────────────────────────────────────
export const COLS = {
  products:   'products',
  categories: 'categories',
  orders:     'orders',
  settings:   'settings',
  shipping:   'shipping'
};

// ══════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════

/** Get a settings document (e.g. 'site', 'contact', 'socials') */
export async function getSettings(docId = 'site') {
  const snap = await getDoc(doc(db, COLS.settings, docId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Merge-update a settings document */
export async function updateSettings(docId, data) {
  await setDoc(
    doc(db, COLS.settings, docId),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Live listener for a settings document */
export function onSettings(docId, callback) {
  return onSnapshot(doc(db, COLS.settings, docId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ══════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════

export async function getCategories() {
  const q = query(collection(db, COLS.categories), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCategory(data) {
  return addDoc(collection(db, COLS.categories), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function updateCategory(id, data) {
  return updateDoc(doc(db, COLS.categories, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCategory(id) {
  return deleteDoc(doc(db, COLS.categories, id));
}

export function onCategories(callback) {
  const q = query(collection(db, COLS.categories), orderBy('order', 'asc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════

/**
 * Fetch products with optional filters.
 * @param {Object} filters - { category, featured, limitTo }
 */
export async function getProducts(filters = {}) {
  const constraints = [orderBy('createdAt', 'desc')];

  if (filters.category && filters.category !== 'all') {
    constraints.unshift(where('category', '==', filters.category));
  }
  if (filters.featured === true) {
    constraints.unshift(where('featured', '==', true));
  }
  if (filters.limitTo) {
    constraints.push(limit(filters.limitTo));
  }

  const q = query(collection(db, COLS.products), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Get a single product by Firestore document ID */
export async function getProduct(id) {
  const snap = await getDoc(doc(db, COLS.products, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Add a new product. Images are uploaded to Firebase Storage first.
 * @param {Object} data - Product data (no images field needed)
 * @param {File[]} imageFiles - Array of File objects from <input type="file">
 */
export async function addProduct(data, imageFiles = []) {
  const imageUrls = [];
  for (const file of imageFiles) {
    const url = await uploadProductImage(file);
    imageUrls.push(url);
  }
  return addDoc(collection(db, COLS.products), {
    ...data,
    images: imageUrls,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Update an existing product. Handles new uploads + removing old images.
 * @param {string} id - Firestore document ID
 * @param {Object} data - Updated product fields (data.images = existing kept URLs)
 * @param {File[]} newImageFiles - New image files to upload
 * @param {string[]} removedUrls - Storage URLs to delete
 */
export async function updateProduct(id, data, newImageFiles = [], removedUrls = []) {
  // 1. Upload new images to Storage
  const newUrls = [];
  for (const file of newImageFiles) {
    const url = await uploadProductImage(file);
    newUrls.push(url);
  }

  // 2. Delete removed images from Storage
  for (const url of removedUrls) {
    try {
      await deleteObject(ref(storage, url));
    } catch (_) { /* ignore missing files */ }
  }

  // 3. Final image list: existing (minus removed) + new
  const existingKept = (data.images || []).filter(u => !removedUrls.includes(u));
  const finalImages  = [...existingKept, ...newUrls];

  return updateDoc(doc(db, COLS.products, id), {
    ...data,
    images: finalImages,
    updatedAt: serverTimestamp()
  });
}

/** Delete a product and all its Storage images */
export async function deleteProduct(id) {
  const product = await getProduct(id);
  if (product?.images?.length) {
    for (const url of product.images) {
      try { await deleteObject(ref(storage, url)); } catch (_) {}
    }
  }
  return deleteDoc(doc(db, COLS.products, id));
}

/** Real-time listener for all products */
export function onProducts(callback) {
  const q = query(collection(db, COLS.products), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/** Real-time listener for featured products only */
export function onFeaturedProducts(callback, max = 8) {
  const q = query(
    collection(db, COLS.products),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════

/**
 * Create a new order document.
 * @param {Object} orderData - { customer, items, total, shippingAgent, paymentProof, etc. }
 */
export async function createOrder(orderData) {
  return addDoc(collection(db, COLS.orders), {
    ...orderData,
    status:    'pending',
    createdAt: serverTimestamp()
  });
}

export async function getOrders() {
  const q = query(collection(db, COLS.orders), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(id, status) {
  return updateDoc(doc(db, COLS.orders, id), {
    status,
    updatedAt: serverTimestamp()
  });
}

export function onOrders(callback) {
  const q = query(collection(db, COLS.orders), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ══════════════════════════════════════════════════════════════
//  SHIPPING AGENTS
// ══════════════════════════════════════════════════════════════

export async function getShippingAgents() {
  const snap = await getDocs(collection(db, COLS.shipping));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addShippingAgent(data) {
  return addDoc(collection(db, COLS.shipping), data);
}

export async function updateShippingAgent(id, data) {
  return updateDoc(doc(db, COLS.shipping, id), data);
}

export async function deleteShippingAgent(id) {
  return deleteDoc(doc(db, COLS.shipping, id));
}

// ══════════════════════════════════════════════════════════════
//  IMAGE UPLOAD — Firebase Storage
// ══════════════════════════════════════════════════════════════

/**
 * Upload a product image to Firebase Storage.
 * Returns the public download URL stored in Firestore.
 * @param {File} file
 * @returns {Promise<string>} download URL
 */
export async function uploadProductImage(file) {
  const ext      = file.name.split('.').pop().toLowerCase();
  const filename = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const imgRef   = ref(storage, filename);
  const snap     = await uploadBytes(imgRef, file);
  return getDownloadURL(snap.ref);
}

/**
 * Generic image uploader for any folder (e.g. 'categories', 'banners').
 * @param {File} file
 * @param {string} folder
 * @returns {Promise<string>} download URL
 */
export async function uploadImage(file, folder = 'uploads') {
  const ext      = file.name.split('.').pop().toLowerCase();
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const imgRef   = ref(storage, filename);
  const snap     = await uploadBytes(imgRef, file);
  return getDownloadURL(snap.ref);
}

// ══════════════════════════════════════════════════════════════
//  SEED DEFAULT SETTINGS — Run once to initialize Firestore
// ══════════════════════════════════════════════════════════════

export async function seedDefaultSettings() {
  await setDoc(doc(db, COLS.settings, 'site'), {
    storeName:      'Prime Kits Store',
    announcement:   '✦ FREE SHIPPING ON ORDERS OVER $50 · AUTHENTIC PREMIUM JERSEYS ✦',
    heroTitle:      'PRIME',
    heroSubtitle:   'Luxury streetwear & premium jerseys, crafted for those who move differently.',
    heroCta:        'SHOP NOW',
    bannerTitle:    'THE PRIME COLLECTION',
    bannerSubtitle: 'Limited edition drops. Only the finest cuts.',
    footerTagline:  'Premium streetwear for the bold.'
  }, { merge: true });

  await setDoc(doc(db, COLS.settings, 'contact'), {
    phone:    '',
    email:    '',
    address:  'Phnom Penh, Cambodia',
    telegram: ''
  }, { merge: true });

  await setDoc(doc(db, COLS.settings, 'socials'), {
    instagram: '',
    facebook:  '',
    tiktok:    '',
    telegram:  ''
  }, { merge: true });

  console.log('[Prime Kits] Default settings seeded ✓');
}
