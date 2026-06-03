/* ============================================================
   PRIME KITS PREMIUM — LUXURY JERSEY STORE
   script.js — Full Feature Set
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────────────────
let products  = JSON.parse(localStorage.getItem('pk_products'))  || getSampleProducts();
let orders    = JSON.parse(localStorage.getItem('pk_orders'))    || [];
let cart      = JSON.parse(localStorage.getItem('pk_cart'))      || [];
let wishlist  = JSON.parse(localStorage.getItem('pk_wishlist'))  || [];
let tgSettings = JSON.parse(localStorage.getItem('pk_tg')) || { token: '', chatId: '' };
let paySettings = JSON.parse(localStorage.getItem('pk_pay')) || { abaUrl: '', acledaUrl: '' };

let currentFilter  = 'all';
let currentSearch  = '';
let currentSort    = 'default';
let currentProduct = null;
let currentPayment = null;
let currentScreenshotB64 = null;
let editingProductId = null;

// ── SAMPLE PRODUCTS ──────────────────────────────────────────────────────
function getSampleProducts() {
  return [
    {
      id: 'p1', name: 'Brazil Home 2026', price: 49.99, originalPrice: null,
      description: 'The iconic yellow and green kit of the Seleção. Premium breathable fabric, slim fit, authentic crest embroidery. Crafted for real fans of the five-time world champions.',
      category: 'national', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80',
      stock: 'in-stock', tags: ['featured', 'bestseller'],
      rating: 4.8, reviews: [
        { author: 'Sophea K.', stars: 5, text: 'Perfect fit, great quality. Arrived quickly!' },
        { author: 'Dara M.', stars: 5, text: 'Exactly as described. Love it!' },
      ]
    },
    {
      id: 'p2', name: 'Manchester City Home 2025', price: 54.99, originalPrice: 64.99,
      description: 'Sky blue domination. The Citizens\' iconic home strip featuring moisture-wicking technology and embroidered badge. Champions League edition.',
      category: 'club', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      stock: 'in-stock', tags: ['new'],
      rating: 4.6, reviews: [
        { author: 'Piseth R.', stars: 5, text: 'Great quality for the price. Highly recommend.' },
      ]
    },
    {
      id: 'p3', name: 'France World Cup 1998', price: 39.99, originalPrice: null,
      description: 'Retro classic celebrating Les Bleus\' first World Cup glory. 100% cotton construction, vintage badge, all-time iconic blue. A collector\'s piece.',
      category: 'retro', image: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=600&q=80',
      stock: 'low-stock', tags: ['retro'],
      rating: 4.9, reviews: [
        { author: 'Veasna T.', stars: 5, text: 'Incredible retro piece. Quality is superb.' },
        { author: 'Chantha B.', stars: 5, text: 'The best retro kit I own. Worth every cent.' },
      ]
    },
    {
      id: 'p4', name: 'Argentina World Cup 2022', price: 52.99, originalPrice: null,
      description: 'The famous light-blue-and-white stripes of La Albiceleste. Champion edition with three-star embroidery celebrating their Qatar 2022 triumph.',
      category: 'national', image: 'https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=600&q=80',
      stock: 'in-stock', tags: ['bestseller', 'featured'],
      rating: 4.9, reviews: [
        { author: 'Sokha L.', stars: 5, text: 'Amazing quality. The stars look brilliant.' },
      ]
    },
    {
      id: 'p5', name: 'Real Madrid Home 2025/26', price: 57.99, originalPrice: null,
      description: 'Los Blancos\' iconic all-white home strip. Dri-FIT ADV technology, 15x Champions League edition with golden crown crest detail.',
      category: 'club', image: 'https://images.unsplash.com/photo-1556906781-9a414e2a7735?w=600&q=80',
      stock: 'in-stock', tags: ['featured', 'new'],
      rating: 4.7, reviews: [
        { author: 'Ratha P.', stars: 5, text: 'Lightweight and fits perfectly. Excellent!' },
      ]
    },
    {
      id: 'p6', name: 'AC Milan 1994 Retro', price: 44.99, originalPrice: 55.00,
      description: 'Timeless black and red. Relive the Sacchi-era dominance with this premium retro kit. Limited run collector\'s edition with era-accurate badge.',
      category: 'retro', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
      stock: 'low-stock', tags: ['retro', 'bestseller'],
      rating: 4.8, reviews: []
    },
    {
      id: 'p7', name: 'Japan Away 2024/25', price: 47.99, originalPrice: null,
      description: 'The Samurai Blue\'s stunning navy away strip with subtle wave pattern. Premium polyester blend, slim modern fit.',
      category: 'national', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80',
      stock: 'in-stock', tags: ['new'],
      rating: 4.5, reviews: []
    },
    {
      id: 'p8', name: 'Football Culture Tee', price: 29.99, originalPrice: null,
      description: 'Premium streetwear meets football culture. Heavyweight 280gsm cotton, oversized fit, embroidered Prime Kits crown logo.',
      category: 'streetwear', image: 'https://images.unsplash.com/photo-1503341338985-95ad9862b40a?w=600&q=80',
      stock: 'in-stock', tags: ['new', 'featured'],
      rating: 4.6, reviews: []
    },
  ];
}

// ── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initScrollHeader();
  initScrollAnimations();
  initSearch();
  initFilterTabs();
  initSort();
  initHamburger();
  renderProducts();
  renderFeatured();
  renderBestSellers();
  renderNewArrivals();
  renderCartCount();
  renderWishlistCount();
  renderOrders();
  renderAdminProducts();
  loadSettings();

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('wishlistBtn').addEventListener('click', openWishlist);
  document.getElementById('adminToggle').addEventListener('click', toggleAdmin);
  document.getElementById('searchToggle').addEventListener('click', toggleSearch);

  // Qty live update in order form
  ['orderQty'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateOrderTotal);
  });
});

// ── LOADING SCREEN ───────────────────────────────────────────────────────
function initLoadingScreen() {
  const screen = document.getElementById('loadingScreen');
  const fill   = document.getElementById('loaderFill');

  setTimeout(() => { fill.style.width = '100%'; }, 100);
  setTimeout(() => {
    screen.classList.add('hidden');
    document.body.style.overflow = '';
  }, 1800);

  document.body.style.overflow = 'hidden';
}

// ── SCROLL HEADER ────────────────────────────────────────────────────────
function initScrollHeader() {
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── SCROLL ANIMATIONS ────────────────────────────────────────────────────
function initScrollAnimations() {
  const els = document.querySelectorAll('[data-scroll]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// ── SEARCH ───────────────────────────────────────────────────────────────
function initSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar) return;
  bar.addEventListener('input', () => {
    currentSearch = bar.value;
    renderProducts();
  });
}

function toggleSearch() {
  const exp = document.getElementById('searchExpanded');
  exp.classList.toggle('open');
  if (exp.classList.contains('open')) {
    setTimeout(() => document.getElementById('searchBar').focus(), 300);
  }
}

function closeSearch() {
  document.getElementById('searchExpanded').classList.remove('open');
}

// ── FILTER TABS ──────────────────────────────────────────────────────────
function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderProducts();
    });
  });
}

function filterByCategory(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderProducts();
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

// ── SORT ─────────────────────────────────────────────────────────────────
function initSort() {
  const sel = document.getElementById('sortSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    currentSort = sel.value;
    renderProducts();
  });
}

function applySort(arr) {
  const list = [...arr];
  switch (currentSort) {
    case 'price-asc':  return list.sort((a, b) => a.price - b.price);
    case 'price-desc': return list.sort((a, b) => b.price - a.price);
    case 'name':       return list.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':     return list.reverse();
    default:           return list;
  }
}

// ── RENDER PRODUCTS ──────────────────────────────────────────────────────
function getFilteredProducts() {
  const q = currentSearch.toLowerCase().trim();
  return products.filter(p => {
    const matchCat    = currentFilter === 'all' || p.category === currentFilter;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
}

function renderProducts() {
  const grid  = document.getElementById('productGrid');
  const empty = document.getElementById('emptyShop');
  let filtered = applySort(getFilteredProducts());

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = filtered.map(p => productCardHTML(p, true)).join('');
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = products.filter(p => p.tags && p.tags.includes('featured')).slice(0, 3);
  if (!featured.length) {
    grid.innerHTML = products.slice(0, 3).map(p => productCardHTML(p, false)).join('');
  } else {
    grid.innerHTML = featured.map(p => productCardHTML(p, false)).join('');
  }
}

function renderBestSellers() {
  const grid = document.getElementById('bestSellersGrid');
  if (!grid) return;
  const bs = products.filter(p => p.tags && p.tags.includes('bestseller')).slice(0, 3);
  if (!bs.length) {
    grid.innerHTML = products.slice(0, 3).map(p => productCardHTML(p, false)).join('');
  } else {
    grid.innerHTML = bs.map(p => productCardHTML(p, false)).join('');
  }
}

function renderNewArrivals() {
  const grid = document.getElementById('newArrivalsGrid');
  if (!grid) return;
  const newItems = products.filter(p => p.tags && p.tags.includes('new')).slice(0, 3);
  if (!newItems.length) {
    grid.innerHTML = products.slice(-3).map(p => productCardHTML(p, false)).join('');
  } else {
    grid.innerHTML = newItems.map(p => productCardHTML(p, false)).join('');
  }
}

function productCardHTML(p, showAnim) {
  const wishlisted = wishlist.includes(p.id);
  const stars = starsHTML(p.rating || 0);
  const reviewCount = (p.reviews || []).length;

  const tagBadge = (() => {
    if (!p.tags || !p.tags.length) return '';
    if (p.tags.includes('new')) return '<span class="tag-badge new">NEW</span>';
    if (p.tags.includes('bestseller')) return '<span class="tag-badge bestseller">BEST SELLER</span>';
    if (p.tags.includes('featured')) return '<span class="tag-badge featured">FEATURED</span>';
    return '';
  })();

  const stockBadge = (() => {
    if (p.stock === 'out-of-stock') return '<span class="stock-badge out-of-stock">OUT OF STOCK</span>';
    if (p.stock === 'low-stock') return '<span class="stock-badge low-stock">LOW STOCK</span>';
    return '';
  })();

  const saleTag = p.originalPrice ? '<span class="tag-badge sale" style="top:60px;right:12px">SALE</span>' : '';

  return `
    <div class="product-card" onclick="openProduct('${p.id}')">
      <div class="product-image-wrap">
        ${p.image
          ? `<img src="${escHtml(p.image)}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'><span>👕</span><p>No Image</p></div>'" />`
          : `<div class="no-image"><span>👕</span><p>No Image</p></div>`
        }
        <span class="cat-badge">${p.category}</span>
        ${tagBadge}
        ${stockBadge}
        ${saleTag}
        <div class="product-overlay-btns">
          <button class="overlay-btn primary" onclick="event.stopPropagation(); openProduct('${p.id}')">VIEW DETAILS</button>
          <button class="overlay-btn icon-only${wishlisted ? ' wishlisted' : ''}" title="Wishlist" onclick="event.stopPropagation(); toggleWishlist('${p.id}', this)">♥</button>
          <button class="overlay-btn icon-only" title="Add to cart" onclick="event.stopPropagation(); addToCart('${p.id}')">🛒</button>
        </div>
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <p class="product-name">${escHtml(p.name)}</p>
        <div class="product-price-row">
          <span class="product-price">$${Number(p.price).toFixed(2)}</span>
          ${p.originalPrice ? `<span class="product-orig-price">$${Number(p.originalPrice).toFixed(2)}</span>` : ''}
        </div>
        ${reviewCount > 0 ? `
          <div class="product-rating">
            <span class="stars">${stars}</span>
            <span class="rating-count">(${reviewCount})</span>
          </div>` : ''
        }
      </div>
    </div>
  `;
}

function starsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half) s += '½';
  for (let i = full + (half ? 1 : 0); i < 5; i++) s += '☆';
  return s;
}

// ── PRODUCT MODAL ────────────────────────────────────────────────────────
function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;

  const wishlisted = wishlist.includes(p.id);
  const stockClass = p.stock === 'in-stock' ? 'in' : p.stock === 'low-stock' ? 'low' : 'out';
  const stockLabel = p.stock === 'in-stock' ? '✓ In Stock' : p.stock === 'low-stock' ? '⚠ Low Stock — Order Soon' : '✕ Out of Stock';
  const reviews = p.reviews || [];
  const reviewsHTML = reviews.length > 0 ? `
    <div class="modal-reviews">
      <h4>Customer Reviews (${reviews.length})</h4>
      ${reviews.map(r => `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${escHtml(r.author)}</span>
            <span class="review-stars">${starsHTML(r.stars)}</span>
          </div>
          <p class="review-text">${escHtml(r.text)}</p>
        </div>
      `).join('')}
    </div>
  ` : '';

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-img-wrap">
      ${p.image
        ? `<img src="${escHtml(p.image)}" alt="${escHtml(p.name)}" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'><span>👕</span></div>'" />`
        : `<div class="no-image"><span>👕</span></div>`
      }
    </div>
    <div class="modal-details">
      <p class="modal-cat">${p.category}</p>
      <h2 class="modal-name">${escHtml(p.name)}</h2>
      <div class="modal-price-wrap">
        <span class="modal-price">$${Number(p.price).toFixed(2)}</span>
        ${p.originalPrice ? `<span class="modal-orig-price">$${Number(p.originalPrice).toFixed(2)}</span>` : ''}
      </div>
      ${p.rating ? `<div class="modal-rating"><span class="stars">${starsHTML(p.rating)}</span><span style="font-size:13px;color:var(--gray)">${p.rating}/5</span></div>` : ''}
      <p class="modal-stock ${stockClass}">${stockLabel}</p>
      <p class="modal-desc">${escHtml(p.description || 'Premium quality football jersey.')}</p>
      ${reviewsHTML}
      <div class="modal-actions">
        ${p.stock !== 'out-of-stock'
          ? `<button class="btn-gold" onclick="openOrderModal('${p.id}')">ORDER NOW →</button>
             <button class="btn-ghost" onclick="addToCart('${p.id}'); closeProductModal()">ADD TO CART 🛒</button>`
          : `<button class="btn-ghost" style="opacity:0.5" disabled>OUT OF STOCK</button>`
        }
        <button class="btn-ghost" style="color:${wishlisted ? '#e74c3c' : 'inherit'}" onclick="toggleWishlist('${p.id}', this)">
          ${wishlisted ? '♥ IN WISHLIST' : '♡ ADD TO WISHLIST'}
        </button>
      </div>
    </div>
  `;

  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('productModal')) closeProductModal();
}
function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── ORDER MODAL ──────────────────────────────────────────────────────────
function openOrderModal(id) {
  const p = products.find(x => x.id === id) || currentProduct;
  if (!p) return;
  currentProduct = p;
  currentPayment = null;
  currentScreenshotB64 = null;

  closeProductModal();

  document.getElementById('orderProductName').textContent = p.name + ' — $' + Number(p.price).toFixed(2);
  document.getElementById('orderTotal').textContent = '$' + Number(p.price).toFixed(2);

  // Reset steps
  document.getElementById('orderStep1').style.display = '';
  document.getElementById('orderStep2').style.display = 'none';
  document.getElementById('orderStep3').style.display = 'none';

  // Clear payment state
  document.getElementById('qrDisplay').style.display = 'none';
  document.getElementById('visaInfo').style.display = 'none';
  document.getElementById('screenshotUpload').style.display = 'none';
  document.getElementById('payStepActions').style.display = 'none';
  document.querySelectorAll('.pay-option').forEach(b => b.classList.remove('selected'));
  clearScreenshot();

  document.getElementById('orderModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function updateOrderTotal() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('orderQty').value) || 1;
  const total = (qty * currentProduct.price).toFixed(2);
  document.getElementById('orderTotal').textContent = '$' + total;
  document.getElementById('qrAmount').textContent = '$' + total;
}

function goToPaymentStep(e) {
  e.preventDefault();
  document.getElementById('orderStep1').style.display = 'none';
  document.getElementById('orderStep2').style.display = '';
  updateOrderTotal();
}

function goBackToStep1() {
  document.getElementById('orderStep1').style.display = '';
  document.getElementById('orderStep2').style.display = 'none';
}

function selectPayment(method) {
  currentPayment = method;
  document.querySelectorAll('.pay-option').forEach(b => b.classList.remove('selected'));
  document.getElementById('payOpt' + method.charAt(0).toUpperCase() + method.slice(1)).classList.add('selected');

  const qty = parseInt(document.getElementById('orderQty').value) || 1;
  const total = (qty * currentProduct.price).toFixed(2);

  const qrDisplay = document.getElementById('qrDisplay');
  const visaInfo  = document.getElementById('visaInfo');
  const ssUpload  = document.getElementById('screenshotUpload');
  const actions   = document.getElementById('payStepActions');
  const qrAmount  = document.getElementById('qrAmount');

  qrDisplay.style.display = 'none';
  visaInfo.style.display  = 'none';
  ssUpload.style.display  = 'none';

  qrAmount.textContent = '$' + total;

  if (method === 'visa') {
    visaInfo.style.display = '';
    actions.style.display  = '';
  } else {
    const qrBox = document.getElementById('qrBox');
    const qrUrl = method === 'aba' ? paySettings.abaUrl : paySettings.acledaUrl;

    if (qrUrl) {
      qrBox.innerHTML = `<img src="${escHtml(qrUrl)}" alt="QR Code" />`;
    } else {
      qrBox.innerHTML = `<div class="qr-placeholder"><span>⬛</span><span>${method.toUpperCase()} QR</span><span style="font-size:11px;color:#999">Set in Admin > Settings</span></div>`;
    }

    qrDisplay.style.display  = '';
    ssUpload.style.display   = '';
    actions.style.display    = '';
  }
}

function previewScreenshot(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentScreenshotB64 = e.target.result;
    document.getElementById('screenshotImg').src = e.target.result;
    document.getElementById('screenshotPreview').style.display = '';
    document.getElementById('fileDrop').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearScreenshot() {
  currentScreenshotB64 = null;
  document.getElementById('screenshotPreview').style.display = 'none';
  document.getElementById('fileDrop').style.display = '';
  const input = document.getElementById('screenshotFile');
  if (input) input.value = '';
}

function confirmPaymentAndSubmit() {
  if (!currentProduct) return;
  if (!currentPayment) { showFlash('⚠ Please select a payment method'); return; }
  if ((currentPayment === 'aba' || currentPayment === 'acleda') && !currentScreenshotB64) {
    showFlash('⚠ Please upload your payment screenshot'); return;
  }

  const name     = document.getElementById('orderName').value.trim();
  const phone    = document.getElementById('orderPhone').value.trim();
  const qty      = parseInt(document.getElementById('orderQty').value) || 1;
  const size     = document.getElementById('orderSize').value;
  const location = document.getElementById('orderLocation').value.trim();
  const notes    = document.getElementById('orderNotes').value.trim();
  const total    = (qty * currentProduct.price).toFixed(2);
  const orderId  = 'PK-' + Date.now().toString(36).toUpperCase();

  const order = {
    id: orderId,
    date: new Date().toLocaleString(),
    productId: currentProduct.id,
    productName: currentProduct.name,
    price: currentProduct.price,
    qty, total, name, phone, size, location, notes,
    paymentMethod: currentPayment,
    paymentProof: currentScreenshotB64 || null,
    status: 'pending',
  };

  orders.unshift(order);
  localStorage.setItem('pk_orders', JSON.stringify(orders));
  renderOrders();
  renderAdminProducts();

  // Telegram notification
  sendTelegramNotification(order);

  // Success screen
  document.getElementById('orderStep2').style.display = 'none';
  document.getElementById('orderStep3').style.display = '';
  document.getElementById('successOrderRef').textContent = 'Order #' + orderId;

  // Clear cart if checkout came from cart
  showFlash('✓ Order #' + orderId + ' placed!');
}

function closeOrderModal(e) {
  if (e && e.target !== document.getElementById('orderModal')) return;
  _closeOrderModal();
}
function _closeOrderModal() {
  document.getElementById('orderModal').classList.remove('open');
  document.body.style.overflow = '';
}
// Close button
document.addEventListener('DOMContentLoaded', () => {
  const om = document.getElementById('orderModal');
  if (om) om.addEventListener('click', (e) => {
    if (e.target === om) _closeOrderModal();
  });
});

// ── TELEGRAM ─────────────────────────────────────────────────────────────
async function sendTelegramNotification(order) {
  const { token, chatId } = tgSettings;
  if (!token || !chatId) return;

  const payLabel = { aba: 'ABA Bank', acleda: 'ACLEDA Bank', visa: 'Visa Card' }[order.paymentMethod] || order.paymentMethod;

  const msg = `
🛍 *NEW ORDER — PRIME KITS*

📋 *Order:* \`${order.id}\`
📅 *Date:* ${order.date}

👤 *Customer:* ${order.name}
📞 *Phone:* ${order.phone}

🏷 *Product:* ${order.productName}
📏 *Size:* ${order.size || 'N/A'}
🔢 *Qty:* ${order.qty}
💰 *Total:* $${order.total}

💳 *Payment:* ${payLabel}
📍 *Address:* ${order.location}
${order.notes ? `📝 *Notes:* ${order.notes}` : ''}
${order.paymentProof ? '\n📷 Screenshot attached below' : ''}
  `.trim();

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' }),
    });

    // Send payment proof photo if available
    if (order.paymentProof && order.paymentProof.startsWith('data:')) {
      const blob = await (await fetch(order.paymentProof)).blob();
      const fd   = new FormData();
      fd.append('chat_id', chatId);
      fd.append('photo', blob, 'payment-proof.jpg');
      fd.append('caption', 'Payment proof for Order ' + order.id);
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd });
    }
  } catch (err) {
    console.warn('Telegram notification failed:', err);
  }
}

// ── ORDERS (ADMIN) ───────────────────────────────────────────────────────
function renderOrders() {
  const list = document.getElementById('orderList');
  if (!list) return;

  if (orders.length === 0) {
    list.innerHTML = '<p class="empty-msg">No orders yet.</p>';
    return;
  }

  const payLabel = { aba: 'ABA Bank', acleda: 'ACLEDA Bank', visa: 'Visa / Card' };
  const statusOpts = ['pending', 'confirmed', 'shipped'];

  list.innerHTML = orders.map((o, idx) => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-id">#${escHtml(o.id)}</span>
        <span class="order-date">${escHtml(o.date)}</span>
        <span class="order-total-display">$${o.total}</span>
        <select class="order-status ${o.status || 'pending'}" onchange="updateOrderStatus(${idx}, this.value)" style="background:transparent;border:1px solid rgba(201,168,76,0.3);color:var(--gold);font-family:var(--font-cond);font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:3px;cursor:pointer;outline:none">
          ${statusOpts.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''} style="background:var(--dark)">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="order-items">
        <p class="order-line"><strong>${escHtml(o.productName)}</strong> × ${o.qty} ${o.size ? `(${o.size})` : ''}</p>
      </div>
      <div class="order-meta">
        <span>👤 ${escHtml(o.name)}</span>
        <span>📞 ${escHtml(o.phone)}</span>
        <span>💳 ${payLabel[o.paymentMethod] || o.paymentMethod || '—'}</span>
      </div>
      <div class="order-meta">
        <span>📍 ${escHtml(o.location)}</span>
      </div>
      ${o.notes ? `<div class="order-meta"><span>📝 ${escHtml(o.notes)}</span></div>` : ''}
      ${o.paymentProof ? `
        <div class="order-payment-proof">
          <p style="font-size:12px;color:var(--gray);margin-bottom:6px">Payment Screenshot:</p>
          <img src="${o.paymentProof}" alt="Payment proof" onclick="window.open(this.src)" style="cursor:pointer" />
        </div>` : ''
      }
    </div>
  `).join('');
}

function updateOrderStatus(idx, status) {
  orders[idx].status = status;
  localStorage.setItem('pk_orders', JSON.stringify(orders));
}

function clearOrders() {
  if (!confirm('Clear all orders?')) return;
  orders = [];
  localStorage.setItem('pk_orders', JSON.stringify(orders));
  renderOrders();
}

// ── ADMIN PRODUCTS ───────────────────────────────────────────────────────
function renderAdminProducts() {
  const list = document.getElementById('adminProductList');
  if (!list) return;
  if (!products.length) { list.innerHTML = '<p class="empty-msg">No products yet.</p>'; return; }

  list.innerHTML = `
    <h3 style="font-family:var(--font-cond);font-size:13px;letter-spacing:3px;color:var(--gray);text-transform:uppercase;margin-bottom:16px">ALL PRODUCTS (${products.length})</h3>
    ${products.map(p => `
      <div class="admin-product-item">
        ${p.image
          ? `<img class="admin-prod-img" src="${escHtml(p.image)}" alt="${escHtml(p.name)}" onerror="this.style.display='none'" />`
          : `<div class="admin-prod-img" style="display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0.3">👕</div>`
        }
        <div class="admin-prod-info">
          <p class="admin-prod-name">${escHtml(p.name)}</p>
          <p class="admin-prod-meta">$${Number(p.price).toFixed(2)} · ${p.category} · ${(p.stock || 'in-stock').replace('-', ' ')} · ${(p.tags || []).join(', ') || 'no tags'}</p>
        </div>
        <div class="admin-prod-actions">
          <button class="admin-btn-edit" onclick="editProduct('${p.id}')">EDIT</button>
          <button class="admin-btn-del" onclick="deleteProduct('${p.id}')">DELETE</button>
        </div>
      </div>
    `).join('')}
  `;
}

// ADD / EDIT PRODUCT
async function addProduct(e) {
  e.preventDefault();

  const name          = document.getElementById('prodName').value.trim();
  const price         = parseFloat(document.getElementById('prodPrice').value);
  const origPrice     = parseFloat(document.getElementById('prodOriginalPrice').value) || null;
  const category      = document.getElementById('prodCategory').value;
  const stock         = document.getElementById('prodStock').value;
  const desc          = document.getElementById('prodDesc').value.trim();
  const imageUrl      = document.getElementById('prodImageUrl').value.trim();
  const fileInput     = document.getElementById('prodImageFile');
  const tags          = ['featured', 'bestseller', 'new']
    .filter(t => document.getElementById('tag' + t.charAt(0).toUpperCase() + t.slice(1)).checked);

  let imageData = imageUrl || '';
  if (!imageUrl && fileInput.files && fileInput.files[0]) {
    imageData = await toBase64(fileInput.files[0]);
  }

  if (editingProductId) {
    // EDIT mode
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, price, originalPrice: origPrice, category, stock, description: desc, image: imageData || products[idx].image, tags };
      showFlash('✓ Product updated!');
    }
    editingProductId = null;
    document.querySelector('[type=submit]').textContent = '+ ADD PRODUCT';
  } else {
    const product = {
      id: 'p' + Date.now(),
      name, price, originalPrice: origPrice, category, stock,
      description: desc, image: imageData, tags,
      rating: 0, reviews: [],
    };
    products.unshift(product);
    showFlash('✓ Product added!');
  }

  saveProducts();
  renderProducts();
  renderFeatured();
  renderBestSellers();
  renderNewArrivals();
  renderAdminProducts();
  document.getElementById('productForm').reset();
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;

  document.getElementById('prodName').value         = p.name;
  document.getElementById('prodPrice').value        = p.price;
  document.getElementById('prodOriginalPrice').value = p.originalPrice || '';
  document.getElementById('prodCategory').value     = p.category;
  document.getElementById('prodStock').value        = p.stock || 'in-stock';
  document.getElementById('prodDesc').value         = p.description || '';
  document.getElementById('prodImageUrl').value     = p.image && !p.image.startsWith('data:') ? p.image : '';

  document.getElementById('tagFeatured').checked   = (p.tags || []).includes('featured');
  document.getElementById('tagBestseller').checked = (p.tags || []).includes('bestseller');
  document.getElementById('tagNew').checked        = (p.tags || []).includes('new');

  document.querySelector('[type=submit]').textContent = '✓ UPDATE PRODUCT';
  switchAdminTab('products', document.querySelector('.admin-tab'));
  document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProducts();
  renderFeatured();
  renderBestSellers();
  renderNewArrivals();
  renderAdminProducts();
  showFlash('✓ Product deleted.');
}

function saveProducts() {
  localStorage.setItem('pk_products', JSON.stringify(products));
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── CART ─────────────────────────────────────────────────────────────────
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.stock === 'out-of-stock') { showFlash('✕ Out of stock'); return; }

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
  }
  localStorage.setItem('pk_cart', JSON.stringify(cart));
  renderCartCount();
  renderCartItems();
  showFlash('✓ Added to cart!');
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  localStorage.setItem('pk_cart', JSON.stringify(cart));
  renderCartCount();
  renderCartItems();
}

function changeCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  localStorage.setItem('pk_cart', JSON.stringify(cart));
  renderCartCount();
  renderCartItems();
}

function clearCart() {
  if (!confirm('Clear your cart?')) return;
  cart = [];
  localStorage.setItem('pk_cart', JSON.stringify(cart));
  renderCartCount();
  renderCartItems();
}

function renderCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById('cartCount');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer    = document.getElementById('cartFooter');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'flex';
  container.innerHTML = cart.map(c => `
    <div class="cart-item">
      ${c.image
        ? `<img class="cart-item-img" src="${escHtml(c.image)}" alt="${escHtml(c.name)}" onerror="this.style.opacity='0'" />`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:28px">👕</div>`
      }
      <div class="cart-item-info">
        <p class="cart-item-name">${escHtml(c.name)}</p>
        <p class="cart-item-price">$${Number(c.price).toFixed(2)} each</p>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeCartQty('${c.id}', -1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeCartQty('${c.id}', 1)">+</button>
          <button class="qty-btn" style="margin-left:6px;color:#e74c3c;border-color:rgba(231,76,60,0.3)" onclick="removeFromCart('${c.id}')">✕</button>
        </div>
      </div>
    </div>
  `).join('');

  const grand = cart.reduce((s, c) => s + c.price * c.qty, 0);
  document.getElementById('cartTotal').textContent = '$' + grand.toFixed(2);
}

function openCart() {
  renderCartItems();
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeCartOverlay(e) {
  if (e.target === document.getElementById('cartOverlay')) closeCart();
}

function checkoutCart() {
  if (!cart.length) return;
  closeCart();
  // Open order modal with cart as order (use first item for now, or create composite)
  const firstItem = products.find(p => p.id === cart[0].id);
  if (firstItem) openOrderModal(firstItem.id);
}

// ── WISHLIST ─────────────────────────────────────────────────────────────
function toggleWishlist(id, btn) {
  const idx = wishlist.indexOf(id);
  if (idx === -1) {
    wishlist.push(id);
    if (btn) { btn.classList.add('wishlisted'); btn.textContent = '♥ IN WISHLIST'; }
    showFlash('♥ Added to wishlist!');
  } else {
    wishlist.splice(idx, 1);
    if (btn) { btn.classList.remove('wishlisted'); btn.textContent = '♡ ADD TO WISHLIST'; }
    showFlash('Removed from wishlist');
  }
  localStorage.setItem('pk_wishlist', JSON.stringify(wishlist));
  renderWishlistCount();
  renderWishlistItems();
}

function renderWishlistCount() {
  const badge = document.getElementById('wishlistCount');
  if (badge) {
    badge.textContent = wishlist.length;
    badge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }
}

function renderWishlistItems() {
  const container = document.getElementById('wishlistItems');
  if (!container) return;

  const items = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean);

  if (!items.length) {
    container.innerHTML = '<p class="empty-msg">Your wishlist is empty.</p>';
    return;
  }

  container.innerHTML = items.map(p => `
    <div class="cart-item">
      ${p.image
        ? `<img class="cart-item-img" src="${escHtml(p.image)}" alt="${escHtml(p.name)}" onerror="this.style.opacity='0'" />`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:28px">👕</div>`
      }
      <div class="cart-item-info">
        <p class="cart-item-name">${escHtml(p.name)}</p>
        <p class="cart-item-price">$${Number(p.price).toFixed(2)}</p>
        <div class="cart-item-qty">
          <button class="qty-btn" style="width:auto;padding:0 10px;color:var(--gold);border-color:var(--border-gold)" onclick="addToCart('${p.id}')">Add to Cart</button>
          <button class="qty-btn" style="margin-left:6px;color:#e74c3c;border-color:rgba(231,76,60,0.3)" onclick="toggleWishlist('${p.id}')">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openWishlist() {
  renderWishlistItems();
  document.getElementById('wishlistOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeWishlist() {
  document.getElementById('wishlistOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeWishlistOverlay(e) {
  if (e.target === document.getElementById('wishlistOverlay')) closeWishlist();
}

// ── ADMIN ────────────────────────────────────────────────────────────────
function toggleAdmin() {
  const panel = document.getElementById('adminPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));

  if (btn) btn.classList.add('active');
  else document.querySelectorAll('.admin-tab')[['products','orders','settings'].indexOf(tab)]?.classList.add('active');

  const tabEl = document.getElementById('adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (tabEl) tabEl.classList.remove('hidden');
}

// Settings
function loadSettings() {
  if (tgSettings.token)  document.getElementById('tgToken').value   = tgSettings.token;
  if (tgSettings.chatId) document.getElementById('tgChatId').value  = tgSettings.chatId;
  if (paySettings.abaUrl)    document.getElementById('abaQrUrl').value    = paySettings.abaUrl;
  if (paySettings.acledaUrl) document.getElementById('acledaQrUrl').value = paySettings.acledaUrl;
}

function saveTelegramSettings() {
  tgSettings.token  = document.getElementById('tgToken').value.trim();
  tgSettings.chatId = document.getElementById('tgChatId').value.trim();
  localStorage.setItem('pk_tg', JSON.stringify(tgSettings));
  showFlash('✓ Telegram settings saved!');
}

async function testTelegram() {
  const { token, chatId } = tgSettings;
  if (!token || !chatId) { showFlash('⚠ Enter bot token & chat ID first'); return; }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ Prime Kits Telegram notifications are working!' }),
    });
    const data = await res.json();
    showFlash(data.ok ? '✓ Test message sent!' : '✕ Failed: ' + data.description);
  } catch (err) {
    showFlash('✕ Connection error');
  }
}

function savePaymentSettings() {
  paySettings.abaUrl    = document.getElementById('abaQrUrl').value.trim();
  paySettings.acledaUrl = document.getElementById('acledaQrUrl').value.trim();
  localStorage.setItem('pk_pay', JSON.stringify(paySettings));
  showFlash('✓ Payment settings saved!');
}

// ── MOBILE NAV ───────────────────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    nav.classList.toggle('open');
  });
}

function closeMobileNav() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileNav').classList.remove('open');
}

// ── FAQ ──────────────────────────────────────────────────────────────────
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-a.open').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-q.open').forEach(b => b.classList.remove('open'));

  if (!isOpen) {
    answer.classList.add('open');
    btn.classList.add('open');
  }
}

// ── CONTACT FORM ─────────────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  showFlash('✓ Message sent! We\'ll reply soon.');
  e.target.reset();
}

// ── FLASH TOAST ──────────────────────────────────────────────────────────
function showFlash(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}

// ── UTILITY ──────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── KEYBOARD ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProductModal();
    _closeOrderModal();
    closeCart();
    closeWishlist();
    document.getElementById('searchExpanded').classList.remove('open');
    document.getElementById('adminPanel').classList.remove('open');
    document.body.style.overflow = '';
  }
});
