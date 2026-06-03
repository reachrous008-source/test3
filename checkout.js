// ============================================================
// PRIME KITS STORE — checkout.js
// Full checkout: customer info, shipping selection, ABA QR payment,
// Firestore order storage, Telegram admin notifications
// ============================================================

import { getCart, getCartTotal, clearCart, syncCartBadge } from './cart.js';
import { initCart } from './cart.js';
import { initUI, showToast, hideLoader } from './ui.js';
import { getShippingAgents, createOrder, getSettings } from './store.js';
import { TELEGRAM_CONFIG } from './firebase-config.js';

// ── STATE ─────────────────────────────────────────────────────
let currentStep     = 1;
let selectedShipping = null;
let createdOrderId   = null;
let siteSettings     = null;

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  initUI();
  initCart();

  const cart = getCart();
  if (cart.length === 0) {
    // Redirect if cart is empty
    window.location.href = 'shop.html';
    return;
  }

  renderSummaryItems();
  updateSummaryTotals();
  await loadShippingOptions();
  await loadSiteSettings();

  document.getElementById('place-order-btn')?.addEventListener('click', handlePlaceOrder);
  document.getElementById('payment-confirm-btn')?.addEventListener('click', handlePaymentConfirmed);

  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

// ── LOAD SITE SETTINGS (QR image, etc.) ───────────────────────
async function loadSiteSettings() {
  try {
    siteSettings = await getSettings('site');
    const paySettings = await getSettings('payment');
    if (paySettings?.abaQrImage) {
      const qrImg = document.getElementById('aba-qr-img');
      if (qrImg) qrImg.src = paySettings.abaQrImage;
    }
  } catch (e) { /* ignore */ }
}

// ── RENDER CART SUMMARY ───────────────────────────────────────
function renderSummaryItems() {
  const cart      = getCart();
  const container = document.getElementById('summary-items');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="summary-cart-item">
      <img class="summary-cart-img"
           src="${item.image || '../assets/placeholder.png'}"
           alt="${item.name}" loading="lazy"
           onerror="this.src='../assets/placeholder.png'" />
      <div class="summary-cart-info">
        <p class="summary-cart-name">${item.name}</p>
        <p class="summary-cart-meta">${item.size ? 'Size: ' + item.size + ' · ' : ''}Qty: ${item.qty}</p>
      </div>
      <span class="summary-cart-price">$${(item.price * item.qty).toFixed(2)}</span>
    </div>`).join('');
}

// ── UPDATE TOTALS ─────────────────────────────────────────────
function updateSummaryTotals() {
  const subtotal = getCartTotal();
  const shipping = selectedShipping ? selectedShipping.price : 0;
  const total    = subtotal + shipping;

  const fmt = n => `$${Number(n).toFixed(2)}`;

  const subEl  = document.getElementById('summary-subtotal');
  const shipEl = document.getElementById('summary-shipping');
  const totEl  = document.getElementById('summary-total');

  if (subEl)  subEl.textContent  = fmt(subtotal);
  if (shipEl) shipEl.textContent = selectedShipping ? fmt(shipping) : '—';
  if (totEl)  totEl.textContent  = fmt(total);
}

// ── LOAD SHIPPING OPTIONS ─────────────────────────────────────
async function loadShippingOptions() {
  const container = document.getElementById('shipping-options');
  if (!container) return;

  try {
    let agents = await getShippingAgents();

    // Fallback defaults if none configured in Firestore
    if (!agents.length) {
      agents = [
        { id: 'jt',    name: 'J&T Express',       icon: '🚚', price: 2.5,  days: '1–2 days' },
        { id: 'vb',    name: 'Vireak Buntham',     icon: '🏍️', price: 2.0,  days: '1–2 days' },
        { id: 'zto',   name: 'ZTO Express',        icon: '📦', price: 3.0,  days: '2–3 days' },
        { id: 'post',  name: 'Cambodia Post',      icon: '📮', price: 1.5,  days: '3–5 days' },
        { id: 'store', name: 'Pickup at Store',    icon: '🏪', price: 0,    days: 'Same day' },
      ];
    }

    container.innerHTML = agents.map((agent, i) => `
      <label class="shipping-opt ${i === 0 ? 'selected' : ''}" data-agent-id="${agent.id}">
        <input type="radio" name="shipping" value="${agent.id}" ${i === 0 ? 'checked' : ''} />
        <div class="shipping-opt-logo">${agent.icon || '📦'}</div>
        <div class="shipping-opt-body">
          <div class="shipping-opt-name">${agent.name}</div>
          <div class="shipping-opt-time"><i class="fa-regular fa-clock" style="color:var(--gold);margin-right:4px;"></i>${agent.days || agent.deliveryTime || '2–4 days'}</div>
        </div>
        <div class="shipping-opt-price">${agent.price === 0 ? 'FREE' : '$' + Number(agent.price).toFixed(2)}</div>
      </label>`).join('');

    // Set default
    selectedShipping = agents[0];
    updateSummaryTotals();

    // Event listeners
    container.querySelectorAll('.shipping-opt').forEach((el, idx) => {
      el.addEventListener('click', () => {
        container.querySelectorAll('.shipping-opt').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        el.querySelector('input[type=radio]').checked = true;
        selectedShipping = agents[idx];
        updateSummaryTotals();
      });
    });

  } catch (err) {
    container.innerHTML = `<p style="color:var(--red);font-size:0.82rem;">Failed to load shipping options.</p>`;
    console.error('[Checkout] Shipping load error:', err);
  }
}

// ── VALIDATE FORM ─────────────────────────────────────────────
function validateForm() {
  const name    = document.getElementById('cust-name')?.value.trim();
  const phone   = document.getElementById('cust-phone')?.value.trim();
  const address = document.getElementById('cust-address')?.value.trim();
  const city    = document.getElementById('cust-city')?.value;

  if (!name)    { showToast('Please enter your full name', 'error');    return null; }
  if (!phone)   { showToast('Please enter your phone number', 'error'); return null; }
  if (!address) { showToast('Please enter your delivery address', 'error'); return null; }
  if (!city)    { showToast('Please select your city/province', 'error'); return null; }
  if (!selectedShipping) { showToast('Please select a shipping method', 'error'); return null; }

  return {
    name,
    phone,
    telegram: document.getElementById('cust-telegram')?.value.trim() || '',
    address,
    city,
    notes: document.getElementById('cust-notes')?.value.trim() || ''
  };
}

// ── PLACE ORDER ───────────────────────────────────────────────
async function handlePlaceOrder() {
  const customer = validateForm();
  if (!customer) return;

  const btn = document.getElementById('place-order-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING…'; }

  try {
    const cart      = getCart();
    const subtotal  = getCartTotal();
    const shipping  = selectedShipping.price || 0;
    const total     = subtotal + shipping;

    const orderData = {
      customer,
      items:          cart,
      subtotal,
      shippingAgent:  { id: selectedShipping.id, name: selectedShipping.name, price: shipping },
      total,
      paymentMethod:  'ABA QR',
      paymentStatus:  'pending',
      status:         'pending'
    };

    const ref = await createOrder(orderData);
    createdOrderId = ref.id;

    // Move to payment step
    goToStep(3);
    showPaymentStep(total, ref.id);

    showToast('Order created! Please complete payment.', 'info');

  } catch (err) {
    console.error('[Checkout] Order create error:', err);
    showToast('Failed to place order. Please try again.', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-lock"></i> PROCEED TO PAYMENT'; }
  }
}

// ── SHOW PAYMENT STEP ─────────────────────────────────────────
async function showPaymentStep(total, orderId) {
  document.getElementById('form-steps').style.display = 'none';
  document.getElementById('payment-step').classList.add('active');

  const amtEl = document.getElementById('payment-amount-display');
  if (amtEl) amtEl.textContent = `$${Number(total).toFixed(2)}`;

  const orderIdEl = document.getElementById('payment-order-id');
  if (orderIdEl) orderIdEl.textContent = orderId;

  // Try to load QR from settings
  try {
    const paySettings = await getSettings('payment');
    if (paySettings?.abaQrImage) {
      const qrImg = document.getElementById('aba-qr-img');
      if (qrImg) qrImg.src = paySettings.abaQrImage;
    }
  } catch (_) {}
}

// ── PAYMENT CONFIRMED ─────────────────────────────────────────
async function handlePaymentConfirmed() {
  const btn = document.getElementById('payment-confirm-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CONFIRMING…'; }

  try {
    // Update order payment status in Firestore
    const { updateOrderStatus } = await import('./store.js');
    await updateOrderStatus(createdOrderId, 'payment_submitted');

    // Send Telegram notification
    await sendTelegramNotification();

    // Clear cart
    clearCart();
    syncCartBadge();

    // Show confirmation
    goToStep(4);
    document.getElementById('payment-step').classList.remove('active');
    const confirmStep = document.getElementById('confirmed-step');
    if (confirmStep) {
      confirmStep.classList.add('active');
      document.getElementById('confirmed-order-id').textContent = createdOrderId;
    }

    showToast('Order confirmed! Thank you!', 'success');

  } catch (err) {
    console.error('[Checkout] Payment confirm error:', err);
    showToast('Confirmation failed. Please contact us on Telegram.', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> I HAVE COMPLETED PAYMENT'; }
  }
}

// ── TELEGRAM NOTIFICATION ─────────────────────────────────────
async function sendTelegramNotification() {
  try {
    const { botToken, chatId } = TELEGRAM_CONFIG;
    if (!botToken || botToken === 'YOUR_BOT_TOKEN') {
      console.warn('[Telegram] Bot not configured — skipping notification');
      return;
    }

    const cart      = getCart();
    const customer  = {
      name:     document.getElementById('cust-name')?.value.trim(),
      phone:    document.getElementById('cust-phone')?.value.trim(),
      telegram: document.getElementById('cust-telegram')?.value.trim(),
      address:  document.getElementById('cust-address')?.value.trim(),
      city:     document.getElementById('cust-city')?.value,
      notes:    document.getElementById('cust-notes')?.value.trim()
    };

    const subtotal = getCartTotal();
    const shipping = selectedShipping?.price || 0;
    const total    = subtotal + shipping;

    const itemLines = cart.map(i =>
      `  • ${i.name}${i.size ? ' ('+i.size+')' : ''} × ${i.qty} = $${(i.price * i.qty).toFixed(2)}`
    ).join('\n');

    const message = `
🛍️ *NEW ORDER — PRIME KITS*
━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* \`${createdOrderId}\`

👤 *CUSTOMER*
  Name: ${customer.name}
  Phone: ${customer.phone}
  Telegram: ${customer.telegram || 'N/A'}

📍 *DELIVERY*
  ${customer.address}
  ${customer.city}
  ${customer.notes ? 'Notes: ' + customer.notes : ''}

🧾 *ITEMS*
${itemLines}

🚚 *Shipping:* ${selectedShipping?.name} — $${shipping.toFixed(2)}
💰 *Subtotal:* $${subtotal.toFixed(2)}
💵 *TOTAL: $${total.toFixed(2)}*

💳 *Payment:* ABA QR — PENDING VERIFICATION
━━━━━━━━━━━━━━━━━━━━━
⚡ Check admin panel to update status
`.trim();

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    chatId,
        text:       message,
        parse_mode: 'Markdown'
      })
    });

  } catch (err) {
    console.warn('[Telegram] Notification failed (non-critical):', err.message);
  }
}

// ── STEP NAVIGATION ───────────────────────────────────────────
function goToStep(n) {
  currentStep = n;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < n)  el.classList.add('done');
    if (i === n) el.classList.add('active');
    // Update checkmark for done steps
    const numEl = el.querySelector('.step-num');
    if (numEl) numEl.innerHTML = i < n ? '<i class="fa-solid fa-check" style="font-size:0.65rem;"></i>' : i;
  }
}

// Run
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
