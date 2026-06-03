// ============================================================
// PRIME KITS STORE — cart.js
// Cart state management using localStorage
// Dispatches 'cart:updated' event on every change
// ============================================================

const CART_KEY = 'pk_cart';

// ── READ ─────────────────────────────────────────────────────

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ── WRITE ────────────────────────────────────────────────────

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

/**
 * Add an item to the cart.
 * If same product + same size already exists, increase qty.
 * @param {Object} product - { id, name, price, image, size, qty }
 */
export function addToCart(product) {
  const cart = getCart();
  const key  = `${product.id}_${product.size || 'default'}`;
  const idx  = cart.findIndex(i => `${i.id}_${i.size || 'default'}` === key);

  if (idx > -1) {
    cart[idx].qty = Math.min(99, cart[idx].qty + (product.qty || 1));
  } else {
    cart.push({
      id:    product.id,
      name:  product.name,
      price: product.price,
      image: product.image || '',
      size:  product.size  || '',
      qty:   product.qty   || 1
    });
  }
  saveCart(cart);
}

export function updateQty(id, size, qty) {
  const cart = getCart();
  const key  = `${id}_${size || 'default'}`;
  const idx  = cart.findIndex(i => `${i.id}_${i.size || 'default'}` === key);
  if (idx === -1) return;
  if (qty < 1) {
    cart.splice(idx, 1);
  } else {
    cart[idx].qty = Math.min(99, qty);
  }
  saveCart(cart);
}

export function removeFromCart(id, size) {
  const key  = `${id}_${size || 'default'}`;
  const cart = getCart().filter(i => `${i.id}_${i.size || 'default'}` !== key);
  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

// ── UI SYNC ──────────────────────────────────────────────────

/** Update the cart badge counter in the nav */
export function syncCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

/** Render the full cart sidebar contents */
export function renderCartSidebar() {
  const items      = getCart();
  const container  = document.getElementById('cart-items');
  const footer     = document.getElementById('cart-footer');
  const totalEl    = document.getElementById('cart-total');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon"><i class="fa-solid fa-bag-shopping"></i></div>
        <p>Your bag is empty</p>
        <a href="/pages/shop.html" class="btn-primary" style="font-size:0.7rem;padding:10px 24px;">SHOP NOW</a>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
      <div class="cart-item-img">
        <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        ${item.size ? `<p class="cart-item-size">Size: ${item.size}</p>` : ''}
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="cart-qty-btn" data-action="minus" data-id="${item.id}" data-size="${item.size}">−</button>
            <span>${item.qty}</span>
            <button class="cart-qty-btn" data-action="plus"  data-id="${item.id}" data-size="${item.size}">+</button>
          </div>
          <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" data-size="${item.size}" aria-label="Remove">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`).join('');

  if (footer)  footer.style.display = '';
  if (totalEl) totalEl.textContent  = `$${getCartTotal().toFixed(2)}`;

  // Qty buttons
  container.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, size, action } = btn.dataset;
      const item = getCart().find(i => i.id === id && (i.size || '') === (size || ''));
      if (!item) return;
      updateQty(id, size, action === 'plus' ? item.qty + 1 : item.qty - 1);
      renderCartSidebar();
      syncCartBadge();
    });
  });

  // Remove buttons
  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.id, btn.dataset.size);
      renderCartSidebar();
      syncCartBadge();
    });
  });
}

// ── INIT ─────────────────────────────────────────────────────

export function initCart() {
  syncCartBadge();

  const toggle  = document.getElementById('cart-toggle');
  const close   = document.getElementById('cart-close');
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');

  function openCart() {
    renderCartSidebar();
    sidebar?.classList.add('open');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggle?.addEventListener('click', openCart);
  close?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);

  window.addEventListener('cart:updated', syncCartBadge);
}
