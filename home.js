// ============================================================
// PRIME KITS STORE — home.js
// Homepage: real-time featured products + categories from Firestore
// ============================================================

import { onFeaturedProducts, onCategories, getProducts } from './store.js';
import { buildProductCard, openProductModal, initUI } from './ui.js';
import { initCart } from './cart.js';

// ── CATEGORIES GRID ──────────────────────────────────────────
function renderCategories(categories) {
  const grid = document.getElementById('home-categories-grid');
  if (!grid) return;

  if (!categories.length) {
    grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1;color:var(--white-dim);">No categories yet.</p>`;
    return;
  }

  grid.innerHTML = categories.slice(0, 4).map(cat => `
    <a class="cat-card animate-on-scroll" href="pages/shop.html?category=${encodeURIComponent(cat.id)}">
      <div class="cat-card-img-wrap">
        <img src="${cat.image || 'assets/placeholder.png'}" alt="${cat.name}" loading="lazy" />
      </div>
      <div class="cat-card-label">
        <h3>${cat.name}</h3>
        <p>${cat.productCount ? `${cat.productCount} items` : 'Shop now'}</p>
      </div>
    </a>`).join('');
}

// ── FEATURED PRODUCTS GRID ───────────────────────────────────
let featuredProducts = [];

function renderFeaturedProducts(products) {
  featuredProducts = products;
  const grid      = document.getElementById('featured-products-grid');
  const filterBar = document.getElementById('home-filter-bar');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <h3>No products yet</h3>
        <p>Check back soon for new drops.</p>
      </div>`;
    return;
  }

  // Build filter chips from unique categories
  if (filterBar) {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    filterBar.innerHTML = `<button class="filter-chip active" data-filter="all">All</button>` +
      cats.map(c => `<button class="filter-chip" data-filter="${c}">${c}</button>`).join('');

    filterBar.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
        populateGrid(grid, filtered);
      });
    });
  }

  populateGrid(grid, products);
}

function populateGrid(grid, products) {
  grid.innerHTML = products.map(p => buildProductCard(p)).join('');

  // Quick-view / click handler
  grid.querySelectorAll('.product-card, .product-card-quick').forEach(el => {
    el.addEventListener('click', e => {
      const id = el.closest('[data-id]')?.dataset.id || el.dataset.id;
      if (!id) return;
      const product = featuredProducts.find(p => p.id === id);
      if (product) openProductModal(product);
    });
  });
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
  initUI();
  initCart();

  // Categories — real-time listener
  onCategories(renderCategories);

  // Featured products — real-time listener (up to 8)
  onFeaturedProducts(renderFeaturedProducts, 8);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
