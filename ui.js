// ============================================================
// PRIME KITS STORE — ui.js
// Handles: Nav scroll, hamburger, search, product modal, toasts,
//          scroll animations, CMS text injection from Firestore
// ============================================================

import { getSettings, getProducts } from './store.js';
import { addToCart, syncCartBadge } from './cart.js';

// ── PAGE LOADER ──────────────────────────────────────────────
export function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => loader.classList.add('done'), 600);
}

// ── NAV SCROLL ───────────────────────────────────────────────
export function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── HAMBURGER ────────────────────────────────────────────────
export function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    })
  );
}

// ── SEARCH OVERLAY ───────────────────────────────────────────
let allProducts = [];

export async function initSearch() {
  const toggleBtn = document.getElementById('search-toggle');
  const closeBtn  = document.getElementById('search-close');
  const overlay   = document.getElementById('search-overlay');
  const input     = document.getElementById('search-input');
  const results   = document.getElementById('search-results');
  if (!overlay || !input) return;

  // Prefetch products for instant search
  try { allProducts = await getProducts(); } catch (_) {}

  const open  = () => { overlay.classList.add('open'); input.focus(); };
  const close = () => { overlay.classList.remove('open'); input.value = ''; if (results) results.innerHTML = ''; };

  toggleBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!results) return;
    if (!q) { results.innerHTML = ''; return; }

    const hits = allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!hits.length) {
      results.innerHTML = `<p class="search-no-results">No results for "${input.value}"</p>`;
      return;
    }

    results.innerHTML = hits.map(p => `
      <a class="search-result-item" href="/pages/shop.html?product=${p.id}">
        <img src="${p.images?.[0] || 'assets/placeholder.png'}" alt="${p.name}" loading="lazy" />
        <div class="search-result-info">
          <p class="search-result-name">${p.name}</p>
          <p class="search-result-price">$${Number(p.price).toFixed(2)}</p>
        </div>
      </a>`).join('');
  });
}

// ── TOAST ─────────────────────────────────────────────────────
/**
 * Show a toast notification.
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 */
export function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}"></i>
    <span>${msg}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── PRODUCT MODAL ─────────────────────────────────────────────
let modalProduct = null;

export function openProductModal(product) {
  modalProduct = product;
  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Images
  const mainImg  = document.getElementById('modal-main-img');
  const thumbsEl = document.getElementById('modal-thumbs');
  const images   = product.images?.length ? product.images : ['assets/placeholder.png'];

  if (mainImg) mainImg.src = images[0];
  if (thumbsEl) {
    thumbsEl.innerHTML = images.map((src, i) => `
      <img src="${src}" alt="View ${i+1}" class="modal-thumb ${i === 0 ? 'active' : ''}"
           loading="lazy" data-index="${i}" />`).join('');
    thumbsEl.querySelectorAll('.modal-thumb').forEach(t =>
      t.addEventListener('click', () => {
        if (mainImg) mainImg.src = t.src;
        thumbsEl.querySelectorAll('.modal-thumb').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
      })
    );
  }

  // Info
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
  setText('modal-category', product.category || '');
  setText('modal-title',    product.name     || '');
  setText('modal-price',    `$${Number(product.price).toFixed(2)}`);
  setText('modal-desc',     product.description || '');

  const oldPriceEl = document.getElementById('modal-old-price');
  if (oldPriceEl) {
    if (product.originalPrice && product.originalPrice > product.price) {
      oldPriceEl.textContent = `$${Number(product.originalPrice).toFixed(2)}`;
      oldPriceEl.style.display = '';
    } else {
      oldPriceEl.style.display = 'none';
    }
  }

  // Badges
  const badgeWrap = document.getElementById('modal-badge-wrap');
  if (badgeWrap) {
    badgeWrap.innerHTML = [
      product.isNew  && '<span class="product-badge badge-new">NEW</span>',
      product.isSale && '<span class="product-badge badge-sale">SALE</span>',
      product.isSoldOut && '<span class="product-badge badge-soldout">SOLD OUT</span>'
    ].filter(Boolean).join('');
  }

  // Sizes
  const sizesWrap = document.getElementById('modal-sizes-wrap');
  const sizeGrid  = document.getElementById('modal-size-grid');
  if (sizesWrap && sizeGrid) {
    const sizes = product.sizes || [];
    sizesWrap.style.display = sizes.length ? '' : 'none';
    sizeGrid.innerHTML = sizes.map(s => `
      <button class="size-btn ${product.isSoldOut ? 'disabled' : ''}"
              data-size="${s}" ${product.isSoldOut ? 'disabled' : ''}>${s}</button>`).join('');
    sizeGrid.querySelectorAll('.size-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // Qty
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus  = document.getElementById('qty-plus');
  if (qtyInput) qtyInput.value = 1;
  qtyMinus?.addEventListener('click', () => { if (+qtyInput.value > 1) qtyInput.value--; });
  qtyPlus?.addEventListener('click',  () => { if (+qtyInput.value < 99) qtyInput.value++; });

  // Add to bag
  const addBtn = document.getElementById('modal-add-btn');
  if (addBtn) {
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    if (!product.isSoldOut) {
      newBtn.addEventListener('click', () => {
        const sizes    = product.sizes || [];
        const activeSize = sizeGrid?.querySelector('.size-btn.active')?.dataset.size;
        if (sizes.length && !activeSize) { showToast('Please select a size', 'error'); return; }

        addToCart({
          id:    product.id,
          name:  product.name,
          price: product.price,
          image: product.images?.[0] || '',
          size:  activeSize || '',
          qty:   parseInt(qtyInput?.value || 1)
        });
        syncCartBadge();
        closeProductModal();
        showToast(`${product.name} added to bag!`);
      });
    } else {
      newBtn.textContent = 'SOLD OUT';
      newBtn.disabled = true;
    }
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeProductModal() {
  const modal = document.getElementById('product-modal');
  modal?.classList.remove('open');
  document.body.style.overflow = '';
  modalProduct = null;
}

export function initProductModal() {
  const closeBtn = document.getElementById('modal-close');
  const overlay  = document.getElementById('product-modal');
  closeBtn?.addEventListener('click', closeProductModal);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeProductModal();
  });
}

// ── SCROLL ANIMATIONS ────────────────────────────────────────
export function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll');
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

// ── FOOTER YEAR ──────────────────────────────────────────────
export function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

// ── CMS: Inject Firestore settings into data-cms attributes ──
export async function injectCMSContent() {
  try {
    const [site, contact, socials] = await Promise.all([
      getSettings('site'),
      getSettings('contact'),
      getSettings('socials')
    ]);

    const set = (attr, val) => {
      if (!val) return;
      document.querySelectorAll(`[data-cms="${attr}"]`).forEach(el => {
        el.textContent = val;
      });
    };

    if (site) {
      set('store-name',    site.storeName);
      set('hero-eyebrow',  site.heroEyebrow);
      set('hero-title-line1', site.heroTitle);
      set('hero-subtitle', site.heroSubtitle);
      set('banner-title',  site.bannerTitle);
      set('banner-subtitle', site.bannerSubtitle);
      set('footer-tagline', site.footerTagline);
      set('announcement',  site.announcement);

      const annBar = document.getElementById('announcement-bar');
      if (annBar && site.announcement) annBar.textContent = site.announcement;
    }
    if (contact) {
      set('contact-phone',   contact.phone);
      set('contact-email',   contact.email);
      set('contact-address', contact.address);
    }

    // Social links
    if (socials) {
      const socialMap = {
        instagram: { icon: 'fa-instagram', label: 'Instagram' },
        facebook:  { icon: 'fa-facebook-f', label: 'Facebook' },
        tiktok:    { icon: 'fa-tiktok', label: 'TikTok' },
        telegram:  { icon: 'fa-telegram', label: 'Telegram' },
        twitter:   { icon: 'fa-x-twitter', label: 'X (Twitter)' }
      };
      const html = Object.entries(socialMap)
        .filter(([key]) => socials[key])
        .map(([key, cfg]) => `
          <a href="${socials[key]}" target="_blank" rel="noopener" aria-label="${cfg.label}" class="social-link">
            <i class="fa-brands ${cfg.icon}"></i>
          </a>`).join('');

      ['social-links-strip', 'footer-social', 'mobile-social-links'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      });
    }
  } catch (err) {
    console.warn('[Prime Kits] CMS content could not load:', err.message);
  }
}

// ── PRODUCT CARD BUILDER ─────────────────────────────────────
/**
 * Build a product card HTML string.
 * @param {Object} product
 * @returns {string} HTML
 */
export function buildProductCard(product) {
  const img     = product.images?.[0] || 'assets/placeholder.png';
  const price   = Number(product.price).toFixed(2);
  const oldP    = product.originalPrice ? `<span class="price-old">$${Number(product.originalPrice).toFixed(2)}</span>` : '';
  const badges  = [
    product.isNew     && `<span class="product-badge badge-new">NEW</span>`,
    product.isSale    && `<span class="product-badge badge-sale">SALE</span>`,
    product.isSoldOut && `<span class="product-badge badge-soldout">SOLD OUT</span>`
  ].filter(Boolean).join('');

  return `
    <div class="product-card" data-id="${product.id}">
      <div class="product-card-img-wrap">
        <img src="${img}" alt="${product.name}" class="product-card-img" loading="lazy" />
        ${badges ? `<div class="product-card-badges">${badges}</div>` : ''}
        <button class="product-card-quick" data-id="${product.id}" aria-label="Quick view">
          <i class="fa-solid fa-eye"></i>
        </button>
      </div>
      <div class="product-card-info">
        <p class="product-card-cat">${product.category || ''}</p>
        <h3 class="product-card-name">${product.name}</h3>
        <div class="product-card-price">
          <span class="price-current">$${price}</span>
          ${oldP}
        </div>
      </div>
    </div>`;
}

// ── GLOBAL INIT ──────────────────────────────────────────────
export function initUI() {
  hideLoader();
  initNavScroll();
  initHamburger();
  initProductModal();
  initScrollAnimations();
  setFooterYear();
  injectCMSContent();
  initSearch();
}
