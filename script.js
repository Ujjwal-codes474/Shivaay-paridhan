// Backend API configuration — always points to the Express backend
const API_BASE_URL =
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://shivaay-paridhan-1.onrender.com';
const WHATSAPP_NUMBER = '918448460446';
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function buildWhatsAppUrl(message) {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}

function getFormattedAddress(customer) {
  const parts = [];
  if (customer.flat) parts.push(customer.flat);
  if (customer.area) parts.push(customer.area);
  if (customer.landmark) parts.push(customer.landmark);
  if (customer.city) parts.push(customer.city);
  if (customer.state) parts.push(customer.state);
  if (customer.pincode) parts.push(customer.pincode);
  return parts.filter(Boolean).join(', ');
}

function getItemFinalPrice(product) {
  if (!product) return 0;
  // Standardized: 'price' field in database now stores the final discounted price
  // 'originalPrice' stores the price before discount.
  return Number(product.price) || Number(product.originalPrice) || 0;
}

function createWhatsAppOrderContent(customerData, cartItems, total) {
  const header = `Hello Shivaay Paridhan,\nI want to place an order.\n`;
  const itemLines = cartItems.map((item, index) => {
    const colorLine = item.color ? `\nColor: ${item.color}` : '';
    return `${index + 1}. ${item.name} ×${item.quantity}\nPrice: ₹${item.price.toLocaleString()}${colorLine}`;
  }).join('\n\n');
  const address = getFormattedAddress(customerData) || 'N/A';
  const couponText = appliedCoupon ? `\nCoupon: ${appliedCoupon.couponCode}\nDiscount: -₹${appliedCoupon.discountAmount.toLocaleString()}\n` : '';

  return `${header}\n${itemLines}\n${couponText}\nTotal: ₹${total.toLocaleString()}\n\nCustomer Name: $Customer Name: ${customerData.fullName || customerData.name || ''}\nPhone: ${customerData.phone || ''}\nAddress: ${address}\n\nPlease confirm the order and delivery details.`;
}

function openWhatsAppChat(customerData, cartItems, total) {
  const message = createWhatsAppOrderContent(customerData, cartItems, total);
  const url = buildWhatsAppUrl(message);
  window.open(url, '_blank');
}

function setupWhatsAppSupport() {
  renderFloatingWhatsAppButton();
}

function renderFloatingWhatsAppButton() {
  if (document.getElementById('whatsapp-support-btn')) return;
  const button = document.createElement('a');
  button.id = 'whatsapp-support-btn';
  button.href = buildWhatsAppUrl('Hello Shivaay Paridhan, I need help with my order.');
  button.target = '_blank';
  button.rel = 'noopener noreferrer';
  button.className = 'whatsapp-float-btn';
  button.innerHTML = `<span>💬</span><span>Chat on WhatsApp</span>`;
  document.body.appendChild(button);
}

// ── Anti-flicker: single fetch gate ──────────────────────────
let _fetchPromise = null;   // reuse inflight promise
let _isFetching = false;
let _fetched = false;
let allProducts = [];
let appliedCoupon = null;

// Legacy aliases (keep for compat with existing call-sites)
let isFetched = false;
let _isFetchingProducts = false;
let _isRenderingProducts = false;
let _productsLoaded = false;
let _addToCartListenersBound = false;
let _sliderControlsBound = false;

// ============ OFFER TIMER ENGINE ============
/**
 * OfferTimerEngine — manages ALL countdown timers in a single shared interval.
 * • Registers timers by unique ID (typically product ID)
 * • Each tick updates only the DOM elements that actually changed (tabular-nums trick)
 * • Automatically removes expired timers
 */
const OfferTimerEngine = (() => {
  const _timers = new Map(); // id -> { endDate, elIds, onExpire }
  let _intervalId = null;

  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  function _tick() {
    const now = Date.now();
    _timers.forEach((timer, id) => {
      const diff = timer.endDate - now;

      // Find all DOM elements registered for this timer
      const elements = timer.elIds.map(eid => document.getElementById(eid)).filter(Boolean);
      if (elements.length === 0) {
        // Elements removed from DOM — clean up
        _timers.delete(id);
        return;
      }

      if (diff <= 0) {
        // Expired
        elements.forEach(el => {
          el.innerHTML = `
            <div class="card-offer-expired">⏰ Offer Expired</div>
          `;
        });
        _timers.delete(id);
        if (timer.onExpire) timer.onExpire(id);
        return;
      }

      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000)  / 60000);
      const seconds = Math.floor((diff % 60000)    / 1000);

      // Update each registered element container
      elements.forEach(el => {
        // Card mini-timer
        if (el.dataset.timerType === 'card') {
          _updateCardTimer(el, days, hours, minutes, seconds);
        } else if (el.dataset.timerType === 'detail') {
          _updateDetailTimer(el, days, hours, minutes, seconds);
        }
      });
    });

    // Stop interval if nothing to update
    if (_timers.size === 0) { clearInterval(_intervalId); _intervalId = null; }
  }

  function _updateCardTimer(el, d, h, m, s) {
    const dEl = el.querySelector('.ct-days'),
          hEl = el.querySelector('.ct-hours'),
          mEl = el.querySelector('.ct-mins'),
          sEl = el.querySelector('.ct-secs');
    if (!sEl) return; // element rebuilt — skip
    _setNum(sEl, s);
    _setNum(mEl, m);
    _setNum(hEl, h);
    _setNum(dEl, d);
  }

  function _updateDetailTimer(el, d, h, m, s) {
    const dEl = el.querySelector('.oct-days'),
          hEl = el.querySelector('.oct-hours'),
          mEl = el.querySelector('.oct-mins'),
          sEl = el.querySelector('.oct-secs');
    if (!sEl) return;
    _setNum(sEl, s);
    _setNum(mEl, m);
    _setNum(hEl, h);
    _setNum(dEl, d);
  }

  function _setNum(el, val) {
    if (!el) return;
    const padded = String(Math.floor(val)).padStart(2, '0');
    if (el.textContent === padded) return; // no-op if unchanged
    // Flash flip animation
    const parent = el.closest('.oc-unit, .card-timer-unit');
    if (parent) {
      parent.classList.remove('digit-flip');
      void parent.offsetWidth; // reflow
      parent.classList.add('digit-flip');
    }
    el.textContent = padded;
  }

  function _ensureRunning() {
    if (!_intervalId) {
      _intervalId = setInterval(_tick, 1000);
      _tick(); // immediate first tick
    }
  }

  return {
    /**
     * Register a countdown timer.
     * @param {string} id         — unique key (product id)
     * @param {Date|string} endDate — offer end date
     * @param {string[]} elIds    — array of element IDs to update
     * @param {Function} [onExpire] — callback when timer expires
     */
    register(id, endDate, elIds, onExpire) {
      const end = endDate instanceof Date ? endDate : new Date(endDate);
      if (isNaN(end.getTime())) return; // invalid date
      _timers.set(String(id), { endDate: end.getTime(), elIds, onExpire });
      _ensureRunning();
    },
    unregister(id) { _timers.delete(String(id)); },
    clear() { _timers.clear(); if (_intervalId) { clearInterval(_intervalId); _intervalId = null; } }
  };
})();

// ============ COUPON SYSTEM LOGIC ============

/**
 * Admin: Load all coupons into the table
 */
async function loadCoupons() {
  const tableBody = document.getElementById('coupons-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading coupons...</td></tr>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/coupons`);
    if (!res.ok) throw new Error('Failed to fetch');
    const coupons = await res.json();

    if (coupons.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No coupons found. Create one above!</td></tr>';
      return;
    }

    tableBody.innerHTML = coupons.map(c => `
      <tr>
        <td><span class="coupon-code-badge">${c.code}</span></td>
        <td>${c.discountType === 'percentage' ? c.discountValue + '%' : '₹' + c.discountValue}</td>
        <td>₹${c.minOrderAmount}</td>
        <td>${new Date(c.expiryDate).toLocaleDateString()}</td>
        <td>${c.usedCount} / ${c.usageLimit || '∞'}</td>
        <td>
          <span class="coupon-status ${c.isActive ? 'status-active' : 'status-inactive'}">
            ${c.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="display:flex; gap:8px;">
          <button onclick='editCoupon(${JSON.stringify(c)})' class="btn" style="padding:6px 12px; font-size:0.8rem; background:var(--black); color:#fff;">Edit</button>
          <button onclick="deleteCoupon('${c._id}')" class="btn" style="padding:6px 12px; font-size:0.8rem; background:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading coupons.</td></tr>';
  }
}

/**
 * Admin: Save/Update coupon
 */
async function saveCoupon(event) {
  if (event) event.preventDefault();
  const form = document.getElementById('coupon-form');
  const id = document.getElementById('coupon-id').value;
  const submitBtn = document.getElementById('save-coupon-btn');

  const data = {
    code: document.getElementById('coupon-code').value.toUpperCase(),
    discountType: document.getElementById('coupon-type').value,
    discountValue: parseFloat(document.getElementById('coupon-value').value),
    minOrderAmount: parseFloat(document.getElementById('coupon-min-order').value || 0),
    expiryDate: document.getElementById('coupon-expiry').value,
    usageLimit: document.getElementById('coupon-limit').value ? parseInt(document.getElementById('coupon-limit').value) : null,
    isActive: document.getElementById('coupon-status').value === 'true'
  };

  try {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const url = id ? `${API_BASE_URL}/api/coupons/${id}` : `${API_BASE_URL}/api/coupons`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      showAdminToast(`Coupon ${id ? 'updated' : 'created'} successfully!`);
      cancelCouponEdit();
      loadCoupons();
    } else {
      const err = await res.json();
      alert(err.message || 'Error saving coupon');
    }
  } catch (err) {
    alert('Error connecting to server');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

function editCoupon(coupon) {
  document.getElementById('coupon-id').value = coupon._id;
  document.getElementById('coupon-code').value = coupon.code;
  document.getElementById('coupon-type').value = coupon.discountType;
  document.getElementById('coupon-value').value = coupon.discountValue;
  document.getElementById('coupon-min-order').value = coupon.minOrderAmount;
  document.getElementById('coupon-expiry').value = new Date(coupon.expiryDate).toISOString().split('T')[0];
  document.getElementById('coupon-limit').value = coupon.usageLimit || '';
  document.getElementById('coupon-status').value = String(coupon.isActive);
  
  document.getElementById('coupon-form-title').textContent = 'Edit Coupon: ' + coupon.code;
  document.getElementById('save-coupon-btn').querySelector('.btn-text').textContent = '🏷️ Update Coupon';
  document.getElementById('cancel-coupon-edit').style.display = 'block';
  
  document.getElementById('coupon-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelCouponEdit() {
  document.getElementById('coupon-form').reset();
  document.getElementById('coupon-id').value = '';
  document.getElementById('coupon-form-title').textContent = 'Create New Coupon';
  document.getElementById('save-coupon-btn').querySelector('.btn-text').textContent = '🏷️ Save Coupon';
  document.getElementById('cancel-coupon-edit').style.display = 'none';
}

async function deleteCoupon(id) {
  if (!confirm('Are you sure you want to delete this coupon?')) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAdminToast('Coupon deleted');
      loadCoupons();
    }
  } catch (err) {
    alert('Error deleting coupon');
  }
}

/**
 * Frontend: Apply coupon to cart
 */
async function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim();
  const msgEl = document.getElementById('coupon-message');
  const btn = document.getElementById('apply-coupon-btn');

  if (!code) return;

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];
  let subtotal = 0;
  cart.forEach(item => {
    const p = products.find(prod => String(prod.id) === String(item.id));
    if (p) subtotal += p.price * item.quantity;
  });

  try {
    btn.disabled = true;
    btn.textContent = 'Verifying...';
    
    const res = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmount: subtotal })
    });

    const data = await res.json();

    if (res.ok) {
      appliedCoupon = data;
      localStorage.setItem('appliedCoupon', JSON.stringify(data));
      
      msgEl.textContent = '✓ ' + data.message;
      msgEl.className = 'coupon-message success';
      
      renderAppliedCouponTag(data.couponCode, data.discountAmount);
      
      // Refresh totals
      if (document.getElementById('cart-items')) renderCart();
      if (document.getElementById('customer-form')) displayCheckout();
    } else {
      msgEl.textContent = '✕ ' + data.message;
      msgEl.className = 'coupon-message error';
      appliedCoupon = null;
      localStorage.removeItem('appliedCoupon');
    }
  } catch (err) {
    msgEl.textContent = '✕ Error validating coupon';
    msgEl.className = 'coupon-message error';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Apply Coupon';
  }
}

function renderAppliedCouponTag(code, discount) {
  const container = document.getElementById('applied-coupon-container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="applied-coupon-tag">
      <span>🎟️ <strong>${code}</strong> applied (Save ₹${discount.toLocaleString()})</span>
      <span class="remove-coupon" onclick="removeCoupon()">✕</span>
    </div>
  `;
}

function removeCoupon() {
  appliedCoupon = null;
  localStorage.removeItem('appliedCoupon');
  const container = document.getElementById('applied-coupon-container');
  if (container) container.innerHTML = '';
  const msgEl = document.getElementById('coupon-message');
  if (msgEl) msgEl.textContent = '';
  const input = document.getElementById('coupon-input');
  if (input) input.value = '';
  
  if (document.getElementById('cart-items')) renderCart();
  if (document.getElementById('customer-form')) displayCheckout();
}

async function loadAvailableCoupons() {
  const container = document.getElementById('available-coupons-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/coupons`);
    const coupons = await res.json();
    const active = coupons.filter(c => c.isActive && new Date(c.expiryDate) > new Date());

    if (active.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding:20px;">No active offers at the moment.</p>';
      return;
    }

    container.innerHTML = active.map(c => `
      <div class="available-coupon-item">
        <div class="coupon-item-info">
          <h4>${c.code}</h4>
          <p>${c.discountType === 'percentage' ? c.discountValue + '% Off' : '₹' + c.discountValue + ' Off'} · Min. order ₹${c.minOrderAmount}</p>
        </div>
        <button class="copy-code-btn" onclick="copyCouponCode('${c.code}')">Copy</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p style="color:red;">Failed to load offers.</p>';
  }
}

function copyCouponCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert('Code ' + code + ' copied to clipboard!');
    const input = document.getElementById('coupon-input');
    if (input) {
      input.value = code;
      const modal = document.getElementById('coupons-modal');
      if (modal) modal.classList.remove('show');
    }
  });
}

/**
 * Compute offer state for a product.
 * Returns { active, expired, notStarted, label, endDate, startDate }
 */
function getOfferState(product) {
  const now = new Date();
  let endDate   = product.offerEndDate   ? new Date(product.offerEndDate)   : null;
  const startDate = product.offerStartDate ? new Date(product.offerStartDate) : null;
  const label     = product.offerLabel || '';

  const hasOfferLabel = (product.offerLabel && product.offerLabel.trim().length > 0);
  const hasOfferDiscount = (Number(product.offerDiscount) > 0);
  const hasRegularDiscount = (Number(product.discount) > 0);
  
  const isExpiredOrInvalid = !endDate || isNaN(endDate.getTime()) || (now >= endDate);

  // Auto-generate 3-day timer for any product with an offer OR a regular discount
  if ((hasOfferLabel || hasOfferDiscount || hasRegularDiscount) && isExpiredOrInvalid) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(23, 59, 59, 999);
  }

  if (!endDate || isNaN(endDate.getTime())) {
    return { active: false, expired: false, notStarted: false, label, endDate: null, startDate };
  }

  const started = !startDate || now >= startDate;
  const expired = now >= endDate;

  return {
    active:     started && !expired,
    expired:    expired,
    notStarted: !started,
    label,
    endDate,
    startDate
  };
}

/**
 * Build mini card-timer HTML (static shell — digits updated by OfferTimerEngine)
 */
function buildCardTimerHTML(timerId, offer) {
  return `
    <div class="card-timer-overlay" id="ct-${timerId}" data-timer-type="card">
      <div class="card-timer-title">Sale Ends In</div>
      <div class="card-timer-boxes">
        <div class="ct-box"><span class="ct-num ct-days">00</span><span class="ct-label">Days</span></div>
        <div class="ct-box"><span class="ct-num ct-hours">00</span><span class="ct-label">Hours</span></div>
        <div class="ct-box"><span class="ct-num ct-mins">00</span><span class="ct-label">Mins</span></div>
        <div class="ct-box"><span class="ct-num ct-secs">00</span><span class="ct-label">Secs</span></div>
      </div>
    </div>
  `;
}

/**
 * Build premium detail-page countdown banner HTML
 */
function buildDetailBannerHTML(product, offer) {
  const timerId = `detail-${product.id || product._id}`;
  const discount      = Number(product.discount) || 0;
  const originalPrice = Number(product.originalPrice || product.price) || 0;
  const finalPrice    = Number(product.price) || originalPrice;
  const savings       = originalPrice - finalPrice;
  const hasDiscount   = discount > 0 && savings > 0;

  if (offer.expired) {
    return `
      <div class="offer-detail-banner">
        <div class="offer-banner-top">
          <div class="offer-banner-pill"><span class="pill-icon">🏷️</span>${escapeHtml(offer.label || 'Special Offer')}</div>
        </div>
        <div class="offer-expired-state">
          <span>⏰</span>
          <span>This offer has expired. Check back for new deals!</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="offer-detail-banner">
      <div class="offer-banner-top">
        <div class="offer-banner-pill">
          <span class="pill-icon">🔥</span>
          ${escapeHtml(offer.label || 'Limited Time Offer')}
        </div>
        ${hasDiscount ? `
        <div class="offer-discount-display">
          <span class="offer-discount-pct">${discount}% OFF</span>
          <span class="offer-discount-sub">Special Price</span>
        </div>` : ''}
      </div>

      ${hasDiscount ? `
      <div class="offer-savings-row">
        <span class="offer-price-final">₹${finalPrice.toLocaleString('en-IN')}</span>
        <span class="offer-price-original">₹${originalPrice.toLocaleString('en-IN')}</span>
        <span class="offer-save-chip">You Save ₹${savings.toLocaleString('en-IN')}</span>
      </div>` : ''}

      <div class="offer-countdown-row">
        <span class="offer-ends-label">Offer Ends In:</span>
        <div class="offer-countdown" id="${timerId}" data-timer-type="detail">
          <div class="oc-unit">
            <span class="oc-num oct-days">00</span>
            <span class="oc-label">Days</span>
          </div>
          <span class="oc-sep">:</span>
          <div class="oc-unit">
            <span class="oc-num oct-hours">00</span>
            <span class="oc-label">Hours</span>
          </div>
          <span class="oc-sep">:</span>
          <div class="oc-unit">
            <span class="oc-num oct-mins">00</span>
            <span class="oc-label">Mins</span>
          </div>
          <span class="oc-sep">:</span>
          <div class="oc-unit">
            <span class="oc-num oct-secs">00</span>
            <span class="oc-label">Secs</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============ NAVIGATION & CORE UI ============

function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  const menuBtn = document.getElementById('menu-btn');
  
  if (navLinks) {
    const isOpen = navLinks.classList.toggle('open');
    if (hamburger) hamburger.classList.toggle('active', isOpen);
    closeSearch();
  }
}

function closeMenu() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  if (navLinks) {
    navLinks.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
  }
}

function toggleSearch() {
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input');
  if (searchOverlay) {
    searchOverlay.classList.toggle('active');
    if (searchOverlay.classList.contains('active')) {
      setTimeout(() => searchInput && searchInput.focus(), 100);
      closeMenu();
    }
  }
}

function closeSearch() {
  const searchOverlay = document.getElementById('search-overlay');
  if (searchOverlay) {
    searchOverlay.classList.remove('active');
  }
  hideSearchDropdown();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const ids = ['cart-count', 'cart-count-mobile', 'cartBadgeMobile', 'cart-count-nav'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (totalItems > 0) {
        el.textContent = totalItems;
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    }
  });
}

function initHeaderLayout() {
  const header = document.getElementById('navbar');
  if (!header) return;

  const existingNav = header.querySelector('.nav-container, .nav-menu, .nav-links, .nav-actions, .nav-logo');
  if (existingNav) return;

  header.innerHTML = `
    <div class="nav-container-premium">
      <!-- Desktop double-row layout -->
      <div class="nav-desktop-layout">
        <!-- ROW 1 -->
        <div class="nav-row-one">
          <a href="index.html" class="nav-logo">
            <img loading="lazy" src="images/shivaay.jpeg" alt="Shivaay Paridhan" class="logo-img">
            <div class="logo-meta">
              <span class="logo-text-primary">Shivaay</span>
              <span class="logo-text-secondary">PARIDHAN</span>
            </div>
          </a>
          
          <div class="nav-search-container">
            <input type="text" id="desktop-search-input" placeholder="Search for products, categories..." class="search-input-centered">
            <button class="search-icon-btn-inside" onclick="triggerDesktopSearch()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
          
          <div class="nav-desktop-actions">
            <a href="profile.html#wishlist" class="nav-action-item">
              <span class="nav-action-icon" style="position:relative;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="cart-count wishlist-count" style="display:none;">0</span>
              </span>
              <span class="nav-action-label">Wishlist</span>
            </a>
            
            <a href="cart.html" class="nav-action-item cart-trigger">
              <span class="nav-action-icon" style="position: relative;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span class="cart-count" id="cart-count">0</span>
              </span>
              <span class="nav-action-label">Cart</span>
            </a>
            
            <a href="profile.html" class="nav-action-item">
              <span class="nav-action-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span class="nav-action-label">Account</span>
            </a>
          </div>
        </div>
        
        <!-- ROW 2 -->
        <div class="nav-row-two">
          <div class="categories-dropdown-btn" onclick="window.location.href='products.html'">
            <svg class="hamburger-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Categories</span>
            <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          <div class="nav-desktop-menu"></div>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="nav-mobile-layout">
        <div class="nav-mobile-row-one">
          <button class="hamburger-mobile-btn" onclick="toggleMenu()" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
          
          <a href="index.html" class="nav-logo-mobile">
            <img loading="lazy" src="images/shivaay.jpeg" alt="Shivaay Paridhan" class="logo-img">
            <span class="logo-text-mobile">Shivaay Paridhan</span>
          </a>
          
          <div class="nav-mobile-actions-right">
            <a href="profile.html#wishlist" class="nav-mobile-icon-link" style="position:relative;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="cart-count wishlist-count" style="display:none;">0</span>
            </a>
            <a href="cart.html" class="nav-mobile-icon-link" style="position: relative;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span class="cart-count" id="cart-count-mobile">0</span>
            </a>
          </div>
        </div>
        
        <div class="nav-mobile-row-two">
          <div class="mobile-search-bar-container">
            <input type="text" id="mobile-search-input" placeholder="Search for products, categories..." class="mobile-search-input-field">
            <button class="mobile-search-icon-btn" onclick="triggerMobileSearch()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Side Menu Sidebar (Mobile Side Drawer) -->
      <nav class="nav-links" id="nav-links"></nav>
    </div>
  `;

  // Bind Enter key to search inputs
  const dSearch = document.getElementById('desktop-search-input');
  if (dSearch) {
    dSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = dSearch.value.trim();
        if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
      }
    });
  }

  const mSearch = document.getElementById('mobile-search-input');
  if (mSearch) {
    mSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = mSearch.value.trim();
        if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
      }
    });
  }

  updateActiveNav();
  updateAuthMenu();
}

function triggerDesktopSearch() {
  const dSearch = document.getElementById('desktop-search-input');
  const q = dSearch ? dSearch.value.trim() : '';
  if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
}

function triggerMobileSearch() {
  const mSearch = document.getElementById('mobile-search-input');
  const q = mSearch ? mSearch.value.trim() : '';
  if (q) window.location.href = `products.html?search=${encodeURIComponent(q)}`;
}

function updateAuthMenu() {
  const role = localStorage.getItem('role');
  const profileLogin = document.querySelector('.profile-login');
  const profileLogout = document.querySelector('.profile-logout');
  const mobileLogin = document.querySelector('.nav-login-btn');
  const mobileLogout = document.querySelector('.logout-btn');

  if (role) {
    if (mobileLogin) mobileLogin.style.display = 'none';
    if (mobileLogout) mobileLogout.style.display = 'block';
  } else {
    if (mobileLogin) mobileLogin.style.display = 'block';
    if (mobileLogout) mobileLogout.style.display = 'none';
  }
}

function updateActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const category = normalizeCategoryAlias(params.get('category'));
  const type = normalizeTypeAlias(params.get('type') || params.get('category'));
  const sort = params.get('sort');

  document.querySelectorAll('.nav-menu-link, .nav-link').forEach((link) => {
    link.classList.remove('active');
  });

  if (path === 'index.html' || path === '') {
    const homeLink = document.querySelector('.nav-link[href="index.html"], .nav-menu-link[href="index.html"]');
    if (homeLink) homeLink.classList.add('active');
    return;
  }

  if (path === 'products.html') {
    const links = Array.from(document.querySelectorAll('.nav-menu-link, .nav-link'));
    let activeLink = null;

    if (sort) {
      activeLink = links.find((link) => {
        const href = link.getAttribute('href') || '';
        const target = new URL(href, window.location.origin);
        return target.pathname.endsWith('products.html') && target.searchParams.get('sort') === sort;
      });
    }

    if (!activeLink && category) {
      activeLink = links.find((link) => {
        const href = link.getAttribute('href') || '';
        const target = new URL(href, window.location.origin);
        const linkCategory = normalizeCategoryAlias(target.searchParams.get('category'));
        const linkType = normalizeTypeAlias(target.searchParams.get('type') || target.searchParams.get('category'));

        if (category === 'clothing' && type) {
          return linkCategory === 'clothing' && linkType === type;
        }
        if (category === 'clothing' && !type) {
          return !target.searchParams.has('category') && !target.searchParams.has('sort');
        }
        return linkCategory === category;
      });
    }

    if (!activeLink) {
      activeLink = document.querySelector('.nav-link[href="products.html"], .nav-menu-link[href="products.html"]');
    }

    if (activeLink) activeLink.classList.add('active');
    return;
  }

  const directLink = document.querySelector(`.nav-link[href="${path}"], .nav-menu-link[href="${path}"]`);
  if (directLink) directLink.classList.add('active');
}

function handleSearchKeydown(e) {
  if (e.key === 'Enter') {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';
    if (query) {
      window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
  }
}

function initNavigation() {
  initHeaderLayout();
  renderPageNavigation();

  // Sticky Navbar
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Close menu and search on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeSearch();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger');
    const menuBtn = document.getElementById('menu-btn');

    if (navLinks && navLinks.classList.contains('open')) {
      const clickedInsideMenu = navLinks.contains(e.target);
      const clickedHamburger = hamburger && hamburger.contains(e.target);
      const clickedMenuBtn = menuBtn && menuBtn.contains(e.target);
      
      if (!clickedInsideMenu && !clickedHamburger && !clickedMenuBtn) {
        closeMenu();
      }
    }
  });

  // Search input listener
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', handleSearchKeydown);
  }

  // Update cart count
  updateCartCount();
}

// Global Filter Toggle
function toggleFilter() {
  const panel = document.getElementById('filter-panel');
  const overlay = document.getElementById('filter-overlay');
  if (panel) panel.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

// Enhanced mobile filter toggle: adds body scroll lock and aria attributes
function toggleFilterEnhanced() {
  const panel = document.getElementById('filter-panel');
  const overlay = document.getElementById('filter-overlay');
  const open = panel && panel.classList.contains('open');
  // call base toggle
  toggleFilter();
  // lock body when opened
  const nowOpen = panel && panel.classList.contains('open');
  if (nowOpen) {
    document.body.classList.add('no-scroll');
    panel.setAttribute('aria-hidden','false');
    panel.setAttribute('aria-modal','true');
    // focus first interactive element
    const first = panel.querySelector('button, input, select, a');
    if (first) first.focus();
  } else {
    document.body.classList.remove('no-scroll');
    if (panel) { panel.setAttribute('aria-hidden','true'); panel.removeAttribute('aria-modal'); }
  }
}

// Replace existing toggleFilter usage on pages that have overlay/button calling toggleFilter()
// We keep the simple toggleFilter for backward compatibility, and prefer enhanced when available.
// If page elements call toggleFilter directly, they will still work; prefer to call toggleFilterEnhanced where possible.

// ============ SEARCH FUNCTIONALITY ============
function submitSearchForm(event) {
  event.preventDefault();
  const searchInput = event.target.querySelector('.search-input');
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    return;
  }

  const products = JSON.parse(localStorage.getItem('products')) || [];
  const results = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    (product.type && product.type.toLowerCase().includes(searchTerm))
  );

  localStorage.setItem('searchResults', JSON.stringify(results));
  localStorage.setItem('searchTerm', searchTerm);
  window.location.href = 'products.html?search=' + encodeURIComponent(searchTerm);
}

/**
 * Real-time search with dropdown results
 */
function setupRealTimeSearch() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const searchTerm = e.target.value.trim().toLowerCase();

    if (searchTerm.length < 2) {
      hideSearchDropdown();
      return;
    }

    debounceTimer = setTimeout(() => {
      performRealTimeSearch(searchTerm);
    }, 300);
  });

  // Hide dropdown when clicking outside the active search bar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar') && !e.target.closest('.search-results-dropdown')) {
      hideSearchDropdown();
    }
  });
}

function performRealTimeSearch(searchTerm) {
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const results = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  ).slice(0, 5); // Show top 5 results

  showSearchDropdown(results, searchTerm);
}

function showSearchDropdown(results, searchTerm) {
  const searchContainer = document.querySelector('.search-bar') || document.body;
  let dropdown = document.querySelector('.search-results-dropdown');

  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'search-results-dropdown';
    searchContainer.appendChild(dropdown);
  }

  if (results.length === 0) {
    dropdown.innerHTML = `
      <div class="search-result-item" style="justify-content: center; color: var(--text-secondary);">
        No products found
      </div>
    `;
  } else {
    dropdown.innerHTML = results.map(product => `
      <div class="search-result-item" onclick="goToProduct(${product.id})">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        <div class="result-info">
          <div class="result-name">${escapeHtml(product.name)}</div>
          <div class="result-price">₹${product.price.toLocaleString()}</div>
        </div>
      </div>
    `).join('') + `
      <div class="search-result-item" onclick="searchAllResults('${escapeHtml(searchTerm)}')" style="justify-content: center; background: var(--accent-light);">
        <span style="color: var(--primary); font-weight: 600;">View all results →</span>
      </div>
    `;
  }

  dropdown.style.display = 'block';
}

function hideSearchDropdown() {
  const dropdown = document.querySelector('.search-results-dropdown');
  if (dropdown) dropdown.style.display = 'none';
}

function goToProduct(productId) {
  hideSearchDropdown();
  // Add to cart and go to cart, or go to product detail
  window.location.href = 'products.html';
}

function searchAllResults(searchTerm) {
  hideSearchDropdown();
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const results = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm)
  );
  localStorage.setItem('searchResults', JSON.stringify(results));
  localStorage.setItem('searchTerm', searchTerm);
  window.location.href = 'products.html?search=' + encodeURIComponent(searchTerm);
}

/**
 * Handle URL parameters for filters and search
 */
function normalizeCategoryAlias(rawCategory) {
  if (!rawCategory) return 'all';
  const category = rawCategory.toString().trim().toLowerCase();
  const jewelleryKeys = ['jewellery', 'jewelry', 'jewel'];
  const clothingKeys = ['all', 'clothing', 'clothe', 'saree', 'sarees', 'wedding', 'bridal', 'festive', 'silk', 'cotton', 'handloom', 'banarasi', 'chiffon', 'party', 'casual'];
  if (jewelleryKeys.includes(category)) return 'jewellery';
  if (clothingKeys.includes(category)) return 'clothing';
  return category;
}

function normalizeTypeAlias(rawType) {
  if (!rawType) return null;
  const type = rawType.toString().trim().toLowerCase();
  const validTypes = ['silk', 'cotton', 'banarasi', 'handloom', 'ajrakh', 'wedding', 'bridal', 'festive', 'party',
    'maheswari_cotton', 'chanderi_cotton', 'mul_cotton', 'linen_cotton', 'kanjivaram_silk', 'banarasi_silk',
    'tussar_silk', 'soft_silk', 'mysore_silk', 'maheswari_silk', 'patola_silk', 'gajji_silk', 'dola_silk',
    'pashmina_silk', 'khadi', 'jamdani', 'ikat', 'linen', 'earrings', 'necklaces', 'bangles', 'rings', 'handmade_jewellery'];
  return validTypes.includes(type) ? type : null;
}

function getShopTitleForParams(category, type) {
  const typeTitles = {
    wedding: 'Wedding Sarees',
    party: 'Party Wear Sarees',
    bridal: 'Bridal Sarees',
    festive: 'Festive Sarees',
    silk: 'Silk Sarees',
    cotton: 'Cotton Sarees',
    banarasi: 'Banarasi Sarees',
    handloom: 'Handloom Sarees',
    ajrakh: 'Ajrakh Sarees',
    maheshwari_cotton: 'Maheswari Cotton Sarees',
    chanderi_cotton: 'Chanderi Cotton Sarees',
    mul_cotton: 'Mul Cotton Sarees',
    linen_cotton: 'Linen Cotton Sarees',
    kanjivaram_silk: 'Kanjivaram Silk',
    banarasi_silk: 'Banarasi Silk',
    tussar_silk: 'Tussar Silk',
    soft_silk: 'Soft Silk',
    mysore_silk: 'Mysore Silk',
    maheshwari_silk: 'Maheswari Silk',
    patola_silk: 'Patola Silk',
    gajji_silk: 'Gajji Silk',
    dola_silk: 'Dola Silk',
    pashmina_silk: 'Pashmina Silk',
    khadi: 'Khadi Sarees',
    jamdani: 'Jamdani Sarees',
    ikat: 'Ikat Sarees',
    linen: 'Linen Sarees',
    earrings: 'Earrings',
    necklaces: 'Necklaces',
    bangles: 'Bangles',
    rings: 'Rings',
    handmade_jewellery: 'Handmade Jewellery'
  };
  if (type && typeTitles[type]) return typeTitles[type];
  if (category === 'jewellery') return 'Jewellery Collection';
  if (category === 'clothing') return 'Saree Collection';
  return 'All Products';
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const rawCategory = params.get('category');
  const search = params.get('search');
  let rawType = params.get('type');

  const normalizedCategory = normalizeCategoryAlias(rawCategory);
  if (!rawType) {
    rawType = normalizeTypeAlias(rawCategory);
  }
  const normalizedType = normalizeTypeAlias(rawType);

  if (normalizedCategory) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === normalizedCategory);
    });

    const subcategoryFilters = document.getElementById('subcategory-filters');
    if (subcategoryFilters) {
      subcategoryFilters.style.display = normalizedCategory === 'clothing' ? 'flex' : 'none';
    }

    document.querySelectorAll('.subcategory-btn').forEach(btn => {
      btn.classList.toggle('active', normalizedType ? btn.dataset.type === normalizedType : btn.dataset.type === 'all');
    });

    const shopTitle = document.getElementById('shop-title');
    if (shopTitle) shopTitle.textContent = getShopTitleForParams(normalizedCategory, normalizedType);
  }

  if (search) {
    localStorage.setItem('searchTerm', search);
  }
}

const HOMEPAGE_CONFIG_KEY = 'homepageConfig';
let homepageConfig = getHomepageConfig();
let homepageAdminState = {
  editingBannerId: null,
  bannerImageData: null,
};

function getDefaultHomepageConfig() {
  return {
    promoBar: {
      enabled: true,
    },
    categoryNavigation: [
      { label: 'Home', href: 'index.html' },
      { label: 'Wedding', href: 'shop.html?category=wedding' },
      { label: 'Professional Cotton', href: 'shop.html?category=cotton' },
      { label: 'Silk', href: 'shop.html?category=silk' },
      { label: 'Handloom', href: 'shop.html?category=handloom' },
      { label: 'Kota', href: 'shop.html?category=kota' },
      { label: 'Jewellery', href: 'shop.html?category=jewellery' },
      { label: 'New Arrival', href: 'shop.html?sort=new' },
      { label: 'Offers', href: 'shop.html?sort=offers' },
    ],
    heroBanners: [
      {
        id: 'banner-1',
        title: 'Timeless Fashion for Every <em>You</em>',
        subtitle: 'Premium ethnic wear with couture details for unforgettable moments.',
        description: 'Crafted in luxurious fabrics and designed for celebrations, silk weddings and special events.',
        showButton: true,
        desktopImage: 'images/hero_model.png',
        mobileImage: 'images/hero_model.png',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'banner-2',
        title: 'Kanjivaram Elegance for Your Big Day',
        subtitle: 'Handwoven bridal sarees with regal motifs and rich zari craftsmanship.',
        description: 'Perfect for wedding ceremonies and festive occasions, made to make you shine.',
        showButton: true,
        desktopImage: 'images/saree3.png',
        mobileImage: 'images/saree3.png',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'banner-3',
        title: 'Blush Pink Sarees with Premium Shine',
        subtitle: 'Soft, feminine silhouettes designed for festive and family occasions.',
        description: 'Lightweight luxury options with exquisite embroidery and rich finishes.',
        showButton: true,
        desktopImage: 'images/saree4.png',
        mobileImage: 'images/saree4.png',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
      },
    ],
    productSections: [
      {
        id: 'section-latest',
        title: 'Latest Masterpiece',
        subtitle: 'Shop the newest premium arrivals handpicked for luxury styling.',
        isActive: true,
        displayOrder: 1,
        products: [1, 2, 3, 4],
      },
      {
        id: 'section-trending',
        title: 'Trending Collection',
        subtitle: 'The most loved styles for celebrations, parties and elegant evenings.',
        isActive: true,
        displayOrder: 2,
        products: [5, 6, 7, 8],
      },
      {
        id: 'section-premium',
        title: 'Premium Picks',
        subtitle: 'Curated favourites chosen for luxury, comfort and celebration-ready style.',
        isActive: true,
        displayOrder: 3,
        products: [9, 10, 11, 12],
      },
    ],
    brandStory: {
      title: 'A Heritage of Elegance',
      text: 'Shivaay Paridhan brings together handcrafted sarees, luxury textiles and festive couture designed for the modern woman who values tradition, craftsmanship and timeless style.',
      image: 'images/hero_model.png',
    },
  };
}

function getHomepageConfig() {
  const stored = localStorage.getItem(HOMEPAGE_CONFIG_KEY);
  if (stored) {
    try {
      const config = JSON.parse(stored);
      // Ensure Kota category is included in categoryNavigation if not present
      if (config && config.categoryNavigation) {
        const hasKota = config.categoryNavigation.some(item => item.label === 'Kota' || (item.href && item.href.includes('category=kota')));
        if (!hasKota) {
          const defaultNav = getDefaultHomepageConfig().categoryNavigation;
          config.categoryNavigation = defaultNav;
          saveHomepageConfig(config);
        }
      }
      return config;
    } catch (err) {
      console.error('Invalid homepage config, restoring defaults.', err);
    }
  }
  const defaultConfig = getDefaultHomepageConfig();
  saveHomepageConfig(defaultConfig);
  return defaultConfig;
}

function saveHomepageConfig(config) {
  localStorage.setItem(HOMEPAGE_CONFIG_KEY, JSON.stringify(config));
  homepageConfig = config;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getInventoryProducts() {
  if (allProducts && allProducts.length > 0) return allProducts;
  const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
  return storedProducts;
}

function findProductById(productId) {
  const products = getInventoryProducts();
  return products.find(product => String(product.id || product._id) === String(productId));
}

let homepagePromoCoupon = null;

async function loadHomepagePromoCoupon() {
  if (!homepageConfig.promoBar?.enabled) {
    homepagePromoCoupon = null;
    renderHomepagePromoBar();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/coupons`);
    const coupons = await res.json();
    const activeCoupons = (coupons || [])
      .filter(coupon => coupon.isActive && (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date()))
      .sort((a, b) => {
        const left = a.expiryDate ? new Date(a.expiryDate) : new Date(0);
        const right = b.expiryDate ? new Date(b.expiryDate) : new Date(0);
        return left - right;
      });
    homepagePromoCoupon = activeCoupons[0] || null;
  } catch (error) {
    homepagePromoCoupon = null;
  }

  renderHomepagePromoBar();
}

function isOfferExpired(offer) {
  if (!offer || !offer.expiry) return false;
  const expiry = new Date(offer.expiry);
  expiry.setHours(23, 59, 59, 999);
  return expiry < new Date();
}

function renderHomepagePromoBar() {
  const promoBar = document.getElementById('promoBar');
  if (!promoBar) return;
  if (!homepageConfig.promoBar?.enabled || !homepagePromoCoupon) {
    promoBar.style.display = 'none';
    return;
  }

  const coupon = homepagePromoCoupon;
  const label = coupon.discountType === 'percentage'
    ? `Flat ${coupon.discountValue}% Off`
    : `Flat ₹${coupon.discountValue} Off`;

  promoBar.style.display = 'flex';
  promoBar.innerHTML = `
    <span>${escapeHtml(label)} — Use Code: <strong>${escapeHtml(coupon.code)}</strong></span>
  `;
}

function renderBrandStorySection() {
  const story = homepageConfig.brandStory;
  if (!story) return;
  const title = document.querySelector('.story-title');
  const text = document.querySelector('.story-text');
  const image = document.querySelector('.story-image');
  if (title) title.textContent = story.title;
  if (text) text.textContent = story.text;
  if (image) image.src = story.image;
}

function getCanonicalCategoryNavigation() {
  const navItems = homepageConfig && Array.isArray(homepageConfig.categoryNavigation)
    ? homepageConfig.categoryNavigation
    : getDefaultHomepageConfig().categoryNavigation;

  return navItems.map(item => ({
    ...item,
    href: item.href ? item.href.replace(/products\.html/g, 'shop.html') : item.href
  }));
}

function buildNavLinks(items, linkClass = 'nav-menu-link', includeClose = false) {
  return items.map(item => `
    <a href="${item.href}" class="${linkClass}"${includeClose ? ' onclick="closeMenu()"' : ''}>
      ${item.label}
    </a>
  `).join('');
}

function renderPageNavigation() {
  const navItems = getCanonicalCategoryNavigation();
  const isProductsPage = Boolean(document.querySelector('.products-page'));
  const desktopMenu = document.querySelector('.nav-desktop-menu') || document.querySelector('.nav-menu');

  if (desktopMenu) {
    desktopMenu.innerHTML = buildNavLinks(navItems, desktopMenu.classList.contains('nav-menu') ? 'nav-menu-link' : 'nav-menu-link');
  }

  const mobileNav = document.getElementById('nav-links');
  if (mobileNav && isProductsPage) {
    const extras = `
      <a href="products.html" class="nav-link" onclick="closeMenu()">Shop All</a>
      <a href="about.html" class="nav-link" onclick="closeMenu()">About Us</a>
      <a href="contact.html" class="nav-link" onclick="closeMenu()">Contact</a>
      <hr class="nav-divider">
      <a href="login.html" class="nav-link nav-login-btn" onclick="closeMenu()">Login</a>
      <a href="#" class="nav-link logout-btn" onclick="logout(); closeMenu()" style="display:none;">Logout</a>
    `;
    mobileNav.innerHTML = buildNavLinks(navItems, 'nav-link', true) + extras;
  }
}

function getAdminCategoryOptions() {
  return [
    { value: 'wedding', label: 'Wedding' },
    { value: 'cotton', label: 'Professional Cotton' },
    { value: 'silk', label: 'Silk' },
    { value: 'handloom', label: 'Handloom' },
    { value: 'kota', label: 'Kota' },
    { value: 'jewellery', label: 'Jewellery' },
  ];
}

function renderAdminCategoryOptions() {
  const select = document.getElementById('product-category');
  if (!select) return;
  select.innerHTML = '<option value="">Select Category</option>' + getAdminCategoryOptions()
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join('');
}

function getAdminSubcategoryOptions(category) {
  const subcategoryMap = {
    wedding: [
      { value: 'party', label: 'Party Wear Sarees' },
      { value: 'bridal', label: 'Bridal Sarees' }
    ],
    cotton: [
      { value: 'maheswari_cotton', label: 'Maheswari Cotton Sarees' },
      { value: 'chanderi_cotton', label: 'Chanderi Cotton Sarees' },
      { value: 'mul_cotton', label: 'Mul Cotton Sarees' },
      { value: 'linen_cotton', label: 'Linen Cotton Sarees' }
    ],
    silk: [
      { value: 'kanjivaram_silk', label: 'Kanjivaram Silk' },
      { value: 'banarasi_silk', label: 'Banarasi Silk' },
      { value: 'tussar_silk', label: 'Tussar Silk' },
      { value: 'soft_silk', label: 'Soft Silk' },
      { value: 'mysore_silk', label: 'Mysore Silk' },
      { value: 'maheswari_silk', label: 'Maheswari Silk' },
      { value: 'patola_silk', label: 'Patola Silk' },
      { value: 'gajji_silk', label: 'Gajji Silk' },
      { value: 'dola_silk', label: 'Dola Silk' },
      { value: 'pashmina_silk', label: 'Pashmina Silk' }
    ],
    handloom: [
      { value: 'khadi', label: 'Khadi Sarees' },
      { value: 'jamdani', label: 'Jamdani Sarees' },
      { value: 'ikat', label: 'Ikat Sarees' },
      { value: 'linen', label: 'Linen Sarees' }
    ],
    kota: [
      { value: 'kota_silk', label: 'Kota Silk' },
      { value: 'kota_cotton', label: 'Kota Cotton' },
      { value: 'kota_doria', label: 'Kota Doria' }
    ],
    jewellery: [
      { value: 'earrings', label: 'Earrings' },
      { value: 'necklaces', label: 'Necklaces' },
      { value: 'bangles', label: 'Bangles' },
      { value: 'rings', label: 'Rings' },
      { value: 'handmade_jewellery', label: 'Handmade Jewellery' }
    ],
    banarasi: [
      { value: 'banarasi_silk', label: 'Banarasi Silk' }
    ],
    festive: [
      { value: 'party', label: 'Party Wear Sarees' },
      { value: 'bridal', label: 'Bridal Sarees' }
    ]
  };
  return subcategoryMap[category] || [];
}

function renderAdminSubcategoryOptions(category) {
  const select = document.getElementById('product-subcategory');
  if (!select) return;
  const options = getAdminSubcategoryOptions(category);
  select.innerHTML = '<option value="">Select Subcategory</option>' + options
    .map(option => `<option value="${option.value}">${option.label}</option>`)
    .join('');
}

function renderCategoryNavigation() {
  const navContainer = document.getElementById('categoryNav');
  if (!navContainer) return;
  navContainer.innerHTML = '';
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  getCanonicalCategoryNavigation().forEach((item) => {
    const link = document.createElement('a');
    link.className = 'category-link';
    link.href = item.href;
    link.textContent = item.label;
    if (item.href.includes(currentPath) || (currentPath === 'index.html' && item.href === 'index.html')) {
      link.classList.add('active');
    }
    navContainer.appendChild(link);
  });
}


// ============ INITIALIZATION - RUN ON PAGE LOAD ============
document.addEventListener('DOMContentLoaded', () => {
  // Single initialization call - all setup happens here
  initializeApp();
  
  // Global event listeners - bound once
  attachAddToCartListeners();
  attachHomeSliderControls();
});

// Initialize default products if localStorage is empty
function initializeDefaultProducts() {
  const existingProducts = JSON.parse(localStorage.getItem('products')) || [];
  if (existingProducts.length === 0) {
    const defaultProducts = [
      // Silk Sarees
      {
        id: 1,
        name: "Luxury Silk Saree",
        price: 2500,
        category: "clothing",
        type: "silk",
        image: "images/saree1.jpg",
        discount: 20,
        description: "Handwoven silk saree with gold zari work, perfect for weddings and special occasions."
      },
      {
        id: 2,
        name: "Banarasi Silk Saree",
        price: 3500,
        category: "clothing",
        type: "banarasi",
        image: "images/saree1.jpg",
        discount: 15,
        description: "Authentic Banarasi silk with intricate brocade work."
      },
      // Cotton Sarees
      {
        id: 3,
        name: "Pure Cotton Saree",
        price: 950,
        category: "clothing",
        type: "cotton",
        image: "images/kurti1.jpg",
        discount: 10,
        description: "Lightweight pure cotton saree for daily wear."
      },
      {
        id: 4,
        name: "Handloom Cotton",
        price: 1200,
        category: "clothing",
        type: "handloom",
        image: "images/kurti1.jpg",
        discount: 12,
        description: "Traditional handloom cotton saree with natural dyes."
      },
      // Ajrakh
      {
        id: 5,
        name: "Ajrakh Print Saree",
        price: 1800,
        category: "clothing",
        type: "ajrakh",
        image: "images/lehenga1.jpg",
        discount: 18,
        description: "Hand block printed Ajrakh saree with natural colors."
      },
      // Lehengas
      {
        id: 6,
        name: "Traditional Lehenga",
        price: 4500,
        category: "clothing",
        type: "silk",
        image: "images/lehenga1.jpg",
        discount: 25,
        description: "Embroidered lehenga with intricate mirror work and premium fabric."
      },
      {
        id: 7,
        name: "Banarasi Lehenga",
        price: 5500,
        category: "clothing",
        type: "banarasi",
        image: "images/lehenga1.jpg",
        discount: 20,
        description: "Heavy Banarasi brocade lehenga for bridal wear."
      },
      // Jewellery - Necklace Sets
      {
        id: 8,
        name: "Gold Plated Necklace Set",
        price: 2200,
        category: "jewellery",
        type: "necklace",
        image: "images/necklace1.jpg",
        discount: 15,
        description: "Gold plated necklace with matching earrings."
      },
      {
        id: 9,
        name: "Kundan Necklace Set",
        price: 4500,
        category: "jewellery",
        type: "necklace",
        image: "images/necklace1.jpg",
        discount: 20,
        description: "Traditional Kundan work necklace set for special occasions."
      },
      // Earrings
      {
        id: 10,
        name: "Jhumka Earrings",
        price: 850,
        category: "jewellery",
        type: "earrings",
        image: "images/earrings1.jpg",
        discount: 10,
        description: "Traditional golden jhumka earrings with pearl drops."
      },
      {
        id: 11,
        name: "Diamond Look Earrings",
        price: 1200,
        category: "jewellery",
        type: "earrings",
        image: "images/earrings1.jpg",
        discount: 15,
        description: "American diamond studded earrings with modern design."
      },
      // Anklets
      {
        id: 12,
        name: "Silver Anklets",
        price: 650,
        category: "jewellery",
        type: "anklets",
        image: "images/anklets1.jpg",
        discount: 12,
        description: "Sterling silver anklets with traditional bell design."
      },
      // More Clothing - Variety
      {
        id: 13,
        name: "Designer Cotton Kurti",
        price: 750,
        category: "clothing",
        type: "cotton",
        image: "images/kurti1.jpg",
        discount: 18,
        description: "Cotton kurti with hand block printing and modern design."
      },
      {
        id: 14,
        name: "Ajrakh Dupatta",
        price: 950,
        category: "clothing",
        type: "ajrakh",
        image: "images/saree1.jpg",
        discount: 15,
        description: "Hand block printed Ajrakh dupatta in natural colors."
      },
      {
        id: 15,
        name: "Silk Dupatta",
        price: 1200,
        category: "clothing",
        type: "silk",
        image: "images/saree1.jpg",
        discount: 10,
        description: "Pure silk dupatta with zari border."
      },
      {
        id: 16,
        name: "Banarasi Dupatta",
        price: 1800,
        category: "clothing",
        type: "banarasi",
        image: "images/saree1.jpg",
        discount: 20,
        description: "Heavy Banarasi brocade dupatta for festive wear."
      }
    ];
    localStorage.setItem('products', JSON.stringify(defaultProducts));
  }
}

// Main initialization function
async function initializeApp() {
  // Initialize data
//   initializeDefaultProducts();
  
  // Handle URL parameters
  handleUrlParams();
  
  // Setup navigation and search functionality
  initNavigation();
  setupRealTimeSearch();
  
  // Page-specific initializations
  const isAdminPage = document.querySelector('.admin-layout');
  const isProductsPage = document.querySelector('.products-page');
  const isCategoryPage = window.categoryPage && document.querySelector('.product-grid');
  const isHomePage = document.querySelector('.hero') || document.getElementById('featured-products');
  const isCartPage = document.querySelector('.cart');
  const isCheckoutPage = document.querySelector('.checkout');
  const isSuccessPage = document.querySelector('.success');
  const isProductDetailPage = document.querySelector('.product-detail-section');
  
  // Login/Register forms (on login page)
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (loginForm || registerForm) initAuthPage();
  
  // Admin pages
  if (isAdminPage) {
    checkAdminAccess();
    initializeAdminNavigation();
    updateDashboardStats();
    loadAdminProducts();
    initImageUploadPreview();
    renderAdminCategoryOptions();
    
    // Admin-only forms
    const productForm = document.getElementById('product-form');
    const discountForm = document.getElementById('discount-form');
    
    if (productForm) productForm.addEventListener('submit', addProduct);
    if (discountForm) discountForm.addEventListener('submit', applyDiscount);
    
    const policyForm = document.getElementById('policy-form');
    if (policyForm) {
      policyForm.addEventListener('submit', updatePolicies);
      loadAdminPolicies();
    }
  }
  
  // Product listing pages - load data
  if (isProductsPage) {
    await loadAllProducts();
  } else if (isCategoryPage) {
    await loadCategoryProducts(window.categoryPage);
  } else if (isHomePage) {
    await loadHomeProducts();
  }
  
  // Product detail page
  if (isProductDetailPage) {
    await loadProductDetail();
    initAccordion();
  }
  
  // Cart and checkout pages
  if (isCartPage) {
    displayCart();
    setupCartActions();
  }
  
  if (isCheckoutPage) {
    displayCheckout();
    setupCheckoutActions();
  }
  
  if (isSuccessPage) {
    displayOrderSuccess();
  }
  
  // Make product cards clickable on listing pages
  if (isProductsPage || isCategoryPage || isHomePage) {
    makeProductCardsClickable();
  }
  
  // UI updates
  updateAuthUI();
  setupScrollAnimations();
  setupWhatsAppSupport();
}

// Update authentication UI based on user role
function updateAuthUI() {
  const role = localStorage.getItem('role');
  const logoutBtns = document.querySelectorAll('.logout-btn');
  const loginLinks = document.querySelectorAll('a[href="login.html"]');

  if (role) {
    logoutBtns.forEach(btn => btn.style.display = 'inline-block');
    loginLinks.forEach(link => link.style.display = 'none');
    
    // Check if dashboard/profile link already exists
    let dashLink = document.getElementById('dynamic-dash-link');
    if (!dashLink) {
      dashLink = document.createElement('a');
      dashLink.id = 'dynamic-dash-link';
      dashLink.className = 'nav-link';
      dashLink.onclick = closeMenu;
      
      // Determine what link to show based on role
      if (role === 'admin') {
        dashLink.href = 'admin.html';
        dashLink.textContent = 'Admin Dashboard ⚙️';
      } else {
        dashLink.href = 'profile.html';
        dashLink.textContent = 'User Profile 👤';
      }
      
      // Insert before the first logout button
      const firstLogoutBtn = document.querySelector('.logout-btn');
      if (firstLogoutBtn && firstLogoutBtn.parentNode) {
        firstLogoutBtn.parentNode.insertBefore(dashLink, firstLogoutBtn);
      }
    }
  } else {
    logoutBtns.forEach(btn => btn.style.display = 'none');
    loginLinks.forEach(link => link.style.display = 'inline-block');
    
    // Remove dashboard link if it exists
    const dashLink = document.getElementById('dynamic-dash-link');
    if (dashLink) dashLink.remove();
  }
}

// ============ SCROLL ANIMATIONS ============
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  }, observerOptions);

  // Observe about section
  const aboutContent = document.querySelector('.about-content');
  if (aboutContent) {
    observer.observe(aboutContent);
  }
}

// ============ CART FUNCTIONS ============
function attachAddToCartListeners() {
  // Prevent multiple bindings - only bind once
  if (_addToCartListenersBound) return;
  _addToCartListenersBound = true;
  
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-to-cart-btn') && event.target.closest('.product-card')) {
      event.preventDefault();
      const button = event.target;
      const productCard = button.closest('.product-card');
      const productId = productCard.dataset.productId;

      if (!productId) {
        console.error('Product ID not found');
        return;
      }

      addToCart(productId, button);
    }
  });
}

function addToCart(productId, button = null) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Check if product already exists in cart
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    // Increase quantity if already exists
    existingItem.quantity += 1;
  } else {
    // Add new item with quantity 1
    cart.push({
      id: productId,
      quantity: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Visual feedback if button provided
  if (button) {
    const originalText = button.textContent;
    button.textContent = '✓ Added to Cart';
    button.style.backgroundColor = '#4caf50';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
    }, 2000);
  }
}

function displayCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalContainer = document.getElementById('cart-total');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty. <a href="products.html" style="color: var(--accent); font-weight: 700;">Continue Shopping</a></div>';
    if (cartTotalContainer) cartTotalContainer.innerHTML = '';
    return;
  }

  let total = 0;
  cartItemsContainer.innerHTML = cart.map((item, index) => {
    const product = products.find(p => String(p.id) === String(item.id));
    if (!product) return '';

    // Calculate discount pricing
    const hasDiscount = Boolean(product.discount && product.discount > 0);
    const originalPrice = product.price;
    const finalPrice = hasDiscount
      ? Math.round(originalPrice * (1 - product.discount / 100))
      : originalPrice;

    const itemTotal = finalPrice * item.quantity;
    total += itemTotal;

    const priceDisplay = hasDiscount
      ? `<div class="cart-item-price"><span class="final-price">₹${finalPrice.toLocaleString()}</span> <span class="old-price" style="text-decoration: line-through; color: var(--text-light); font-size: 0.85em;">₹${originalPrice.toLocaleString()}</span></div>`
      : `<div class="cart-item-price">₹${originalPrice.toLocaleString()} each</div>`;

    return `
      <div class="cart-item" data-index="${index}">
        <div class="cart-item-image">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${escapeHtml(product.name)}</div>
          ${item.color ? `<div class="cart-item-variant">Color: ${escapeHtml(item.color)}</div>` : ''}
          ${priceDisplay}
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn qty-decrease" data-index="${index}">-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-increase" data-index="${index}">+</button>
        </div>
        <div class="cart-item-total">₹${itemTotal.toLocaleString()}</div>
        <button class="cart-item-remove" data-index="${index}">×</button>
      </div>
    `;
  }).join('');

  if (cartTotalContainer) {
    cartTotalContainer.innerHTML = `
      <div class="cart-summary">
        <div class="cart-total-row">
          <span>Total:</span>
          <span class="cart-total-amount">₹${total.toLocaleString()}</span>
        </div>
        <a href="checkout.html" class="btn btn-primary checkout-btn">Proceed to Checkout</a>
      </div>
    `;
  }
}

function setupCartActions() {
  // Remove item from cart
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('cart-item-remove')) {
      const index = parseInt(event.target.dataset.index);
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(cart));
      displayCart();
    }
  });

  // Decrease quantity
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('qty-decrease')) {
      const index = parseInt(event.target.dataset.index);
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
      }
    }
  });

  // Increase quantity
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('qty-increase')) {
      const index = parseInt(event.target.dataset.index);
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart[index].quantity += 1;
      localStorage.setItem('cart', JSON.stringify(cart));
      displayCart();
    }
  });

  // Clear cart button
  const clearCartButton = document.getElementById('clear-cart');
  if (clearCartButton) {
    clearCartButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('cart');
        displayCart();
      }
    });
  }

  // Checkout button
  const checkoutButton = document.getElementById('checkout');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }
      window.location.href = 'checkout.html';
    });
  }

  const whatsappCartButton = document.getElementById('whatsapp-cart-order');
  if (whatsappCartButton) {
    whatsappCartButton.addEventListener('click', handleCartWhatsAppOrder);
  }
}

function handleCartWhatsAppOrder() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const savedAddress = JSON.parse(localStorage.getItem('savedAddress')) || {};

  const requiredFields = [
    'fullName',
    'phone',
    'flat',
    'area',
    'city',
    'state',
    'pincode'
  ];

  const hasAddress = requiredFields.every(
    field =>
      savedAddress[field] &&
      savedAddress[field].toString().trim().length > 0
  );

  if (!hasAddress) {
    if (
      confirm(
        'Please save your delivery details on the checkout page before placing a WhatsApp order. Go to checkout now?'
      )
    ) {
      window.location.href = 'checkout.html';
    }
    return;
  }

  const products = JSON.parse(localStorage.getItem('products')) || [];

  const orderItems = cart.map(item => {
    const product = products.find(
      p => String(p.id || p._id) === String(item.id || item._id)
    );

    return {
      id: item.id || item._id,
      name: product?.name || item.name || 'Product',
      price: getItemFinalPrice(product),
      quantity: item.quantity || 1,
      color: item.color || ''
    };
  });

  const total = calculateCartTotal();

  // IMPORTANT:
  // Open WhatsApp immediately while still inside the button click.
  const whatsappMessage = createWhatsAppOrderContent(
    savedAddress,
    orderItems,
    total
  );

  const whatsappUrl = buildWhatsAppUrl(whatsappMessage);

  const whatsappWindow = window.open(
    whatsappUrl,
    '_blank'
  );

  // Fallback if browser blocks the new tab.
  if (!whatsappWindow) {
    window.location.href = whatsappUrl;
  }

  // Save order in backend.
  saveOrderToBackend(savedAddress, orderItems, total);
}


function saveOrderToBackend(customerData, orderItems, total) {
  const payload = {
    customer: customerData,
    items: orderItems,
    total: total,
    paymentMethod: 'whatsapp',
    source: 'whatsapp',
    status: 'pending_whatsapp'
  };

  fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(async res => {
      if (!res.ok) {
        throw new Error('Order request failed');
      }

      const data = await res.json();

      if (data.order) {
        localStorage.setItem(
          'lastOrder',
          JSON.stringify(data.order)
        );
      }
    })
    .catch(error => {
      console.error('Backend order save failed:', error);

      // Local fallback
      const orderId =
        'SP' + Date.now().toString(36).toUpperCase();

      const order = {
        id: orderId,
        customer: customerData,
        items: orderItems,
        total: total,
        paymentMethod: 'whatsapp',
        source: 'whatsapp',
        status: 'pending_whatsapp',
        createdAt: new Date().toISOString()
      };

      const orders =
        JSON.parse(localStorage.getItem('orders')) || [];

      orders.push(order);

      localStorage.setItem(
        'orders',
        JSON.stringify(orders)
      );

      localStorage.setItem(
        'lastOrder',
        JSON.stringify(order)
      );
    })
    .finally(() => {
      localStorage.removeItem('cart');

      setTimeout(() => {
        window.location.href = 'success.html';
      }, 1200);
    });
}

function orderOnWhatsAppFromDetail() {
  if (!window.currentProduct) return;

  const product = window.currentProduct;
  const qty = parseInt(document.getElementById('qty')?.value || 1);
  const productName = product.name || 'Product';
  const price = getItemFinalPrice(product);
  const totalPrice = price * qty;
  const productUrl = window.location.href;

  const message = `Hello Shivaay Paridhan,\n\nI am interested in ordering:\n\n` +
    `📦 Product: ${productName}\n` +
    `💰 Price: ₹${totalPrice.toLocaleString()}${qty > 1 ? ` (${qty} × ₹${price.toLocaleString()})` : ''}\n` +
    `🔗 Link: ${productUrl}\n\n` +
    `Please share availability and ordering details.`;

  window.open(buildWhatsAppUrl(message), '_blank');
}

// ============ AUTHENTICATION ============

// --- Password validation helper ---
function checkPasswordStrength(password) {
  return {};
}

function isPasswordValid(password) {
  return typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
}

// --- Real-time password validation UI ---
function updatePasswordRules(password, rulesContainerId, strengthFillId, strengthLabelId) {
  // Removed password criteria
}

function updateConfirmPasswordMatch(passwordId, confirmId, matchRuleId) {
  const password = document.getElementById(passwordId);
  const confirm = document.getElementById(confirmId);
  const matchRule = document.getElementById(matchRuleId);
  if (!password || !confirm || !matchRule) return;

  const icon = matchRule.querySelector('.rule-icon');
  if (confirm.value.length === 0) {
    matchRule.classList.remove('valid', 'invalid');
    if (icon) icon.textContent = '○';
  } else if (password.value === confirm.value) {
    matchRule.classList.add('valid');
    matchRule.classList.remove('invalid');
    if (icon) icon.textContent = '✓';
  } else {
    matchRule.classList.add('invalid');
    matchRule.classList.remove('valid');
    if (icon) icon.textContent = '✗';
  }
}

// --- Toggle Password Visibility ---
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// --- Auth Alert ---
function showAuthAlert(type, message) {
  const alertEl = document.getElementById('auth-alert');
  if (!alertEl) return;
  const iconEl = alertEl.querySelector('.alert-icon');
  const msgEl = alertEl.querySelector('.alert-msg');
  
  alertEl.className = 'auth-alert show ' + type;
  if (iconEl) iconEl.textContent = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  if (msgEl) msgEl.textContent = message;

  // Auto-hide after 6 seconds
  clearTimeout(alertEl._timer);
  alertEl._timer = setTimeout(() => {
    alertEl.classList.remove('show');
  }, 6000);
}

function hideAuthAlert() {
  const alertEl = document.getElementById('auth-alert');
  if (alertEl) alertEl.classList.remove('show');
}

// --- Button Loading State ---
function setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

// --- Tab / Form Switching ---
function showLogin() {
  hideAuthAlert();
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotFlow = document.getElementById('forgot-password-flow');
  const tabs = document.getElementById('auth-tabs');

  if (loginForm) { loginForm.classList.add('active'); }
  if (registerForm) { registerForm.classList.remove('active'); }
  if (forgotFlow) { forgotFlow.classList.remove('active'); }
  if (tabs) { tabs.style.display = 'flex'; }

  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns[0]) tabBtns[0].classList.add('active');
  if (tabBtns[1]) tabBtns[1].classList.remove('active');
}

function showRegister() {
  hideAuthAlert();
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotFlow = document.getElementById('forgot-password-flow');
  const tabs = document.getElementById('auth-tabs');

  if (loginForm) { loginForm.classList.remove('active'); }
  if (registerForm) { registerForm.classList.add('active'); }
  if (forgotFlow) { forgotFlow.classList.remove('active'); }
  if (tabs) { tabs.style.display = 'flex'; }

  const tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns[0]) tabBtns[0].classList.remove('active');
  if (tabBtns[1]) tabBtns[1].classList.add('active');
}

function showForgotPassword() {
  hideAuthAlert();
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotFlow = document.getElementById('forgot-password-flow');
  const tabs = document.getElementById('auth-tabs');

  if (loginForm) { loginForm.classList.remove('active'); }
  if (registerForm) { registerForm.classList.remove('active'); }
  if (forgotFlow) { forgotFlow.classList.add('active'); }
  if (tabs) { tabs.style.display = 'none'; }

  // Reset to step 1
  showForgotStep(1);
}

// --- Forgot Password Step Navigation ---
let _forgotIdentifier = '';
let _forgotOtp = '';
let _resendTimer = null;

function showForgotStep(step) {
  // Hide all steps
  document.querySelectorAll('.forgot-step').forEach(s => s.style.display = 'none');

  // Show target step
  const stepEl = document.getElementById(step === 'success' ? 'forgot-step-success' : `forgot-step-${step}`);
  if (stepEl) stepEl.style.display = 'block';

  // Update step indicators
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const line = document.getElementById(`step-line-${i > 1 ? i - 1 : i}`);
    if (dot) {
      dot.classList.remove('active', 'completed');
      if (i < step) dot.classList.add('completed');
      else if (i === step) dot.classList.add('active');
    }
  }
  // Lines
  const line1 = document.getElementById('step-line-1');
  const line2 = document.getElementById('step-line-2');
  if (line1) { line1.classList.toggle('completed', step > 1); line1.classList.toggle('active', step === 1); }
  if (line2) { line2.classList.toggle('completed', step > 2); line2.classList.toggle('active', step === 2); }
}

// --- Handle Login (Backend API) ---
async function handleLogin(event) {
  event.preventDefault();
  hideAuthAlert();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showAuthAlert('error', 'Please enter both email and password.');
    return;
  }

  setButtonLoading('login-submit', true);

  try {
    const loginUrl = `${API_BASE_URL}/api/auth/login`;
    console.log('Attempting login at:', loginUrl);

    const res = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthAlert('error', data.message || 'Login failed.');
      setButtonLoading('login-submit', false);
      return;
    }

// Save authentication state
localStorage.setItem('role', data.user.role || 'user');
localStorage.setItem('currentUser', JSON.stringify(data.user));

if (data.token) {
  localStorage.setItem('authToken', data.token);
}

    showAuthAlert('success', 'Login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);
  } catch (err) {
    console.error('Login error:', err);
    // Robust network error detection
    const isNetworkError = err instanceof TypeError || (err.message && (err.message.includes('fetch') || err.message.includes('network')));
    const msg = isNetworkError 
      ? 'Cannot connect to server. Please ensure the backend is running on port 5000 and MongoDB is active.'
      : (err.message || 'Login failed. Please try again.');
    showAuthAlert('error', msg);
    setButtonLoading('login-submit', false);
  }
}

// --- Handle Register (Backend API) ---
async function handleRegister(event) {
  event.preventDefault();
  hideAuthAlert();

  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const phone = document.getElementById('register-phone').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  if (!name || !email || !phone || !password || !confirmPassword) {
    showAuthAlert('error', 'Please fill in all fields.');
    return;
  }

  // Validate password meets minimum 4 characters
  if (!isPasswordValid(password)) {
    showAuthAlert('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number.');
    return;
  }

  if (password !== confirmPassword) {
    showAuthAlert('error', 'Passwords do not match.');
    return;
  }

  setButtonLoading('register-submit', true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.errors ? data.errors.join(', ') : data.message;
      showAuthAlert('error', errorMsg || 'Registration failed.');
      setButtonLoading('register-submit', false);
      return;
    }

    showAuthAlert('success', '✓ Registration successful! You can now login.');
    document.getElementById('register-form').reset();
    // Reset password rules UI
    updatePasswordRules('', 'register-password-rules', 'register-strength-fill', 'register-strength-label');

    setTimeout(() => showLogin(), 1500);
  } catch (err) {
    console.error('Register error:', err);
    const isNetworkError = err instanceof TypeError || (err.message && (err.message.includes('fetch') || err.message.includes('network')));
    const msg = isNetworkError
      ? 'Cannot connect to server. Please ensure the backend is running on port 5000.'
      : (err.message || 'Registration failed. Please try again.');
    showAuthAlert('error', msg);
  } finally {
    setButtonLoading('register-submit', false);
  }
}

// --- Handle Forgot Password (Step 1) ---
async function handleForgotPassword() {
  hideAuthAlert();
  const identifier = document.getElementById('forgot-identifier').value.trim();

  if (!identifier) {
    showAuthAlert('error', 'Please enter your email or mobile number.');
    return;
  }

  setButtonLoading('forgot-send-btn', true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthAlert('error', data.message || 'Failed to send OTP.');
      setButtonLoading('forgot-send-btn', false);
      return;
    }

    _forgotIdentifier = identifier;
    const maskedEl = document.getElementById('masked-email');
    if (maskedEl) maskedEl.textContent = data.email || identifier;

    showAuthAlert('success', 'OTP sent! Check your email/console.');
    showForgotStep(2);
    startResendTimer();
    // Focus first OTP input
    const firstOtp = document.querySelector('.otp-digit[data-index="0"]');
    if (firstOtp) firstOtp.focus();
  } catch (err) {
    console.error('Forgot password error:', err);
    showAuthAlert('error', 'Unable to connect to server.');
  } finally {
    setButtonLoading('forgot-send-btn', false);
  }
}

// --- Handle Verify OTP (Step 2) ---
async function handleVerifyOtp() {
  hideAuthAlert();
  const otpDigits = document.querySelectorAll('.otp-digit');
  let otp = '';
  otpDigits.forEach(d => otp += d.value);

  if (otp.length !== 6) {
    showAuthAlert('error', 'Please enter the complete 6-digit OTP.');
    return;
  }

  setButtonLoading('verify-otp-btn', true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: _forgotIdentifier, otp })
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthAlert('error', data.message || 'OTP verification failed.');
      setButtonLoading('verify-otp-btn', false);
      return;
    }

    _forgotOtp = otp;
    showAuthAlert('success', 'OTP verified successfully!');
    showForgotStep(3);
    clearInterval(_resendTimer);
  } catch (err) {
    console.error('OTP verification error:', err);
    showAuthAlert('error', 'Unable to connect to server.');
  } finally {
    setButtonLoading('verify-otp-btn', false);
  }
}

// --- Handle Reset Password (Step 3) ---
async function handleResetPassword() {
  hideAuthAlert();
  const newPassword = document.getElementById('reset-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;

  if (!newPassword || !confirmPassword) {
    showAuthAlert('error', 'Please fill in all fields.');
    return;
  }

  // Validate password meets minimum 4 characters
  if (!isPasswordValid(newPassword)) {
    showAuthAlert('error', 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number.');
    return;
  }

  if (newPassword !== confirmPassword) {
    showAuthAlert('error', 'Passwords do not match.');
    return;
  }

  setButtonLoading('reset-password-btn', true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: _forgotIdentifier, otp: _forgotOtp, newPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.errors ? data.errors.join(', ') : data.message;
      showAuthAlert('error', errorMsg || 'Password reset failed.');
      setButtonLoading('reset-password-btn', false);
      return;
    }

    showForgotStep('success');
    hideAuthAlert();
  } catch (err) {
    console.error('Reset password error:', err);
    showAuthAlert('error', 'Unable to connect to server.');
  } finally {
    setButtonLoading('reset-password-btn', false);
  }
}

// --- Resend OTP with 30-second cooldown ---
async function handleResendOtp() {
  hideAuthAlert();
  setButtonLoading('forgot-send-btn', true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: _forgotIdentifier })
    });

    const data = await res.json();

    if (!res.ok) {
      showAuthAlert('error', data.message || 'Failed to resend OTP.');
      return;
    }

    showAuthAlert('success', 'New OTP sent! Check your email/console.');
    startResendTimer();
    // Clear existing OTP inputs
    document.querySelectorAll('.otp-digit').forEach(d => { d.value = ''; d.classList.remove('filled'); });
    const firstOtp = document.querySelector('.otp-digit[data-index="0"]');
    if (firstOtp) firstOtp.focus();
  } catch (err) {
    showAuthAlert('error', 'Unable to connect to server.');
  } finally {
    setButtonLoading('forgot-send-btn', false);
  }
}

function startResendTimer() {
  const resendBtn = document.getElementById('resend-btn');
  const timerSpan = document.getElementById('resend-timer');
  if (!resendBtn) return;

  let seconds = 30;
  resendBtn.disabled = true;
  if (timerSpan) timerSpan.textContent = `(${seconds}s)`;

  clearInterval(_resendTimer);
  _resendTimer = setInterval(() => {
    seconds--;
    if (timerSpan) timerSpan.textContent = seconds > 0 ? `(${seconds}s)` : '';
    if (seconds <= 0) {
      clearInterval(_resendTimer);
      resendBtn.disabled = false;
    }
  }, 1000);
}

// --- OTP Input Handlers ---
function initOtpInputs() {
  const otpGroup = document.getElementById('otp-input-group');
  if (!otpGroup) return;

  const digits = otpGroup.querySelectorAll('.otp-digit');
  digits.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val.slice(0, 1);
      if (val) {
        e.target.classList.add('filled');
        // Move to next input
        if (idx < digits.length - 1) digits[idx + 1].focus();
      } else {
        e.target.classList.remove('filled');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        digits[idx - 1].focus();
        digits[idx - 1].value = '';
        digits[idx - 1].classList.remove('filled');
      }
    });

    // Handle paste
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      pasteData.split('').forEach((char, i) => {
        if (digits[i]) {
          digits[i].value = char;
          digits[i].classList.add('filled');
        }
      });
      const nextIdx = Math.min(pasteData.length, digits.length - 1);
      digits[nextIdx].focus();
    });
  });
}

// --- Init Auth Page Event Listeners ---
function initAuthPage() {
  // Register password validation
  const regPassword = document.getElementById('register-password');
  const regConfirm = document.getElementById('register-confirm-password');
  const regSubmit = document.getElementById('register-submit');

  if (regPassword) {
    regPassword.addEventListener('input', () => {
      updatePasswordRules(regPassword.value, 'register-password-rules', 'register-strength-fill', 'register-strength-label');
      updateConfirmPasswordMatch('register-password', 'register-confirm-password', 'confirm-match-rule');
      updateRegisterSubmitState();
    });
  }

  if (regConfirm) {
    regConfirm.addEventListener('input', () => {
      updateConfirmPasswordMatch('register-password', 'register-confirm-password', 'confirm-match-rule');
      updateRegisterSubmitState();
    });
  }

  // Reset password validation
  const resetPassword = document.getElementById('reset-password');
  const resetConfirm = document.getElementById('reset-confirm-password');

  if (resetPassword) {
    resetPassword.addEventListener('input', () => {
      updatePasswordRules(resetPassword.value, 'reset-password-rules', 'reset-strength-fill', 'reset-strength-label');
      updateConfirmPasswordMatch('reset-password', 'reset-confirm-password', 'reset-confirm-match-rule');
      updateResetSubmitState();
    });
  }

  if (resetConfirm) {
    resetConfirm.addEventListener('input', () => {
      updateConfirmPasswordMatch('reset-password', 'reset-confirm-password', 'reset-confirm-match-rule');
      updateResetSubmitState();
    });
  }

  // Init OTP inputs
  initOtpInputs();
}

function updateRegisterSubmitState() {
  const password = document.getElementById('register-password');
  const confirm = document.getElementById('register-confirm-password');
  const btn = document.getElementById('register-submit');
  if (!password || !confirm || !btn) return;

  // Enable: password >= 4 chars AND confirm matches AND both non-empty
  const valid = isPasswordValid(password.value) && password.value === confirm.value && confirm.value.length > 0;
  btn.disabled = !valid;
}

function updateResetSubmitState() {
  const password = document.getElementById('reset-password');
  const confirm = document.getElementById('reset-confirm-password');
  const btn = document.getElementById('reset-password-btn');
  if (!password || !confirm || !btn) return;

  const valid = isPasswordValid(password.value) && password.value === confirm.value && confirm.value.length > 0;
  btn.disabled = !valid;
}

function checkAdminAccess() {
  const role = localStorage.getItem('role');
  if (role !== 'admin') {
    alert('Access Denied - Admin only');
    window.location.href = 'login.html';
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = 'index.html';
  }
}

// ============ ADMIN - PRODUCT MANAGEMENT ============


/**
 * Save product to localStorage with generated ID
 */
function saveProductToLocalStorage(productData) {
  let products = JSON.parse(localStorage.getItem('products')) || [];

  // Generate new ID
  const newId = products.length > 0
    ? Math.max(...products.map(p => p.id || 0)) + 1
    : 1;

  const newProduct = {
    id: newId,
    ...productData,
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  localStorage.setItem('products', JSON.stringify(products));
}

// ============ ADMIN - SIDEBAR NAVIGATION ============
function initializeAdminNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links
      sidebarLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Hide all sections
      const sections = document.querySelectorAll('.admin-section');
      sections.forEach(section => section.classList.remove('active'));
      
      // Show selected section
      const sectionId = link.getAttribute('data-section') + '-section';
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Load section data
      loadSectionData(link.getAttribute('data-section'));
    });
  });
}

function loadSectionData(section) {
  switch(section) {
    case 'dashboard':
      updateDashboardStats();
      break;
    case 'users':
      loadUsers();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'products':
      loadAdminProducts();
      break;
    case 'coupons':
      loadCoupons();
      break;
    case 'discounts':
      loadCurrentDiscount();
      break;
  }
}

// ============ ADMIN - DASHBOARD STATS ============
async function updateDashboardStats() {
  try {
    const token = localStorage.getItem('authToken');

const res = await fetch(`${API_BASE_URL}/api/dashboard-stats`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
    if (res.ok) {
      const stats = await res.json();
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('total-users', stats.users || 0);
      set('total-orders', stats.orders || 0);
      set('total-products', stats.products || 0);
      set('total-revenue', `\u20B9${(stats.revenue || 0).toLocaleString('en-IN')}`);

      // Recent orders
      const recentEl = document.getElementById('recent-orders-list');
      if (recentEl && stats.recentOrders && stats.recentOrders.length > 0) {
        recentEl.innerHTML = stats.recentOrders.map(o => {
          const statusLabel = o.status === 'pending_whatsapp' ? 'Pending WhatsApp' : `${o.status?.charAt(0).toUpperCase() + o.status?.slice(1)}`;
          const sourceBadge = o.orderSource === 'whatsapp' ? '<span style="font-size:0.7rem;color:var(--gold);font-weight:700;">WhatsApp</span>' : '';
          return `
            <div class="recent-order-row">
              <span class="order-id">#${o.orderId || o._id?.slice(-6).toUpperCase()}</span>
              <span class="order-customer">${escapeHtml(o.customer?.name || 'Guest')} ${sourceBadge}</span>
              <span class="order-amount">\u20B9${(o.total||0).toLocaleString('en-IN')}</span>
              <span class="order-status status-${o.status}">${statusLabel}</span>
            </div>`;
        }).join('');
      } else if (recentEl) {
        recentEl.innerHTML = '<p style="color:#999;padding:16px">No orders yet.</p>';
      }
      return;
    }
  } catch(e) { /* fallback below */ }

  // Fallback: localStorage
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('total-users', 0);
  set('total-orders', orders.length);
  set('total-products', products.length);
  set('total-revenue', `\u20B9${orders.reduce((s,o)=>s+(o.total||0),0).toLocaleString('en-IN')}`);
}

// ============ ADMIN - USER MANAGEMENT ============
async function loadUsers() {
  const container = document.getElementById('users-container');
  if (!container) return;

  container.innerHTML = `<div style="padding:40px;text-align:center;color:#999;">
    <div style="font-size:2rem;margin-bottom:8px;">⏳</div>Loading users...
  </div>`;

  try {
    const token = localStorage.getItem('authToken');

const res = await fetch(`${API_BASE_URL}/api/users`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
    if (!res.ok) throw new Error('Failed to fetch users');
    const users = await res.json();

    if (!users || users.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:60px;color:#999;">
        <div style="font-size:3rem;margin-bottom:12px;">👥</div>
        <p style="font-size:1rem;">No users registered yet.</p>
      </div>`;
      return;
    }

    container.innerHTML = `
      <!-- Summary bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <span style="background:rgba(201,168,76,0.12);color:var(--gold);padding:6px 16px;border-radius:50px;font-size:0.82rem;font-weight:700;">
            👥 Total: ${users.length}
          </span>
          <span style="background:rgba(239,68,68,0.1);color:#dc2626;padding:6px 16px;border-radius:50px;font-size:0.82rem;font-weight:700;">
            🔑 Admins: ${users.filter(u => u.role === 'admin').length}
          </span>
          <span style="background:rgba(34,197,94,0.1);color:#16a34a;padding:6px 16px;border-radius:50px;font-size:0.82rem;font-weight:700;">
            🙋 Users: ${users.filter(u => u.role === 'user').length}
          </span>
        </div>
      </div>

      <!-- Table -->
      <div style="background:#fff;border-radius:18px;box-shadow:0 12px 36px rgba(0,0,0,0.06);overflow:hidden;border:1px solid rgba(0,0,0,0.04);">
        <!-- Table Header -->
        <div style="display:grid;grid-template-columns:40px 1.8fr 2fr 1.2fr 1fr 1.2fr;gap:0;padding:14px 20px;background:var(--black);color:rgba(255,255,255,0.7);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
          <span>#</span>
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Role</span>
          <span>Registered</span>
        </div>

        <!-- Table Rows -->
        <div id="user-table-body">
          ${users.map((user, idx) => `
            <div style="display:grid;grid-template-columns:40px 1.8fr 2fr 1.2fr 1fr 1.2fr;gap:0;padding:14px 20px;
              border-bottom:1px solid #f5f5f5;font-size:0.88rem;align-items:center;
              transition:background 0.15s;cursor:default;
              ${idx % 2 === 0 ? '' : 'background:#fafafa;'}"
              onmouseover="this.style.background='rgba(201,168,76,0.05)'"
              onmouseout="this.style.background='${idx % 2 === 0 ? '' : '#fafafa'}'">

              <span style="color:#bbb;font-size:0.78rem;font-weight:600;">${idx + 1}</span>

              <span style="font-weight:600;color:var(--black);display:flex;align-items:center;gap:8px;">
                <span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),#d4a843);
                  display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:0.8rem;font-weight:700;flex-shrink:0;">
                  ${escapeHtml(user.name?.charAt(0)?.toUpperCase() || '?')}
                </span>
                ${escapeHtml(user.name || 'Unknown')}
              </span>

              <span style="color:#555;">${escapeHtml(user.email || '—')}</span>

              <span style="color:#555;">${escapeHtml(user.phone || '—')}</span>

              <span>
                <span style="padding:3px 12px;border-radius:50px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
                  background:${user.role === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'};
                  color:${user.role === 'admin' ? '#dc2626' : '#16a34a'};">
                  ${user.role === 'admin' ? '🔑 Admin' : '🙋 User'}
                </span>
              </span>

              <span style="color:#999;font-size:0.82rem;">
                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Security Note -->
      <div style="margin-top:16px;padding:12px 18px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;font-size:0.8rem;color:#92400e;">
        🔒 <strong>Security:</strong> Passwords are stored as bcrypt hashes and are never visible — not even to admin. This is by design.
      </div>
    `;
  } catch (err) {
    console.error('loadUsers error:', err);
    container.innerHTML = `<div style="text-align:center;padding:60px;color:#999;">
      <div style="font-size:2.5rem;margin-bottom:12px;">⚠️</div>
      <p>Could not load users. Make sure the backend server is running.</p>
      <button onclick="loadUsers()" style="margin-top:16px;padding:10px 24px;background:var(--gold);border:none;border-radius:8px;font-weight:600;cursor:pointer;">Retry</button>
    </div>`;
  }
}

// ============ ADMIN - ORDER MANAGEMENT ============
async function loadOrders() {
  const container = document.getElementById('orders-container');
  if (!container) return;

  container.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">Loading orders...</div>';

  try {
    const res = await fetch(`${API_BASE_URL}/api/orders`);
    if (!res.ok) throw new Error();
    const orders = await res.json();

    if (orders.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">No orders placed yet.</div>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card" style="background:#fff;border-radius:18px;padding:32px;margin-bottom:24px;box-shadow:0 12px 36px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.04);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <h3 style="font-family:var(--font-heading);font-size:1rem;color:var(--black);margin-bottom:4px;">#${order.orderId || order._id?.slice(-8).toUpperCase()}</h3>
            ${order.orderSource === 'whatsapp' ? '<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;font-weight:700;color:var(--gold);margin-bottom:6px;">💬 WhatsApp Order</span>' : ''}
            <p style="font-size:0.85rem;color:#999;">${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span class="order-status status-${order.status}" style="padding:5px 14px;border-radius:50px;font-size:0.78rem;font-weight:600;background:${statusColor(order.status)};color:#fff;">${order.status === 'pending_whatsapp' ? 'Pending WhatsApp' : order.status.toUpperCase()}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.88rem;margin-bottom:16px;">
          <p><strong>Customer:</strong> ${escapeHtml(order.customer?.name || 'N/A')}</p>
          <p><strong>Phone:</strong> ${escapeHtml(order.customer?.phone || 'N/A')}</p>
          <p><strong>City:</strong> ${escapeHtml(order.customer?.city || order.customer?.area || 'N/A')}</p>
          <p><strong>Pincode:</strong> ${escapeHtml(order.customer?.pincode || 'N/A')}</p>
          <p><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase() || 'COD'}</p>
          <p><strong>Total:</strong> <strong style="color:var(--gold);">\u20B9${(order.total||0).toLocaleString('en-IN')}</strong></p>
        </div>
        <div style="margin-bottom:16px;">
          <p style="font-size:0.78rem;font-weight:600;text-transform:uppercase;color:var(--gold);margin-bottom:8px;">Items</p>
          ${(order.items||[]).map(item=>`<p style="font-size:0.85rem;">• ${escapeHtml(item.name||item.id)} &times; ${item.quantity||1}</p>`).join('')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <label style="font-size:0.82rem;font-weight:600;">Update Status:</label>
          <select onchange="updateOrderStatus('${order._id}', this.value)" style="padding:6px 12px;border:1.5px solid #ddd;border-radius:8px;font-family:var(--font-body);font-size:0.82rem;">
            <option value="pending" ${order.status==='pending'?'selected':''}>Pending</option>
            <option value="pending_whatsapp" ${order.status==='pending_whatsapp'?'selected':''}>Pending WhatsApp</option>
            <option value="confirmed" ${order.status==='confirmed'?'selected':''}>Confirmed</option>
            <option value="shipped" ${order.status==='shipped'?'selected':''}>Shipped</option>
            <option value="delivered" ${order.status==='delivered'?'selected':''}>Delivered</option>
            <option value="cancelled" ${order.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Could not load orders. Check backend.</div>';
  }
}

function statusColor(s) {
  const map = {
    pending: '#f59e0b',
    pending_whatsapp: '#f59e0b',
    confirmed: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444'
  };
  return map[s] || '#999';
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      // Show toast instead of alert
      showAdminToast(`Order status updated to: ${status}`);
    }
  } catch (e) {
    showAdminToast('Failed to update status', 'error');
  }
}

function showAdminToast(msg, type = 'success') {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 24px;border-radius:10px;font-size:0.9rem;font-weight:600;z-index:9999;transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.style.background = type === 'error' ? '#ef4444' : '#22c55e';
  t.style.color = '#fff';
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ============ ADMIN - DISCOUNT MANAGEMENT ============
function applyDiscount(event) {
  event.preventDefault();
  
  const percentage = parseFloat(document.getElementById('discount-percentage').value);
  const category = document.getElementById('discount-category').value;
  
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    alert('Please enter a valid discount percentage (0-100)');
    return;
  }
  
  const discount = {
    percentage: percentage,
    category: category || null,
    appliedAt: new Date().toISOString()
  };
  
  localStorage.setItem('globalDiscount', JSON.stringify(discount));
  
  // Apply discount to products
  applyDiscountToProducts(discount);
  
  alert(`✓ ${percentage}% discount applied ${category ? `to ${category} category` : 'to all products'}!`);
  
  // Clear form
  document.getElementById('discount-form').reset();
  
  // Reload displays
  loadCurrentDiscount();
  loadAdminProducts();
  updateDashboardStats();
}

function applyDiscountToProducts(discount) {
  let products = JSON.parse(localStorage.getItem('products')) || [];
  
  products.forEach(product => {
    // Store original price if not already stored
    if (!product.originalPrice) {
      product.originalPrice = product.price;
    }
    
    // Apply discount if category matches or no category specified
    if (!discount.category || product.category === discount.category) {
      product.price = Math.round(product.originalPrice * (1 - discount.percentage / 100));
      product.discount = discount.percentage;
    }
  });
  
  localStorage.setItem('products', JSON.stringify(products));
}

function clearDiscount() {
  if (!confirm('Are you sure you want to clear all discounts? This will restore original prices.')) {
    return;
  }
  
  // Remove discount
  localStorage.removeItem('globalDiscount');
  
  // Restore original prices
  let products = JSON.parse(localStorage.getItem('products')) || [];
  
  products.forEach(product => {
    if (product.originalPrice) {
      product.price = product.originalPrice;
      product.discount = 0;
      delete product.originalPrice;
    }
  });
  
  localStorage.setItem('products', JSON.stringify(products));
  
  alert('✓ All discounts cleared and original prices restored!');
  
  // Reload displays
  loadCurrentDiscount();
  loadAdminProducts();
  updateDashboardStats();
}

function loadCurrentDiscount() {
  const display = document.getElementById('current-discount-display');
  if (!display) return;
  
  const discount = JSON.parse(localStorage.getItem('globalDiscount'));
  
  if (discount) {
    display.innerHTML = `
      <p><strong>${discount.percentage}% discount</strong> ${discount.category ? `applied to ${discount.category} category` : 'applied to all products'}</p>
      <p style="font-size: 0.9rem; color: var(--text-secondary);">Applied on ${new Date(discount.appliedAt).toLocaleString()}</p>
    `;
  } else {
    display.innerHTML = '<p>No active discount</p>';
  }
}

// ============ PRODUCT DISPLAY & LOADING ============

/**
 * Load all products with strict once-only fetching and cached filtering
 */
/**
 * loadAllProducts — stable, single-pass render.
 * Shows skeleton → fetches once → renders. Never re-fetches unless forceRefresh=true.
 */
async function loadAllProducts(forceRefresh = false) {
  const container = document.getElementById('product-container');
  if (!container) return;

  // Show skeleton only first time
  if (!_fetched && allProducts.length === 0) {
    container.innerHTML = renderSkeletons(6);
  }

  if (forceRefresh) {
    _fetched = false; isFetched = false; _fetchPromise = null;
  }

  await fetchProductsFromBackend();

  const products = applyProductFilters(allProducts);
  // Apply sorting if requested (sort-select on collection page)
  const sortSelect = document.getElementById('sort-select');
  const sortVal = sortSelect ? sortSelect.value : (window.currentSort || 'featured');
  let sortedProducts = [...products];
  try {
    switch (sortVal) {
      case 'price-asc': sortedProducts.sort((a,b)=>Number(a.price)-Number(b.price)); break;
      case 'price-desc': sortedProducts.sort((a,b)=>Number(b.price)-Number(a.price)); break;
      case 'newest': /* no createdAt field — keep original order */ break;
      case 'popularity': /* unknown metric, keep original order */ break;
      case 'featured': default: break;
    }
  } catch(e) { /* ignore sort errors */ }

  updateShopHeader(products.length);

  const noResults = document.getElementById('no-results');
  if (products.length === 0) {
    container.innerHTML = '';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  if (noResults) noResults.style.display = 'none';

  // Build HTML once and set — no repeated DOM mutations
  const html = sortedProducts.map(p => renderProductCard(p)).join('');
  container.innerHTML = html;
}

/** Called by the sorting dropdown to re-render products */
function applySort() {
  const sel = document.getElementById('sort-select');
  if (sel) window.currentSort = sel.value;
  if (!_isRenderingProducts) loadAllProducts();
}

/** Generate skeleton placeholder cards */
function renderSkeletons(count) {
  return Array(count).fill(0).map(() => `
    <div class="product-card skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="card-info">
        <div class="skeleton skeleton-text" style="width:60%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-text" style="width:40%;height:12px"></div>
      </div>
    </div>`).join('');
}

/**
 * Apply all active filters to products
 */
function applyProductFilters(products) {
  const priceFilter = document.getElementById('price-filter');
  const categoryFilter = document.querySelector('.filter-btn.active[data-category]');
  const subcategoryFilter = document.querySelector('.subcategory-btn.active[data-type]');

  let filtered = [...products];

  // Apply price filter
  if (priceFilter && priceFilter.value) {
    const maxPrice = parseInt(priceFilter.value);
    filtered = filtered.filter(p => p.price <= maxPrice);
  }

  // Apply category filter
  if (categoryFilter && categoryFilter.dataset.category !== 'all') {
    const category = categoryFilter.dataset.category;
    filtered = filtered.filter(p => {
      const productCategory = (p.category || '').toString().toLowerCase();
      if (category === 'clothing') {
        return ['clothing', 'saree', 'sarees'].includes(productCategory);
      }
      return productCategory === category;
    });
  }

  // Apply subcategory/type filter
  if (subcategoryFilter && subcategoryFilter.dataset.type !== 'all') {
    const type = subcategoryFilter.dataset.type;
    filtered = filtered.filter(p => (p.type || '').toString().toLowerCase() === type);
  }

  // Material filters (checkboxes)
  const selectedMaterials = Array.from(document.querySelectorAll('.filter-checkbox.material:checked')).map(n=>n.value.toString().toLowerCase());
  if (selectedMaterials.length > 0) {
    filtered = filtered.filter(p => selectedMaterials.includes((p.material || '').toString().toLowerCase()));
  }

  // Color filters (checkboxes) — product may have `colors` array or comma list
  const selectedColors = Array.from(document.querySelectorAll('.filter-checkbox.color:checked')).map(n=>n.value.toString().toLowerCase());
  if (selectedColors.length > 0) {
    filtered = filtered.filter(p => {
      const cols = [];
      if (Array.isArray(p.colors)) cols.push(...p.colors.map(c=>c.toString().toLowerCase()));
      else if (typeof p.colors === 'string' && p.colors.length) cols.push(...p.colors.split(',').map(s=>s.trim().toLowerCase()));
      // also check name as a fallback
      if (p.name) cols.push(...p.name.toString().toLowerCase().split(' '));
      return selectedColors.some(sc => cols.includes(sc));
    });
  }

  return filtered;
}

/**
 * Update shop header with results count
 */
function updateShopHeader(count) {
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = `${count} product${count !== 1 ? 's' : ''}`;
  }
}

/**
 * Set category filter
 */
function setCategoryFilter(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  const subcategoryFilters = document.getElementById('subcategory-filters');
  if (subcategoryFilters) {
    subcategoryFilters.style.display = category === 'clothing' ? 'flex' : 'none';
  }

  document.querySelectorAll('.subcategory-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === 'all');
  });

  const shopTitle = document.getElementById('shop-title');
  if (shopTitle) {
    const titles = {
      'all': 'All Products',
      'saree': 'Saree Collection',
      'jewellery': 'Jewellery Collection',
      'clothing': 'All Products'
    };
    shopTitle.textContent = titles[category] || 'All Products';
  }

  loadAllProducts();
}

/**
 * Set subcategory/type filter
 */
function setSubcategoryFilter(type) {
  // Update active button
  document.querySelectorAll('.subcategory-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Reload products only if not already rendering
  if (!_isRenderingProducts) {
    loadAllProducts();
  }
}

/**
 * Apply filters with debounce
 */
let filterDebounceTimer;
function applyFilters() {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    if (!_isRenderingProducts) {
      loadAllProducts();
    }
  }, 250);
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  // Reset price filter
  const priceFilter = document.getElementById('price-filter');
  if (priceFilter) priceFilter.value = '';

  // Reset category to all (without calling loadAllProducts)
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === 'all');
  });
  
  // Update title
  const shopTitle = document.getElementById('shop-title');
  if (shopTitle) shopTitle.textContent = 'All Products';

  // Reset subcategory
  document.querySelectorAll('.subcategory-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === 'all');
  });

  // Single reload
  loadAllProducts();
}

/**
 * Fetch products from backend - strictly once
 */
/**
 * fetchProductsFromBackend — guaranteed single-fetch, no re-entry.
 * Returns the same promise for concurrent callers.
 */
async function fetchProductsFromBackend() {
  // If already fetched, return cached immediately
  if (_fetched) return allProducts;
  // If a fetch is in flight, wait for it
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      const remoteProducts = data.map(p => ({
        id: p._id || p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice || p.price,
        images: p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
        image: p.images && p.images.length > 0 ? p.images[0] : (p.image || ''),
        category: p.category || 'saree',
        type: p.type || 'silk',
        material: p.material || '',
        discount: p.discount || 0,
        description: p.description || '',
        colors: p.colors || [],
        quantity: p.stock || p.quantity || 1,
        stock: p.stock || p.quantity || 1,
        specifications: p.specifications || '',
        productCare: p.productCare || '',
        moreInfo: p.moreInfo || '',
        // Offer / Countdown Timer Fields
        offerLabel:     p.offerLabel     || '',
        offerDiscount:  Number(p.offerDiscount) || 0,
        offerStartDate: p.offerStartDate || null,
        offerEndDate:   p.offerEndDate   || null
      }));

      // Backend is the single source of truth
      allProducts = remoteProducts;
      localStorage.setItem('products', JSON.stringify(remoteProducts));
    } catch (err) {
      console.error('Fetch failed, using localStorage cache:', err);
      allProducts = JSON.parse(localStorage.getItem('products')) || [];
    } finally {
      _fetched = true;
      isFetched = true;
      _productsLoaded = true;
      _fetchPromise = null; // clear so forceRefresh works
    }
    return allProducts;
  })();

  return _fetchPromise;
}

/**
 * Load category-specific products
 */
async function loadCategoryProducts(category) {
  const container = document.querySelector('.product-grid');
  if (!container) return;

  // Show loading state if empty
  if (allProducts.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">Loading...</div>';
    await fetchProductsFromBackend();
  }
  
  // Filter by category from global variable
  const filteredProducts = allProducts.filter(p => p.category === category);

  if (filteredProducts.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No products in this category yet.</div>';
    return;
  }

  const html = filteredProducts.map(product => renderProductCard(product)).join('');
  if (container.innerHTML !== html) {
    container.innerHTML = html;
  }
}

/**
 * Load home page products
 */
async function loadHomeProducts() {
  // Fetch if needed
  if (allProducts.length === 0) {
    await fetchProductsFromBackend();
  }
  
  const trendingContainer = document.getElementById('trending-slider');
  const discountContainer = document.getElementById('discount-slider');
  const featuredContainer = document.getElementById('featured-products');

  // Load featured products (first 8 products)
  if (featuredContainer) {
    const featuredProducts = allProducts.slice(0, 8);
    const html = featuredProducts.map(product => renderProductCard(product)).join('');
    if (featuredContainer.innerHTML !== html) {
      featuredContainer.innerHTML = html;
    }
  }

  // Load trending products (next 6 products)
  if (trendingContainer) {
    const trendingProducts = allProducts.slice(0, 6);
    const html = trendingProducts.map(product => renderSliderCard(product)).join('');
    if (trendingContainer.innerHTML !== html) {
      trendingContainer.innerHTML = html;
    }
  }

  // Load discounted products
  if (discountContainer) {
    const discountedProducts = allProducts.filter(product => product.discount && product.discount > 0);
    const html = discountedProducts.length > 0
      ? discountedProducts.map(product => renderSliderCard(product, true)).join('')
      : '<div class="slider-empty">No discounted products available right now.</div>';
    if (discountContainer.innerHTML !== html) {
      discountContainer.innerHTML = html;
    }
  }
}

function renderSliderCard(product, showDiscount = false) {
  const discount = Number(product.discount) || 0;
  const originalPrice = Number(product.originalPrice || product.price) || 0;
  const finalPrice = Number(product.price) || originalPrice;
  const savings = originalPrice - finalPrice;
  const hasDiscount = discount > 0 && savings > 0;
  
  const role = localStorage.getItem('role');
  const productId = product.id || product._id;
  
  const actionButtons = role === 'admin'
    ? `<button onclick="deleteProduct('${productId}')" class="btn btn-danger">Delete</button>`
    : `<button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
       <button onclick="buyNow('${productId}')" class="btn btn-secondary">Order on WhatsApp</button>`;

  const imageUrl = product.images && product.images.length > 0
    ? resolveImageUrl(product.images[0])
    : resolveImageUrl(product.image);

  const badgeDisplay = hasDiscount
    ? `<div class="card-badge discount-badge">
         <span class="discount-percent">${discount}% OFF</span>
       </div>`
    : '';

  return `
    <div class="product-card slider-card" data-product-id="${productId}" onclick="openProductDetail('${productId}', event)">
      ${badgeDisplay}
      <div class="card-image-wrap">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" class="card-img" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        ${hasDiscount ? `<div class="limited-offer-tag">Limited Offer</div>` : ''}
        <button class="wishlist-icon-btn ${isWishlisted(productId) ? 'active' : ''}" onclick="toggleWishlist('${productId}', event)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted(productId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="card-info">
        <h3 class="card-name">${escapeHtml(product.name)}</h3>
        <div class="card-price-wrap">
          <span class="card-price">₹${finalPrice.toLocaleString()}</span>
          ${hasDiscount ? `<span class="card-old-price">₹${originalPrice.toLocaleString()}</span>` : ''}
        </div>
        ${product.description ? `<p class="product-description">${escapeHtml(product.description)}</p>` : ''}
        <div class="card-footer">
          ${actionButtons}
        </div>
      </div>
    </div>`;
}

function attachHomeSliderControls() {
  // Prevent multiple bindings - only bind once
  if (_sliderControlsBound) return;
  _sliderControlsBound = true;
  
  const arrows = document.querySelectorAll('.slider-arrow');
  arrows.forEach(button => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) return;
      const distance = target.clientWidth * 0.85;
      const direction = button.classList.contains('right') ? 1 : -1;
      target.scrollBy({ left: direction * distance, behavior: 'smooth' });
    });
  });
}

// Auto-scroll disabled to prevent flickering
// function startSliderAutoScroll(slider) { ... }

/**
 * Setup category filters
 */
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const container = document.getElementById('product-grid');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      button.classList.add('active');

      const category = button.dataset.category;
      let filteredProducts;

      if (category === 'all') {
        filteredProducts = products;
      } else {
        filteredProducts = products.filter(product => product.category === category);
      }

      container.innerHTML = '';
      if (filteredProducts.length > 0) {
        container.innerHTML = filteredProducts.map(product => renderProductCard(product)).join('');
      } else {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No products found in this category.</div>';
      }
    });
  });
}

/**
 * Load admin products display
 */
async function loadAdminProducts() {
  const container = document.getElementById('admin-products-container');
  if (!container) return;

  container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">Loading products...</div>';

  let products = [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    if (response.ok) {
      products = await response.json();
    }
  } catch (e) {
    // Fallback to localStorage
    products = JSON.parse(localStorage.getItem('products')) || [];
  }

  if (products.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#999;">No products added yet. Use the form above to add your first product!</div>';
    return;
  }

  container.innerHTML = products.map(product => {
    const productId = product._id || product.id;
    const offer = getOfferState(product);
    const discount = Number(product.discount) || 0;
    const originalPrice = Number(product.originalPrice || product.price) || 0;
    const finalPrice = Number(product.price) || originalPrice;
    const offerDiscount = Number(product.offerDiscount) || 0;
    const offerPrice = offer.active && offerDiscount > 0
      ? Math.max(0, Math.round(finalPrice * (1 - offerDiscount / 100)))
      : finalPrice;
    const savings = originalPrice - finalPrice;
    const offerSavings = originalPrice - offerPrice;
    const hasDiscount = !offer.expired && ((discount > 0 && savings > 0) || (offer.active && offerDiscount > 0 && offerSavings > 0));
    const stockVal = product.stock || product.quantity || 0;

    // Get first image URL — Cloudinary URLs are absolute https:// links
    let imageUrl = 'images/placeholder.jpg';
    if (product.images && product.images.length > 0) {
      imageUrl = resolveImageUrl(product.images[0]);
    } else if (product.image) {
      imageUrl = resolveImageUrl(product.image);
    }

    return `
    <div class="product-card admin-product-card" data-product-id="${productId}">
      <button class="delete-btn" onclick="deleteProduct('${productId}')" title="Delete Product">×</button>
      ${hasDiscount ? `<div class="card-badge discount-badge"><span class="discount-percent">${offer.active && offerDiscount > 0 ? offerDiscount : discount}% OFF</span></div>` : ''}
      <div class="card-image-wrap">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" class="card-img" loading="lazy" onerror="this.src='images/placeholder.jpg'">
      </div>
      <div class="card-info">
        <h3 class="card-name">${escapeHtml(product.name)}</h3>
        <div class="card-price-wrap">
          ${offer.active && offerDiscount > 0 ? `
            <span class="card-old-price" style="text-decoration:line-through; color:#888; font-size:0.9rem;">₹${finalPrice.toLocaleString()}</span>
            <span class="card-price" style="color:#c0392b;">₹${offerPrice.toLocaleString()}</span>
          ` : `
            <span class="card-price">₹${finalPrice.toLocaleString()}</span>
            ${hasDiscount ? `<span class="card-old-price">₹${originalPrice.toLocaleString()}</span>` : ''}
          `}
        </div>
        <p style="font-size:0.78rem;color:#888;margin-top:2px;"><strong>${escapeHtml(product.category || '')}</strong>${product.material ? ` · ${escapeHtml(product.material)}` : ''}</p>
        <p class="card-stock ${stockVal > 0 ? 'in-stock' : 'out-of-stock'}">● ${stockVal > 0 ? `In Stock (${stockVal})` : 'Out of Stock'}</p>
        ${product.images && product.images.length > 1 ? `<p style="font-size:0.72rem;color:var(--gold);margin-top:4px;">📷 ${product.images.length} images</p>` : ''}
      </div>
    </div>
  `}).join('');
}


function renderProductCard(product) {
  const role = localStorage.getItem('role');
  const productId = product.id || product._id;

  // Compute offer state FIRST
  const offer = getOfferState(product);

  const discount = Number(product.discount) || 0;
  const originalPrice = Number(product.originalPrice || product.price) || 0;
  const finalPrice = Number(product.price) || originalPrice;
  const offerDiscount = Number(product.offerDiscount) || 0;
  const offerPrice = offer.active && offerDiscount > 0
    ? Math.max(0, Math.round(finalPrice * (1 - offerDiscount / 100)))
    : finalPrice;
  const savings = originalPrice - finalPrice;
  const offerSavings = originalPrice - offerPrice;
  const isLowStock = (product.stock || product.quantity || 0) > 0 &&
                     (product.stock || product.quantity || 0) <= 5;

  // If offer is expired, treat as no discount for display
  const hasDiscount = !offer.expired && ((discount > 0 && savings > 0) || (offer.active && offerDiscount > 0 && offerSavings > 0));

  const actionButtons = role === 'admin'
    ? `<button onclick="deleteProduct('${productId}')" class="btn btn-danger">Delete</button>`
    : `<button class="btn btn-primary add-to-cart-btn">Add to Cart</button>
       <button onclick="buyNow('${productId}')" class="btn btn-secondary">Order on WhatsApp</button>`;

  const priceDisplay = offer.expired
    ? `<div class="card-price">₹${originalPrice.toLocaleString()}</div>`
    : offer.active && offerDiscount > 0
      ? `<div class="card-price-wrap" style="display:flex; align-items:baseline; gap:8px;">
           <span class="card-old-price" style="text-decoration:line-through; color:#888; font-size:0.95rem;">₹${finalPrice.toLocaleString()}</span>
           <span class="card-price" style="color:#c0392b; font-size:1.2rem; font-weight:700;">₹${offerPrice.toLocaleString()}</span>
         </div>`
      : hasDiscount
        ? `<div class="card-price-wrap" style="display:flex; align-items:baseline; gap:8px;">
             <span class="card-old-price" style="text-decoration:line-through; color:#888; font-size:0.95rem;">₹${originalPrice.toLocaleString()}</span>
             <span class="card-price" style="color:#c0392b; font-size:1.2rem; font-weight:700;">₹${finalPrice.toLocaleString()}</span>
           </div>`
        : `<div class="card-price">₹${finalPrice.toLocaleString()}</div>`;

  const badgeDisplay = offer.active && offerDiscount > 0
    ? `<div class="card-badge-top-left">BEST SELLER</div>
       <div class="card-badge-top-right discount-badge">${offer.active && offerDiscount > 0 ? offerDiscount : discount}% OFF</div>`
    : hasDiscount
      ? `<div class="card-badge-top-left">BEST SELLER</div>
         <div class="card-badge-top-right discount-badge">${offer.active && offerDiscount > 0 ? offerDiscount : discount}% OFF</div>`
      : '';

  const limitedOffer = '';

  // Show only the 1st image in shop card — Cloudinary URLs are absolute https:// links
  let imageUrl = 'images/placeholder.jpg';
  if (product.images && product.images.length > 0) {
    imageUrl = resolveImageUrl(product.images[0]);
  } else if (product.image) {
    imageUrl = resolveImageUrl(product.image);
  }

  // Build card timer HTML if offer is active
  offer._lowStock = isLowStock;
  const cardTimerHtml = offer.active
    ? buildCardTimerHTML(productId, offer)
    : offer.expired
      ? `<div class="card-offer-expired">⏰ Offer Expired</div>`
      : '';
      
  const savingsText = hasDiscount ? `<div class="card-savings">You Save ₹${savings.toLocaleString()} (${offer.active && offerDiscount > 0 ? offerDiscount : discount}% OFF)</div>` : '';

  const cardHtml = `
    <div class="product-card" data-product-id="${productId}" onclick="openProductDetail('${productId}', event)">
      ${offer.active ? `<div class="flash-sale-shimmer"></div>` : ''}
      <div class="card-image-wrap">
        ${badgeDisplay}
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" class="card-img" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        ${limitedOffer}
        ${cardTimerHtml}
        <button class="wishlist-icon-btn ${isWishlisted(productId) ? 'active' : ''}" onclick="toggleWishlist('${productId}', event)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${isWishlisted(productId) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="card-info">
        <h3 class="card-name">${escapeHtml(product.name)}</h3>
        ${priceDisplay}
        ${savingsText}
        <div class="card-footer">
          <button class="btn btn-outline" style="flex:1" onclick="openProductDetail('${productId}', event)">View Details</button>
          <button class="btn btn-icon btn-cart" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid #ddd; border-radius: 4px;" onclick="addToCart('${productId}', event)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Register timer AFTER the HTML is in the DOM (deferred via requestAnimationFrame)
  if (offer.active && offer.endDate) {
    // Use a tiny delay so the DOM element exists before we register
    setTimeout(() => {
      OfferTimerEngine.register(
        productId,
        offer.endDate,
        [`ct-${productId}`]
      );
    }, 50);
  }

  return cardHtml;
}


function openProductDetail(productId, event) {
  if (event && (event.target.closest('button') || event.target.closest('.product-actions'))) {
    return;
  }
  window.location.href = `product.html?id=${productId}`;
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  try {
    const token = localStorage.getItem('authToken');

const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
  method: "DELETE",
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

    if (response.ok) {
      alert('✓ Product deleted successfully');
      allProducts = allProducts.filter(p => String(p.id) !== String(id));
      localStorage.setItem('products', JSON.stringify(allProducts));
      
      if (document.querySelector('.admin-layout')) {
        loadAdminProducts();
        updateDashboardStats();
      } else {
        loadAllProducts(true);
      }
    }
  } catch (err) {
    console.error('Delete failed:', err);
  }
}

/**
 * Add a new product via admin panel — smooth UX with loading + success
 */
async function addProduct(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.getElementById('submit-product-btn');
  const successMsg = document.getElementById('form-success');

  // Show loading state
  if (submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
  }
  if (successMsg) successMsg.classList.remove('show');

  const formData = new FormData(form);

  // Build final FormData with correct field names for backend
  const finalFormData = new FormData();
  finalFormData.append('name', formData.get('product-name') || '');
  finalFormData.append('price', formData.get('product-price') || '0');
  finalFormData.append('originalPrice', formData.get('product-old-price') || formData.get('product-price') || '0');
  const rawCategoryValue = formData.get('product-category') || 'silk';
  const rawSubcategoryValue = formData.get('product-subcategory') || '';
  const normalizedCategory = ['jewellery'].includes(rawCategoryValue.toString().trim().toLowerCase()) ? 'jewellery' : 'clothing';
  const normalizedType = rawSubcategoryValue
    ? rawSubcategoryValue.toString().trim().toLowerCase()
    : (['silk','cotton','kota','banarasi','handloom','wedding','festive','earrings','necklaces','bangles','rings','handmade_jewellery'].includes(rawCategoryValue.toString().trim().toLowerCase())
      ? rawCategoryValue.toString().trim().toLowerCase()
      : (rawCategoryValue.toString().trim().toLowerCase() === 'jewellery' ? 'jewellery' : 'silk'));

  finalFormData.append('category', normalizedCategory);
  finalFormData.append('colors', formData.get('product-colors') || '');
  finalFormData.append('material', formData.get('product-material') || '');
  finalFormData.append('stock', formData.get('product-quantity') || '1');
  finalFormData.append('quantity', formData.get('product-quantity') || '1');
  finalFormData.append('discount', formData.get('product-discount') || '0');
  finalFormData.append('description', formData.get('product-description') || '');
  finalFormData.append('specifications', formData.get('product-specifications') || '');
  finalFormData.append('productCare', formData.get('product-care') || '');
  finalFormData.append('moreInfo', formData.get('product-moreinfo') || '');
  finalFormData.append('type', normalizedType);
  // Offer countdown timer fields
  finalFormData.append('offerLabel',     formData.get('product-offer-label') || '');
  finalFormData.append('offerDiscount',  formData.get('product-offer-discount') || '0');
  finalFormData.append('offerStartDate', formData.get('product-offer-start') || '');
  finalFormData.append('offerEndDate',   formData.get('product-offer-end')   || '');

  // Append images from the file input
  const imageInput = document.getElementById('product-images');
  if (imageInput && imageInput.files) {
    for (let i = 0; i < imageInput.files.length; i++) {
      finalFormData.append('images', imageInput.files[i]);
    }
  }

  try {
    const token = localStorage.getItem('authToken');

if (!token) {
  alert('Please login as admin first.');
  return;
}

const response = await fetch(`${API_BASE_URL}/api/products`, {
  method: "POST",
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: finalFormData
});

    if (response.ok) {
      // Show success message
      if (successMsg) {
        successMsg.textContent = '✅ Product added successfully!';
        successMsg.classList.add('show');
        setTimeout(() => successMsg.classList.remove('show'), 4000);
      }
      form.reset();
      clearImagePreviews();
      
      // CRITICAL: Clear the fetch cache so shop page gets fresh products
      _fetched = false;
      _fetchPromise = null;
      isFetched = false;
      allProducts = [];
      
      // Refresh admin products list
      await loadAdminProducts();
      updateDashboardStats();
      
      // Force reload shop page products if product container exists
      if (document.getElementById('product-container')) {
        await loadAllProducts(true);
      }
    } else {
      const err = await response.json();
      throw new Error(err.message || 'Server returned an error');
    }
  } catch (error) {
    console.error("Add product failed or backend unavailable:", error);
    
    // Fallback: Save to localStorage locally
    const rawCategoryValue = formData.get('product-category') || 'silk';
    const rawSubcategoryValue = formData.get('product-subcategory') || '';
    const normalizedCategory = ['jewellery'].includes(rawCategoryValue.toString().trim().toLowerCase()) ? 'jewellery' : 'clothing';
    const normalizedType = rawSubcategoryValue
      ? rawSubcategoryValue.toString().trim().toLowerCase()
      : (['silk','cotton','kota','banarasi','handloom','wedding','festive','earrings','necklaces','bangles','rings','handmade_jewellery'].includes(rawCategoryValue.toString().trim().toLowerCase())
        ? rawCategoryValue.toString().trim().toLowerCase()
        : (rawCategoryValue.toString().trim().toLowerCase() === 'jewellery' ? 'jewellery' : 'silk'));

    const productData = {
      name: formData.get('product-name'),
      price: parseFloat(formData.get('product-price')),
      originalPrice: parseFloat(formData.get('product-old-price') || formData.get('product-price')),
      category: normalizedCategory,
      material: formData.get('product-material'),
      colors: formData.get('product-colors') ? formData.get('product-colors').split(',').map(c => c.trim()) : [],
      quantity: parseInt(formData.get('product-quantity') || 1),
      stock: parseInt(formData.get('product-quantity') || 1),
      discount: parseInt(formData.get('product-discount') || 0),
      description: formData.get('product-description'),
      specifications: formData.get('product-specifications'),
      productCare: formData.get('product-care'),
      moreInfo: formData.get('product-moreinfo') || '',
      type: normalizedType,
      offerLabel: formData.get('product-offer-label') || '',
      offerDiscount: parseFloat(formData.get('product-offer-discount') || 0),
      offerStartDate: formData.get('product-offer-start') || null,
      offerEndDate: formData.get('product-offer-end') || null,
      image: 'images/placeholder.jpg',
      images: ['images/placeholder.jpg']
    };
    
    // Use Object URLs for local images if available
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      try {
        const fileUrls = Array.from(imageInput.files).map(file => URL.createObjectURL(file));
        productData.images = fileUrls;
        productData.image = fileUrls[0];
      } catch (e) {
        console.error('Could not create object URL for local fallback', e);
      }
    }
    
    saveProductToLocalStorage(productData);
    if (successMsg) {
      successMsg.textContent = '✅ Product saved locally (backend offline)';
      successMsg.classList.add('show');
      setTimeout(() => successMsg.classList.remove('show'), 4000);
    }
    form.reset();
    clearImagePreviews();
    loadAdminProducts();
    updateDashboardStats();
  } finally {
    // Remove loading state
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }
}

/**
 * Refresh the product cache from backend/localStorage and reload admin/shop views.
 */
async function refreshProductCache() {
  const button = document.getElementById('refresh-products-btn');
  const defaultLabel = button ? button.textContent : 'Refresh Product Cache';
  if (button) {
    button.disabled = true;
    button.textContent = 'Refreshing...';
  }

  let products = [];
  try {
    products = await fetchProductsFromBackend();
    localStorage.setItem('products', JSON.stringify(products));
    if (button) {
      button.textContent = 'Products Refreshed';
    }
  } catch (err) {
    console.error('Refresh product cache failed:', err);
    products = JSON.parse(localStorage.getItem('products')) || [];
    if (button) {
      button.textContent = 'Refresh Failed';
    }
  }

  if (document.querySelector('.admin-layout')) {
    await loadAdminProducts();
  }

  if (document.querySelector('.collections-nav')) {
    await loadShopProducts();
  }

  setTimeout(() => {
    if (button) {
      button.disabled = false;
      button.textContent = defaultLabel;
    }
  }, 1800);
}

/**
 * Initialize image upload preview and drag-and-drop
 */
function initImageUploadPreview() {
  const imageInput = document.getElementById('product-images');
  const uploadArea = document.getElementById('image-upload-area');
  const previewGrid = document.getElementById('image-preview-grid');
  const countInfo = document.getElementById('image-count-info');

  if (!imageInput || !uploadArea) return;

  // Track selected files (since FileList is read-only)
  window._selectedImageFiles = [];

  // File input change handler
  imageInput.addEventListener('change', () => {
    handleImageSelection(imageInput.files);
  });

  // Drag and drop handlers
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleImageSelection(e.dataTransfer.files);
    }
  });
}

function handleImageSelection(files) {
  const previewGrid = document.getElementById('image-preview-grid');
  const countInfo = document.getElementById('image-count-info');
  if (!previewGrid) return;

  const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  
  // Merge with existing (cap at 5)
  window._selectedImageFiles = (window._selectedImageFiles || []).concat(newFiles).slice(0, 5);
  
  renderImagePreviews();
  
  // Update the actual file input with a new DataTransfer
  try {
    const dt = new DataTransfer();
    window._selectedImageFiles.forEach(f => dt.items.add(f));
    document.getElementById('product-images').files = dt.files;
  } catch (e) {
    // Fallback for older browsers — files already in the array
  }
}

function renderImagePreviews() {
  const previewGrid = document.getElementById('image-preview-grid');
  const countInfo = document.getElementById('image-count-info');
  if (!previewGrid) return;

  const files = window._selectedImageFiles || [];
  
  previewGrid.innerHTML = files.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="preview-item" style="animation-delay:${idx * 0.05}s">
        <img src="${url}" alt="Preview ${idx + 1}">
        <button type="button" class="remove-preview" onclick="removeImagePreview(${idx})" title="Remove">×</button>
        ${idx === 0 ? '<span class="preview-badge">Main</span>' : ''}
      </div>
    `;
  }).join('');

  if (countInfo) {
    if (files.length > 0) {
      countInfo.innerHTML = `<span class="image-count-badge">📷 ${files.length}/5 image${files.length !== 1 ? 's' : ''} selected</span>`;
    } else {
      countInfo.innerHTML = '';
    }
  }
}

function removeImagePreview(index) {
  if (!window._selectedImageFiles) return;
  window._selectedImageFiles.splice(index, 1);
  renderImagePreviews();
  
  // Update file input
  try {
    const dt = new DataTransfer();
    window._selectedImageFiles.forEach(f => dt.items.add(f));
    document.getElementById('product-images').files = dt.files;
  } catch (e) {}
}

function clearImagePreviews() {
  window._selectedImageFiles = [];
  const previewGrid = document.getElementById('image-preview-grid');
  const countInfo = document.getElementById('image-count-info');
  if (previewGrid) previewGrid.innerHTML = '';
  if (countInfo) countInfo.innerHTML = '';
}

/**
 * Update global policies via admin
 */
async function updatePolicies(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    shippingPolicy: document.getElementById('shipping-policy').value,
    returnPolicy: document.getElementById('return-policy').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showAdminToast("✓ Policies updated successfully!");
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    console.error("Policy update failed, falling back to localStorage:", error);
    localStorage.setItem('adminPolicies', JSON.stringify(data));
    showAdminToast("✓ Policies updated successfully! (Local storage)");
  }
}

async function loadAdminPolicies() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/policies`);
    if (response.ok) {
      const data = await response.json();
      const shippingInput = document.getElementById('shipping-policy');
      const returnInput = document.getElementById('return-policy');
      if (shippingInput) shippingInput.value = data.shippingPolicy || '';
      if (returnInput) returnInput.value = data.returnPolicy || '';
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    console.error("Load policies failed, falling back to localStorage:", error);
    const localData = JSON.parse(localStorage.getItem('adminPolicies'));
    if (localData) {
      const shippingInput = document.getElementById('shipping-policy');
      const returnInput = document.getElementById('return-policy');
      if (shippingInput) shippingInput.value = localData.shippingPolicy || '';
      if (returnInput) returnInput.value = localData.returnPolicy || '';
    }
  }
}


function buyNow(productId) {
  // Find the product from stored products list
  const products = JSON.parse(localStorage.getItem('products')) || [];
  const product = products.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
  const productName = product?.name || 'Product';
  const price = product ? getItemFinalPrice(product) : 0;
  const productUrl = window.location.href;

  const message = `Hello Shivaay Paridhan,\n\nI am interested in ordering:\n\n` +
    `📦 Product: ${productName}\n` +
    `💰 Price: ₹${price.toLocaleString()}\n` +
    `🔗 Link: ${productUrl}\n\n` +
    `Please share availability and ordering details.`;

  window.open(buildWhatsAppUrl(message), '_blank');
}

/**
 * Simple debounce helper
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Resolve a product image path to a full displayable URL.
 *
 * Priority order:
 *  1. Absolute Cloudinary / external URL (https://...) → returned as-is
 *  2. Legacy /uploads/... path (pre-Cloudinary) → prepend API_BASE_URL for backward-compat
 *  3. Relative filename (e.g. "placeholder.jpg") → prepend 'images/'
 *
 * This makes images work correctly regardless of whether they were uploaded
 * before or after the Cloudinary migration, and regardless of server restarts.
 */
function resolveImageUrl(img) {
  if (!img || typeof img !== 'string') return 'images/placeholder.jpg';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;       // Cloudinary / external
  if (img.startsWith('/uploads')) return `${API_BASE_URL}${img}`;                 // Legacy local (backward compat)
  if (img.startsWith('images/') || img.startsWith('./images/')) return img;       // Already relative path
  return `images/${img}`;                                                          // Bare filename
}


// ============ CART FUNCTIONS ============

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalContainer = document.getElementById('cart-total');
  if (!cartItemsContainer || !cartTotalContainer) return;

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">Your cart is empty. <a href="products.html" style="color:var(--gold);">Continue Shopping</a></div>';
    cartTotalContainer.innerHTML = '';
    const checkoutBtn = document.getElementById('checkout');
    const clearCartBtn = document.getElementById('clear-cart');
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    if (clearCartBtn) clearCartBtn.style.display = 'none';
    return;
  }

  let total = 0;
  
  cartItemsContainer.innerHTML = cart.map((item, index) => {
    const product = products.find(p => String(p.id) === String(item.id));
    if (!product) return '';
    
    const itemTotal = product.price * item.quantity;
    total += itemTotal;
    
    let imageUrl = 'images/placeholder.jpg';
    if (product.images && product.images.length > 0) {
      imageUrl = resolveImageUrl(product.images[0]);
    } else if (product.image) {
      imageUrl = resolveImageUrl(product.image);
    }

    return `
      <div class="cart-item" style="display:flex;align-items:center;gap:20px;background:#fff;padding:20px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" style="width:80px;height:100px;object-fit:cover;border-radius:8px;">
        <div style="flex:1;">
          <h3 style="font-family:var(--font-heading);font-size:1.1rem;margin-bottom:4px;">${escapeHtml(product.name)}</h3>
          <p style="font-size:0.9rem;color:#888;margin-bottom:8px;">${item.color ? `Color: ${item.color}` : ''}</p>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;border:1px solid #ddd;border-radius:6px;overflow:hidden;">
              <button onclick="updateCartItemQty('${item.id}', '${item.color || ''}', -1)" style="padding:4px 10px;background:#f5f5f5;border:none;cursor:pointer;">-</button>
              <span style="padding:4px 12px;font-size:0.9rem;font-weight:600;">${item.quantity}</span>
              <button onclick="updateCartItemQty('${item.id}', '${item.color || ''}', 1)" style="padding:4px 10px;background:#f5f5f5;border:none;cursor:pointer;">+</button>
            </div>
            <button onclick="removeCartItem('${item.id}', '${item.color || ''}')" style="background:none;border:none;color:#dc3545;font-size:0.85rem;font-weight:600;cursor:pointer;text-decoration:underline;">Remove</button>
          </div>
        </div>
        <div style="text-align:right;font-family:var(--font-heading);font-size:1.1rem;font-weight:600;color:var(--black);">
          ₹${itemTotal.toLocaleString()}
        </div>
      </div>
    `;
  }).join('');

  cartTotalContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:1rem;color:#888;">
        <span>Subtotal:</span>
        <span>₹${total.toLocaleString()}</span>
      </div>
      ${appliedCoupon ? `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:1rem;color:var(--coupon-success);font-weight:600;">
          <span>Coupon Discount (${appliedCoupon.couponCode}):</span>
          <span>- ₹${appliedCoupon.discountAmount.toLocaleString()}</span>
        </div>
      ` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
        <span>Total:</span>
        <span style="color:var(--gold);">₹${(appliedCoupon ? total - appliedCoupon.discountAmount : total).toLocaleString()}</span>
      </div>
    </div>
  `;
  
  // Update persistent applied coupon state on reload
  const savedCoupon = JSON.parse(localStorage.getItem('appliedCoupon'));
  if (savedCoupon && !appliedCoupon) {
    appliedCoupon = savedCoupon;
    renderAppliedCouponTag(savedCoupon.couponCode, savedCoupon.discountAmount);
    renderCart(); // re-render once to show total correctly
  }
  
  const finalTotal = (appliedCoupon ? total - appliedCoupon.discountAmount : total);

  // Update mobile sticky checkout total
  const mobileTotalEl = document.getElementById('mobile-checkout-total');
  if (mobileTotalEl) mobileTotalEl.textContent = `₹${finalTotal.toLocaleString()}`;

  const checkoutBtn = document.getElementById('checkout');
  const clearCartBtn = document.getElementById('clear-cart');
  if (checkoutBtn) checkoutBtn.style.display = 'inline-flex';
  if (clearCartBtn) clearCartBtn.style.display = 'inline-flex';

  // Show mobile CTA on small screens when cart has items
  const mobileNav = document.querySelector('.cart-mobile-cta');
  if (mobileNav) {
    if (cart.length > 0 && window.innerWidth <= 900) {
      mobileNav.style.display = 'flex';
    } else {
      mobileNav.style.display = 'none';
    }
  }
}

function updateCartItemQty(id, color, delta) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const index = cart.findIndex(item => String(item.id) === String(id) && (item.color || '') === color);
  
  if (index > -1) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  }
}

function removeCartItem(id, color) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => !(String(item.id) === String(id) && (item.color || '') === color));
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

function setupCartActions() {
  const clearCartBtn = document.getElementById('clear-cart');
  const checkoutBtn = document.getElementById('checkout');

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your cart?')) {
        localStorage.removeItem('cart');
        renderCart();
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }
}

// ===============================================
// SHOP PAGE - LOAD & FILTER ADMIN PRODUCTS
// ===============================================

let currentShopCollection = 'all';
let currentShopSubcategory = 'all';
let shopDisplayedProducts = [];

const subcategoryMap = {
  wedding: [
    { value: 'all', label: 'All Wedding' },
    { value: 'party', label: 'Party Wear Sarees' },
    { value: 'bridal', label: 'Bridal Sarees' }
  ],
  cotton: [
    { value: 'all', label: 'All Cotton' },
    { value: 'maheswari_cotton', label: 'Maheswari Cotton' },
    { value: 'chanderi_cotton', label: 'Chanderi Cotton' },
    { value: 'mul_cotton', label: 'Mul Cotton' },
    { value: 'linen_cotton', label: 'Linen Cotton' }
  ],
  silk: [
    { value: 'all', label: 'All Silk' },
    { value: 'kanjivaram_silk', label: 'Kanjivaram' },
    { value: 'banarasi_silk', label: 'Banarasi' },
    { value: 'tussar_silk', label: 'Tussar' },
    { value: 'soft_silk', label: 'Soft Silk' },
    { value: 'mysore_silk', label: 'Mysore' },
    { value: 'maheswari_silk', label: 'Maheswari' },
    { value: 'patola_silk', label: 'Patola' },
    { value: 'gajji_silk', label: 'Gajji' },
    { value: 'dola_silk', label: 'Dola' },
    { value: 'pashmina_silk', label: 'Pashmina' }
  ],
  handloom: [
    { value: 'all', label: 'All Handloom' },
    { value: 'khadi', label: 'Khadi' },
    { value: 'jamdani', label: 'Jamdani' },
    { value: 'ikat', label: 'Ikat' },
    { value: 'linen', label: 'Linen' }
  ],
  kota: [
    { value: 'all', label: 'All Kota' },
    { value: 'kota_silk', label: 'Kota Silk' },
    { value: 'kota_cotton', label: 'Kota Cotton' },
    { value: 'kota_doria', label: 'Kota Doria' }
  ],
  jewellery: [
    { value: 'all', label: 'All Jewellery' },
    { value: 'earrings', label: 'Earrings' },
    { value: 'necklaces', label: 'Necklaces' },
    { value: 'bangles', label: 'Bangles' },
    { value: 'rings', label: 'Rings' },
    { value: 'handmade_jewellery', label: 'Handmade' }
  ]
};

function renderSubcategoryNav() {
  const nav = document.getElementById('subcategory-nav');
  const inner = document.getElementById('subcategory-nav-inner');
  if (!nav || !inner) return;

  if (currentShopCollection === 'all') {
    nav.classList.remove('show');
    return;
  }

  const subcats = subcategoryMap[currentShopCollection] || [];
  nav.classList.add('show');
  inner.innerHTML = subcats.map(sub => 
    `<button class="subcategory-btn ${sub.value === currentShopSubcategory ? 'active' : ''}" data-subcategory="${sub.value}" onclick="filterBySubcategory(event, '${sub.value}')">${sub.label}</button>`
  ).join('');
}

function getShopQueryState() {
  const params = new URLSearchParams(window.location.search);
  const rawCategory = params.get('category')?.toString().trim().toLowerCase();
  const rawSubcategory = params.get('type')?.toString().trim().toLowerCase();
  const validCollections = ['all', 'wedding', 'cotton', 'silk', 'handloom', 'kota', 'jewellery'];

  const category = validCollections.includes(rawCategory) ? rawCategory : 'all';
  const subcategories = subcategoryMap[category] || [];
  const subcategory = subcategories.some(item => item.value === rawSubcategory) ? rawSubcategory : 'all';

  return { category, subcategory };
}

async function loadShopProducts() {
  if (!document.querySelector('.collections-nav')) return;

  let allProducts = [];
  try {
    allProducts = await fetchProductsFromBackend();
  } catch (err) {
    allProducts = JSON.parse(localStorage.getItem('products')) || [];
  }

  shopDisplayedProducts = allProducts.filter(p => p && p.id);

  const queryState = getShopQueryState();
  currentShopCollection = queryState.category;
  currentShopSubcategory = queryState.subcategory;

  document.querySelectorAll('.collection-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.collection === currentShopCollection);
  });

  renderSubcategoryNav();
  renderShopProducts();
}

let shopCurrentPage = 1;
const shopProductsPerPage = 8;

function applyShopFilters() {
  const sortValue = document.querySelector('input[name="sort"]:checked')?.id;
  const sortSelect = document.getElementById('shop-sort');
  if (sortSelect && sortValue) {
    if (sortValue === 's-pop') sortSelect.value = 'popularity';
    else if (sortValue === 's-new') sortSelect.value = 'newest';
    else if (sortValue === 's-lh') sortSelect.value = 'price-low';
    else if (sortValue === 's-hl') sortSelect.value = 'price-high';
  }
  shopCurrentPage = 1;
  renderShopProducts();
}

function filterByCollection(event, collection) {
  currentShopCollection = collection;
  currentShopSubcategory = 'all';
  document.querySelectorAll('.collection-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderSubcategoryNav();
  shopCurrentPage = 1;
  renderShopProducts();
}

function filterBySubcategory(event, subcategory) {
  currentShopSubcategory = subcategory;
  document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  shopCurrentPage = 1;
  renderShopProducts();
}

function clearShopFilter(type) {
  if (type === 'collection') {
    currentShopCollection = 'all';
    currentShopSubcategory = 'all';
    document.querySelectorAll('.collection-btn').forEach(btn => btn.classList.remove('active'));
    const btnAll = document.querySelector('.collection-btn[data-collection="all"]');
    if (btnAll) btnAll.classList.add('active');
    renderSubcategoryNav();
  } else if (type === 'subcategory') {
    currentShopSubcategory = 'all';
    document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
    const btnAll = document.querySelector('.subcategory-btn[data-subcategory="all"]');
    if (btnAll) btnAll.classList.add('active');
  } else if (type === 'min') {
    const el = document.getElementById('price-min');
    if (el) el.value = "0";
  } else if (type === 'max') {
    const el = document.getElementById('price-max');
    if (el) el.value = "50000";
  }
  shopCurrentPage = 1;
  renderShopProducts();
}

async function handleSort() {
  const sortValue = document.getElementById('shop-sort')?.value || 'popularity';
  if (sortValue === 'popularity') { const r = document.getElementById('s-pop'); if (r) r.checked = true; }
  else if (sortValue === 'newest') { const r = document.getElementById('s-new'); if (r) r.checked = true; }
  else if (sortValue === 'price-low') { const r = document.getElementById('s-lh'); if (r) r.checked = true; }
  else if (sortValue === 'price-high') { const r = document.getElementById('s-hl'); if (r) r.checked = true; }
  
  if (shopDisplayedProducts.length === 0) {
    let allProducts = [];
    try {
      allProducts = await fetchProductsFromBackend();
    } catch (err) {
      allProducts = JSON.parse(localStorage.getItem('products')) || [];
    }
    shopDisplayedProducts = allProducts.filter(p => p && p.id);
  }
  
  shopCurrentPage = 1;
  renderShopProducts();
}

function renderShopProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  
  let filtered = [...shopDisplayedProducts];
  
  if (currentShopCollection !== 'all') {
    filtered = filtered.filter(p => {
      const type = (p.type || '').toString().toLowerCase();
      const category = (p.category || '').toString().toLowerCase();
      const collectionMap = {
        wedding: ['party', 'bridal', 'wedding'],
        cotton: ['cotton', 'maheswari_cotton', 'chanderi_cotton', 'mul_cotton', 'linen_cotton'],
        silk: ['silk', 'kanjivaram_silk', 'banarasi_silk', 'tussar_silk', 'soft_silk', 'mysore_silk', 'maheswari_silk', 'patola_silk', 'gajji_silk', 'dola_silk', 'pashmina_silk'],
        handloom: ['handloom', 'khadi', 'jamdani', 'ikat', 'linen'],
        kota: ['kota', 'kota_silk', 'kota_cotton', 'kota_doria'],
        jewellery: ['jewellery', 'earrings', 'necklaces', 'bangles', 'rings', 'handmade_jewellery']
      };
      const validTypes = collectionMap[currentShopCollection] || [];
      return validTypes.includes(type) || validTypes.includes(category);
    });

    if (currentShopSubcategory !== 'all') {
      filtered = filtered.filter(p => {
        const type = (p.type || '').toString().toLowerCase();
        return type === currentShopSubcategory;
      });
    }
  }
  
  const minPriceEl = document.getElementById('price-min');
  const maxPriceEl = document.getElementById('price-max');
  let minP = 0, maxP = 50000;
  if (minPriceEl && minPriceEl.value) minP = parseFloat(minPriceEl.value) || 0;
  if (maxPriceEl && maxPriceEl.value) maxP = parseFloat(maxPriceEl.value) || 50000;
  
  if (minP > 0 || maxP < 50000) {
    filtered = filtered.filter(p => {
      const price = Number(p.price) || Number(p.originalPrice) || 0;
      return price >= minP && price <= maxP;
    });
  }

  const sortValue = document.getElementById('shop-sort')?.value || 'popularity';
  if (sortValue === 'price-low') {
    filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
  } else if (sortValue === 'price-high') {
    filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
  } else if (sortValue === 'newest') {
    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
  }
  
  const tagsContainer = document.getElementById('active-filters');
  if (tagsContainer) {
    let tagsHTML = '';
    if (currentShopCollection !== 'all') {
      tagsHTML += `<div class="filter-tag">Collection: ${currentShopCollection} <span style="margin-left:4px;cursor:pointer;" onclick="clearShopFilter('collection')">✕</span></div>`;
    }
    if (currentShopSubcategory !== 'all') {
      tagsHTML += `<div class="filter-tag">Type: ${currentShopSubcategory} <span style="margin-left:4px;cursor:pointer;" onclick="clearShopFilter('subcategory')">✕</span></div>`;
    }
    if (minP > 0) {
      tagsHTML += `<div class="filter-tag">Min: ₹${minP} <span style="margin-left:4px;cursor:pointer;" onclick="clearShopFilter('min')">✕</span></div>`;
    }
    if (maxP < 50000) {
      tagsHTML += `<div class="filter-tag">Max: ₹${maxP} <span style="margin-left:4px;cursor:pointer;" onclick="clearShopFilter('max')">✕</span></div>`;
    }
    tagsContainer.innerHTML = tagsHTML;
  }
  
  document.getElementById('shop-product-count').textContent = filtered.length;
  const totalPages = Math.ceil(filtered.length / shopProductsPerPage);
  if (shopCurrentPage > totalPages && totalPages > 0) shopCurrentPage = totalPages;
  const startIndex = (shopCurrentPage - 1) * shopProductsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + shopProductsPerPage);

  grid.innerHTML = paginated.length > 0 
    ? paginated.map(p => renderProductCard(p)).join('')
    : '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No products available matching your criteria.</p>';
    
  const paginationContainer = document.getElementById('pagination');
  if (paginationContainer) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
    } else {
      let pageHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        pageHTML += `<button class="page-btn ${i === shopCurrentPage ? 'active' : ''}" onclick="shopCurrentPage = ${i}; renderShopProducts(); window.scrollTo({top:0, behavior:'smooth'})">${i}</button>`;
      }
      paginationContainer.innerHTML = pageHTML;
    }
  }
}

if (document.querySelector('.collections-nav')) {
  document.addEventListener('DOMContentLoaded', loadShopProducts);
  window.addEventListener('load', loadShopProducts);
}


// ============ CHECKOUT FUNCTIONS ============

function displayCheckout() {
  const orderItemsContainer = document.getElementById('order-items');
  const orderTotalContainer = document.getElementById('order-total');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];

  if (cart.length === 0) {
    // Redirect to cart if empty
    window.location.href = 'cart.html';
    return;
  }

  let total = 0;
  let totalItems = 0;
  
  orderItemsContainer.innerHTML = cart.map((item, index) => {
    const product = products.find(p => String(p.id) === String(item.id));
    if (!product) return '';
    
    const finalPrice = getItemFinalPrice(product);
    const itemTotal = finalPrice * item.quantity;
    total += itemTotal;
    totalItems += item.quantity;
    const colorInfo = item.color ? `<span style="display:block;color:var(--text-muted);font-size:0.9rem;">Color: ${escapeHtml(item.color)}</span>` : '';
    return `
      <div class="order-item">
        <div class="order-item-details">
          <div class="order-item-name">${escapeHtml(product.name)}</div>
          <div class="order-item-qty">Qty: ${item.quantity}</div>
          ${colorInfo}
        </div>
        <div class="order-item-price">₹${itemTotal.toLocaleString()}</div>
      </div>
    `;
  }).join('');

  const savedCoupon = JSON.parse(localStorage.getItem('appliedCoupon'));
  if (savedCoupon) appliedCoupon = savedCoupon;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = total - discountAmount;

  orderTotalContainer.innerHTML = `
    <div class="order-summary-row">
      <span>Subtotal (${totalItems} items):</span>
      <span>₹${total.toLocaleString()}</span>
    </div>
    ${appliedCoupon ? `
      <div class="order-summary-row" style="color:var(--coupon-success); font-weight:600;">
        <span>Discount (${appliedCoupon.couponCode}):</span>
        <span>- ₹${discountAmount.toLocaleString()}</span>
      </div>
    ` : ''}
    <div class="order-summary-row">
      <span>Shipping:</span>
      <span>FREE</span>
    </div>
    <div class="order-summary-row total-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid var(--black);">
      <span><strong>Total:</strong></span>
      <span><strong>₹${finalTotal.toLocaleString()}</strong></span>
    </div>
  `;

  if (appliedCoupon) {
    renderAppliedCouponTag(appliedCoupon.couponCode, appliedCoupon.discountAmount);
  }
}

function setupCheckoutActions() {
  const proceedPaymentButton = document.getElementById('proceed-payment');
  const saveAddressBtn = document.getElementById('save-address-btn');
  const customerForm = document.getElementById('customer-form');

  // Load saved address if exists
  loadSavedAddress();

  // Save address button handler
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener('click', () => {
      if (!customerForm.checkValidity()) {
        customerForm.reportValidity();
        return;
      }
      
      const addressData = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        altPhone: document.getElementById('altPhone')?.value || '',
        flat: document.getElementById('flat').value,
        area: document.getElementById('area').value,
        landmark: document.getElementById('landmark')?.value || '',
        pincode: document.getElementById('pincode').value,
        addressType: document.querySelector('input[name="addressType"]:checked')?.value || 'home'
      };
      
      localStorage.setItem('savedAddress', JSON.stringify(addressData));
      
      // Visual feedback
      const originalText = saveAddressBtn.textContent;
      saveAddressBtn.textContent = '✓ Address Saved!';
      saveAddressBtn.style.backgroundColor = '#4caf50';
      setTimeout(() => {
        saveAddressBtn.textContent = originalText;
        saveAddressBtn.style.backgroundColor = '';
      }, 2000);
    });
  }

  if (proceedPaymentButton) {
    proceedPaymentButton.addEventListener('click', async () => {
      if (!customerForm.checkValidity()) {
        customerForm.reportValidity();
        return;
      }

      const selectedPaymentOption = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
      const paymentMethod = 'whatsapp';
      const originalText = proceedPaymentButton.textContent;
      proceedPaymentButton.disabled = true;
      proceedPaymentButton.textContent = 'Processing...';

      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const products = JSON.parse(localStorage.getItem('products')) || [];
      const subtotal = calculateCartTotal();
      const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
      const total = subtotal - discount;

      const customerData = {
        name: document.getElementById('fullName')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        altPhone: document.getElementById('altPhone')?.value || '',
        flat: document.getElementById('flat')?.value || '',
        area: document.getElementById('area')?.value || '',
        landmark: document.getElementById('landmark')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        pincode: document.getElementById('pincode')?.value || '',
        addressType: document.querySelector('input[name="addressType"]:checked')?.value || 'home'
      };

      const orderItems = cart.map(item => {
        const product = products.find(p => String(p.id) === String(item.id));
        return {
          id: item.id,
          name: product?.name || 'Product',
          price: getItemFinalPrice(product),
          quantity: item.quantity,
          color: item.color || ''
        };
      });

      const orderPayload = {
        customer: customerData,
        items: orderItems,
        total,
        paymentMethod,
        source: 'whatsapp',
        status: 'pending_whatsapp',
        preferredPaymentOption: selectedPaymentOption
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
        if (!res.ok) throw new Error('Order API failed');
        const data = await res.json();
        const orderId = data.order?.orderId || 'SP' + Date.now().toString(36).toUpperCase();
        localStorage.setItem('lastOrder', JSON.stringify({ ...data.order, id: orderId }));
      } catch (err) {
        const orderId = 'SP' + Date.now().toString(36).toUpperCase();
        const order = { id: orderId, customer: customerData, items: orderItems, total, paymentMethod, source: 'whatsapp', status: 'pending_whatsapp', date: new Date().toISOString() };
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        localStorage.setItem('lastOrder', JSON.stringify(order));
      }

      openWhatsAppChat(customerData, orderItems, total);
      localStorage.removeItem('cart');
      setTimeout(() => {
        window.location.href = 'success.html';
      }, 600);
    });
  }
}

function loadSavedAddress() {
  const savedAddress = JSON.parse(localStorage.getItem('savedAddress'));
  if (!savedAddress) return;
  
  if (document.getElementById('fullName')) document.getElementById('fullName').value = savedAddress.fullName || '';
  if (document.getElementById('phone')) document.getElementById('phone').value = savedAddress.phone || '';
  if (document.getElementById('altPhone')) document.getElementById('altPhone').value = savedAddress.altPhone || '';
  if (document.getElementById('flat')) document.getElementById('flat').value = savedAddress.flat || '';
  if (document.getElementById('area')) document.getElementById('area').value = savedAddress.area || '';
  if (document.getElementById('landmark')) document.getElementById('landmark').value = savedAddress.landmark || '';
  if (document.getElementById('pincode')) document.getElementById('pincode').value = savedAddress.pincode || '';
  if (document.getElementById('city')) document.getElementById('city').value = savedAddress.city || '';
  if (document.getElementById('state')) document.getElementById('state').value = savedAddress.state || '';
  
  const addressTypeRadio = document.querySelector(`input[name="addressType"][value="${savedAddress.addressType}"]`);
  if (addressTypeRadio) addressTypeRadio.checked = true;
}

function calculateCartTotal(includeDiscount = false) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = JSON.parse(localStorage.getItem('products')) || [];
  
  let subtotal = cart.reduce((total, item) => {
    const product = products.find(p => String(p.id) === String(item.id));
    if (!product) return total;
    return total + (product.price * item.quantity);
  }, 0);

  if (includeDiscount && appliedCoupon) {
    return Math.max(0, subtotal - appliedCoupon.discountAmount);
  }
  
  return subtotal;
}

function displayOrderSuccess() {
  const orderIdElement = document.getElementById('order-id');
  const successMessageEl = document.querySelector('.success-message');
  const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

  if (lastOrder && orderIdElement) {
    orderIdElement.textContent = lastOrder.id || lastOrder.orderId || lastOrder._id?.slice(-8).toUpperCase();
  }

  if (successMessageEl) {
    if (lastOrder && lastOrder.paymentMethod === 'whatsapp') {
      successMessageEl.textContent = 'Your order has been stored and WhatsApp has been opened with your order details. Please send the message to confirm your purchase.';
    } else {
      successMessageEl.textContent = 'Thank you for choosing Shivaay Paridhan. Your order has been confirmed and will be delivered soon.';
    }
  }

  if (!lastOrder && orderIdElement) {
    orderIdElement.textContent = 'SP2026-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

// ============ PRODUCT DETAIL PAGE FUNCTIONS ============

/**
 * Open product detail page
 */
function openProductDetail(productId) {
  window.location.href = `product.html?id=${productId}`;
}

/**
 * Load and display product detail on product.html
 */
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  
  if (!productId) {
    const grid = document.querySelector('.product-detail-grid');
    if (grid) grid.innerHTML = '<div style="text-align:center;padding:60px;"><h2>Product not found</h2><a href="products.html">Back to Shop</a></div>';
    return;
  }
  
  // Show loading state
  const mainImg = document.getElementById('main-img');
  if (mainImg) mainImg.style.opacity = '0.5';
  
  // Fetch products if not already fetched
  if (!isFetched) {
    await fetchProductsFromBackend();
  }
  
  // Fetch global policies
  const policies = await fetchGlobalPolicies();
  
  // Find product by ID
  const product = allProducts.find(p => String(p.id) === String(productId));
  
  if (!product) {
    const grid = document.querySelector('.product-detail-grid');
    if (grid) grid.innerHTML = '<div style="text-align:center;padding:60px;"><h2>Product not found</h2><a href="products.html">Back to Shop</a></div>';
    return;
  }
  
  // Store current product for cart/review functions
  window.currentProduct = product;
  window.globalPolicies = policies;
  
  // Update page content
  updateProductDetailPage(product);
  
  // Load reviews
  loadProductReviews(productId);
  
  if (mainImg) mainImg.style.opacity = '1';
}

/**
 * Fetch global policies
 */
async function fetchGlobalPolicies() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/policies`);
    if (response.ok) return await response.json();
  } catch (error) {
    console.error('Failed to fetch policies:', error);
  }
  return { 
    shippingPolicy: 'Standard shipping takes 3-5 business days.', 
    returnPolicy: 'Easy 7-day returns on all products.' 
  };
}

/**
 * Update product detail page elements
 */
function updateProductDetailPage(product) {
  // Update page title
  document.title = `${product.name} | Shivaay Paridhan`;
  
  // Update breadcrumb
  const breadcrumbProduct = document.querySelector('.breadcrumb span:last-child');
  if (breadcrumbProduct) breadcrumbProduct.textContent = product.name;
  
  // Update main image from gallery — Cloudinary URLs are absolute https:// links
  const mainImg = document.getElementById('main-img');
  if (mainImg && product.images && product.images.length > 0) {
    mainImg.src = resolveImageUrl(product.images[0]);
    mainImg.alt = product.name;
    mainImg.onerror = function() { this.src = 'images/placeholder.jpg'; this.onerror = null; };
  } else if (mainImg && product.image) {
    mainImg.src = resolveImageUrl(product.image);
    mainImg.alt = product.name;
    mainImg.onerror = function() { this.src = 'images/placeholder.jpg'; this.onerror = null; };
  }
  
  // Update product info
  const categoryEl = document.querySelector('.product-info .card-category');
  if (categoryEl) categoryEl.textContent = product.category || 'Banarasi Silk';
  
  const titleEl = document.querySelector('.product-title');
  if (titleEl) titleEl.textContent = product.name;
  
  // Calculate and update price
  const discount = Number(product.discount) || 0;
  const originalPrice = Number(product.originalPrice || product.price) || 0;
  const finalPrice = Number(product.price) || originalPrice;
  const savings = originalPrice - finalPrice;
  const hasDiscount = discount > 0 && savings > 0;
  
  const priceEl = document.querySelector('.product-price');
  const oldPriceEl = document.querySelector('.product-old-price');
  const discountEl = document.querySelector('.product-discount');
  
  if (priceEl) {
    priceEl.innerHTML = hasDiscount 
      ? `<span class="final-price">₹${finalPrice.toLocaleString()}</span>`
      : `₹${finalPrice.toLocaleString()}`;
  }
  
  if (oldPriceEl) {
    if (hasDiscount) {
      oldPriceEl.textContent = `₹${originalPrice.toLocaleString()}`;
      oldPriceEl.style.display = 'inline-block';
    } else {
      oldPriceEl.style.display = 'none';
    }
  }
  
  if (discountEl) {
    if (hasDiscount) {
      discountEl.innerHTML = `<span class="discount-percent">${discount}% OFF</span>`;
      discountEl.style.display = 'inline-block';
      
      let saveInfo = document.getElementById('price-savings-info');
      if (!saveInfo) {
        saveInfo = document.createElement('div');
        saveInfo.id = 'price-savings-info';
        saveInfo.className = 'price-savings-info';
        if (priceEl && priceEl.parentElement) {
          priceEl.parentElement.appendChild(saveInfo);
        }
      }
      saveInfo.innerHTML = `<span class="save-label">You Save:</span> <span class="save-amount">₹${savings.toLocaleString()}</span>`;
      saveInfo.style.display = 'block';
    } else {
      discountEl.style.display = 'none';
    }
  }
  
  // Update stock status and COD
  const stockEl = document.querySelector('.stock-status') || document.createElement('div');
  stockEl.className = 'stock-status';
  stockEl.style.margin = '10px 0';
  stockEl.style.fontWeight = '600';
  stockEl.style.color = product.quantity > 0 ? '#2a7a4b' : '#dc3545';
  stockEl.innerHTML = `<span>● ${product.quantity > 0 ? 'In Stock' : 'Out of Stock'}</span>`;
  
  const infoContainer = document.querySelector('.product-info');
  if (infoContainer && !infoContainer.querySelector('.stock-status')) {
    titleEl.insertAdjacentElement('afterend', stockEl);
  }

  // Update thumbnails - multi-image support (max 5)
  const thumbRow = document.querySelector('.thumb-row');
  if (thumbRow && product.images && product.images.length > 0) {
    const images = product.images.slice(0, 5);
    thumbRow.innerHTML = images.map((img, index) => {
      const imageUrl = resolveImageUrl(img);
      return `<div class="thumb ${index === 0 ? 'active' : ''}" onclick="setImg('${imageUrl}', this)"><img src="${imageUrl}" alt="View ${index + 1}" loading="lazy" onerror="this.src='images/placeholder.jpg'"></div>`;
    }).join('');
    
    // Set initial main image
    if (mainImg) {
      mainImg.src = resolveImageUrl(images[0]);
    }
  }

  // Selectable Colors & Sizes
  updateSelectionOptions(product);
  
  // Update description
  const descEl = document.querySelector('.product-desc');
  if (descEl) descEl.textContent = product.description || 'An exquisite handcrafted saree perfect for special occasions.';
  
  // Update accordion content
  updateProductAccordion(product);
  
  // Update action buttons based on role (admin vs user)
  updateProductDetailButtons(product);

  // ── Inject Offer Countdown Banner ────────────────────────────
  const offerBannerEl = document.getElementById('product-offer-banner');
  if (offerBannerEl) {
    const offer = getOfferState(product);
    if (offer.active || offer.expired) {
      offerBannerEl.innerHTML = buildDetailBannerHTML(product, offer);

      if (offer.active && offer.endDate) {
        const timerId = `detail-${product.id || product._id}`;
        // Slight delay to ensure DOM is ready
        setTimeout(() => {
          OfferTimerEngine.register(
            timerId,
            offer.endDate,
            [timerId]
          );
        }, 50);
      }
    } else {
      offerBannerEl.innerHTML = '';
    }
  }
}

/**
 * Update product detail page buttons based on user role
 */
function updateProductDetailButtons(product) {
  const role = localStorage.getItem('role');
  const actionBtns = document.querySelector('.action-btns');
  if (!actionBtns) return;
  
  const productId = product.id || product._id;
  
  if (role === 'admin') {
    // Admin sees delete and edit buttons
    actionBtns.innerHTML = `
      <button onclick="deleteProduct('${productId}')" class="btn-primary" style="background:#dc3545;">🗑️ Delete Product</button>
      <a href="admin.html" class="btn-ghost" style="border-color:var(--gold);color:var(--gold);text-align:center;display:flex;align-items:center;justify-content:center;text-decoration:none;">← Back to Admin</a>
    `;
  } else {
    // User sees add to cart and order on WhatsApp
    actionBtns.innerHTML = `
      <button class="btn-primary" onclick="addToCartFromDetail()">🛒 Add to Cart</button>
      <button class="btn-ghost" onclick="buyNowFromDetail()" style="background:#25D366;color:#fff;border:none;cursor:pointer;">💬 Order on WhatsApp</button>
    `;
  }
}

/**
 * Add product to cart from detail page
 */
function addToCartFromDetail() {
  if (!window.currentProduct) return;
  
  const qty = parseInt(document.getElementById('qty')?.value || 1);
  const productId = window.currentProduct.id || window.currentProduct._id;
  
  const color = window.selectedColor || (window.currentProduct.colors?.[0]);

  if (window.currentProduct.colors?.length > 0 && !window.selectedColor) {
    alert("Please select a color");
    return;
  }

  // Update cart with quantity and options
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingIndex = cart.findIndex(item => item.id === productId && item.color === color);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += qty;
  } else {
    cart.push({ id: productId, quantity: qty, color });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Visual feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '✓ Added to Cart!';
  btn.style.background = '#2a7a4b';
  
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 2000);
}

/**
 * Buy now from detail page
 */
function buyNowFromDetail() {
  if (!window.currentProduct) return;

  const product = window.currentProduct;
  const qty = parseInt(document.getElementById('qty')?.value || 1);
  const productName = product.name || 'Product';
  const price = getItemFinalPrice(product);
  const totalPrice = price * qty;
  const productUrl = window.location.href;

  const message = `Hello Shivaay Paridhan,\n\nI am interested in ordering:\n\n` +
    `📦 Product: ${productName}\n` +
    `💰 Price: ₹${totalPrice.toLocaleString()}${qty > 1 ? ` (${qty} × ₹${price.toLocaleString()})` : ''}\n` +
    `🔗 Link: ${productUrl}\n\n` +
    `Please share availability and ordering details.`;

  window.open(buildWhatsAppUrl(message), '_blank');
}

function changeQty(delta) {
  const qtyInput = document.getElementById('qty');
  if (!qtyInput) return;
  let val = parseInt(qtyInput.value) + delta;
  if (val < 1) val = 1;
  if (window.currentProduct && val > window.currentProduct.quantity) {
    val = window.currentProduct.quantity;
    alert(`Only ${val} items available in stock.`);
  }
  qtyInput.value = val;
}

// ============ ACCORDION FUNCTIONS ============

/**
 * Initialize accordion — mobile-first, touch-safe, accessible.
 *
 * Fixes:
 * - Uses touchstart for instant response on iOS/Android (no 300ms tap delay)
 * - Guards against duplicate listener stacking with [data-accordion-init]
 * - Adds role="button" + tabindex + aria-expanded for accessibility
 * - Handles keyboard (Enter / Space) for desktop a11y
 * - Works for both static and dynamically injected items (e.g. Return & Exchange)
 */
function initAccordion() {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (!header) return;

    // ── Deduplication guard — never attach more than one listener ──
    if (header.dataset.accordionInit === 'true') return;
    header.dataset.accordionInit = 'true';

    // ── Accessibility attributes ──
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', item.classList.contains('active') ? 'true' : 'false');

    // ── Core toggle logic ──
    function toggleAccordion(e) {
      // Prevent any ghost click that follows a touchstart
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      const isActive = item.classList.contains('active');

      // Close all items and reset aria
      accordionItems.forEach(i => {
        i.classList.remove('active');
        const h = i.querySelector('.accordion-header');
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      // Open this item if it wasn't active
      if (!isActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
        // Smooth scroll into view on mobile so content is visible
        if (window.innerWidth <= 900) {
          setTimeout(() => {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 380); // after CSS transition completes
        }
      }
    }

    // ── Touch handler (primary for mobile) ──
    // touchstart fires immediately with no 300ms delay.
    // We track whether it was a tap (not a scroll).
    let touchStartY = 0;
    let touchMoved = false;

    header.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].clientY;
      touchMoved = false;
    }, { passive: true });

    header.addEventListener('touchmove', () => {
      touchMoved = true;
    }, { passive: true });

    header.addEventListener('touchend', (e) => {
      if (touchMoved) return; // user was scrolling, not tapping
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      if (dy > 10) return; // micro-scroll tolerance
      toggleAccordion(e);
    }, { passive: false });

    // ── Click handler (desktop + fallback for browsers without touch) ──
    header.addEventListener('click', (e) => {
      // On touch devices the touchend already handled it;
      // only process click if it wasn't preceded by a touch.
      if (e.detail === 0) return; // keyboard-triggered click — handle below
      // Check if this was a synthetic click from touch (common on iOS)
      // We use a small flag to skip the ghost click after touchend.
      if (header._touchHandled) {
        header._touchHandled = false;
        return;
      }
      toggleAccordion(e);
    });

    // ── Keyboard support (Enter / Space) ──
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion(e);
      }
    });
  });
}


/**
 * Update accordion content with product data
 */
function updateProductAccordion(product) {
  // Description - Combine specific description with common store info if needed
  const descContent = document.querySelector('[data-accordion="description"] .accordion-content');
  if (descContent) {
    const policies = window.globalPolicies || { shippingPolicy: '', returnPolicy: '' };
    descContent.innerHTML = `
      <div class="product-specific-desc">
        <p>${product.description || 'No description available.'}</p>
      </div>
      <div class="common-store-info" style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #eee; font-size: 0.9rem; color: #666;">
        <p><strong>Common for all products:</strong></p>
        <p>✓ ${policies.shippingPolicy || 'Standard shipping takes 3-5 business days.'}</p>
        <p>✓ ${policies.returnPolicy || 'Easy 7-day returns.'}</p>
      </div>
    `;
  }
  
  // Specifications
  const specContent = document.querySelector('[data-accordion="specification"] .accordion-content');
  if (specContent) {
    specContent.innerHTML = `<p>${product.specifications || 'Standard specifications apply.'}</p>`;
  }
  
  // Product Care
  const careContent = document.querySelector('[data-accordion="care"] .accordion-content');
  if (careContent) {
    careContent.innerHTML = `<p>${product.productCare || 'Dry clean only for silk products.'}</p>`;
  }
  
  // Shipping & Return Policies (Global)
  const policies = window.globalPolicies || { shippingPolicy: '', returnPolicy: '' };
  
  const shippingContent = document.querySelector('[data-accordion="shipping"] .accordion-content');
  if (shippingContent) {
    shippingContent.innerHTML = `
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="margin-bottom: 10px;">🚚 <strong>Delivery:</strong> 3–5 business days globally.</li>
        <li style="margin-bottom: 10px;">🔄 <strong>Exchange:</strong> Easy exchange available within 48 hours.</li>
        <li style="margin-bottom: 10px;">💬 <strong>Support:</strong> 24/7 Support via WhatsApp.</li>
      </ul>
      <p style="margin-top: 15px; font-size: 0.85rem; color: #666;">We partner with premium logistics to ensure safe and timely delivery of your luxury handlooms.</p>
    `;
  }

  // Strict Return Policy Update
  let returnItem = document.querySelector('[data-accordion="return"]');
  const returnPolicyHtml = `
    <div style="padding-top: 10px;">
      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom: 15px;">
        <span style="background:var(--black); color:var(--gold); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">No Refund</span>
        <span style="background:rgba(201,168,76,0.15); color:var(--gold-dark); padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">Exchange Available</span>
        <span style="background:#ffebee; color:#d32f2f; padding:4px 10px; border-radius:50px; font-size:0.75rem; font-weight:600;">📹 Video Proof Required</span>
      </div>
      <ul style="list-style-type: disc; margin-bottom: 15px;">
        <li><strong>No Refund Policy</strong> - We do not offer refunds under any circumstances.</li>
        <li>Only exchanges are allowed for defective or damaged items.</li>
        <li>Return request must be raised within <strong>48 hours</strong> of delivery.</li>
      </ul>
      <div style="background:#fff3e0; border-left:4px solid #ff9800; padding:12px; border-radius:4px; font-size:0.9rem;">
        <strong style="color:#e65100; display:block; margin-bottom:5px;">⚠️ IMPORTANT RULE FOR EXCHANGE:</strong>
        Customer MUST provide:
        <ul style="margin-top:5px; margin-bottom:0; padding-left:20px;">
          <li>Proper <strong>unboxing video</strong> from start to end (no cuts or edits).</li>
          <li>Clear photos of the defect at delivery time.</li>
        </ul>
        <p style="margin-top:8px; margin-bottom:0; font-weight:600; color:#d32f2f;">Without proof → return/exchange will be strictly rejected.</p>
      </div>
    </div>
  `;

  if (!returnItem) {
    const accordionContainer = document.querySelector('.accordion-container');
    if (accordionContainer) {
      returnItem = document.createElement('div');
      returnItem.className = 'accordion-item';
      returnItem.setAttribute('data-accordion', 'return');
      returnItem.innerHTML = `
        <div class="accordion-header">
          <h3>🔄 Return & Exchange Policy</h3>
          <span class="accordion-icon">▼</span>
        </div>
        <div class="accordion-content">
          ${returnPolicyHtml}
        </div>
      `;
      accordionContainer.appendChild(returnItem);
      initAccordion();
    }
  } else {
    returnItem.querySelector('h3').textContent = '🔄 Return & Exchange Policy';
    const returnContent = returnItem.querySelector('.accordion-content');
    if (returnContent) returnContent.innerHTML = returnPolicyHtml;
  }

  // More Info accordion
  const moreContent = document.querySelector('[data-accordion="more"] .accordion-content');
  if (moreContent) {
    moreContent.innerHTML = `<p>${product.moreInfo || 'Each product is handcrafted by skilled artisans. Minor variations in color and pattern are natural and add to the uniqueness of each piece. Certificate of authenticity included.'}</p>`;
  }
}

/**
 * Update Color & Size Selection Options
 */
function updateSelectionOptions(product) {
  const container = document.querySelector('.product-info');
  if (!container) return;

  // Remove existing selection containers if any
  const existing = container.querySelectorAll('.selection-container');
  existing.forEach(e => e.remove());

  const actionBtns = container.querySelector('.action-btns');
  if (!actionBtns) return;

  const selectionHtml = `
    <div class="selection-container">
      ${product.colors && product.colors.length > 0 ? `
        <div class="select-group" style="margin-bottom: 15px;">
          <label style="display:block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">Color</label>
          <div class="option-grid">
            ${product.colors.map(color => `<div class="option-box color-box" onclick="selectOption(this, 'color')" data-value="${color}">${color}</div>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  actionBtns.insertAdjacentHTML('beforebegin', selectionHtml);
}

function selectOption(el, type) {
  const siblings = el.parentElement.querySelectorAll('.option-box');
  siblings.forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  
  if (type === 'color') window.selectedColor = el.dataset.value;
  if (type === 'size') window.selectedSize = el.dataset.value;
}

// ============ REVIEW SYSTEM ============

/**
 * Load reviews for a product
 */
async function loadProductReviews(productId) {
  const container = document.getElementById('reviews-list');
  if (!container) return;
  
  container.innerHTML = '<p>Loading reviews...</p>';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
    const reviews = await response.json();
    
    displayReviews(reviews, container);
    updateAverageRating(reviews);
  } catch (error) {
    console.error('Error loading reviews:', error);
    container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
  }
}

/**
 * Display reviews in container
 */
function displayReviews(reviews, container) {
  if (!reviews || reviews.length === 0) {
    container.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
    return;
  }
  
  const html = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <span class="reviewer-name">${escapeHtml(review.userName)}</span>
        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
      <p class="review-comment">${escapeHtml(review.comment)}</p>
      ${review.image ? `<div class="review-image"><img src="${API_BASE_URL}${review.image}" alt="Review Image" style="max-width: 150px; border-radius: 8px; margin-top: 10px; cursor: pointer;" onclick="window.open('${API_BASE_URL}${review.image}', '_blank')"></div>` : ''}
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * Update average rating display
 */
function updateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return;
  
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;
  
  const ratingEl = document.querySelector('.product-rating .rating-count');
  if (ratingEl) {
    ratingEl.textContent = `${rounded} (${reviews.length} review${reviews.length !== 1 ? 's' : ''})`;
  }
  
  const starsEl = document.querySelector('.product-stars');
  if (starsEl) {
    starsEl.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  }
}

/**
 * Submit a review
 */
async function submitReview() {
  if (!window.currentProduct) {
    alert('Please wait for product to load');
    return;
  }
  
  const productId = window.currentProduct.id || window.currentProduct._id;
  const userName = document.getElementById('review-name')?.value.trim();
  const rating = parseInt(document.getElementById('review-rating')?.value);
  const comment = document.getElementById('review-comment')?.value.trim();
  const imageFile = document.getElementById('review-image-file')?.files[0];
  
  if (!userName || !rating || !comment) {
    alert('Please fill in all fields');
    return;
  }
  
  const formData = new FormData();
  formData.append('productId', productId);
  formData.append('userName', userName);
  formData.append('rating', rating);
  formData.append('comment', comment);
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      // Clear form
      document.getElementById('review-name').value = '';
      document.getElementById('review-rating').value = '5';
      document.getElementById('review-comment').value = '';
      if (document.getElementById('review-image-file')) {
        document.getElementById('review-image-file').value = '';
      }
      
      // Update UI instantly
      loadProductReviews(productId);
      
      alert('Thank you for your review!');
    } else {
      alert('Error submitting review. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Error submitting review. Please try again.');
  }
}

// Make product cards clickable - add click handler to navigate to detail
function makeProductCardsClickable() {
  // This is now handled by inline onclick in renderProductCard
}

/**
 * UX Helpers for Product Page
 */
function scrollToReviews() {
  const section = document.getElementById('reviews-section');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function focusReviewForm() {
  const form = document.getElementById('review-form-container');
  if (form) {
    form.scrollIntoView({ behavior: 'smooth' });
    const nameInput = document.getElementById('review-name');
    if (nameInput) nameInput.focus();
  }
}

function checkPincode() {
  const pincode = document.getElementById('pincode-input')?.value.trim();
  const result = document.getElementById('pincode-result');
  if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
    if (result) result.innerHTML = '<span style="color:red;">Please enter a valid 6-digit pincode</span>';
    return;
  }
  
  if (result) {
    result.innerHTML = 'Checking...';
    setTimeout(() => {
      result.innerHTML = '<span style="color:#2a7a4b;">✓ Delivery available in 3-5 days.</span>';
    }, 800);
  }
}

// ============ HERO SLIDER & CAROUSEL ============
function attachHomeSliderControls() {
  if (window._homeSliderBound) return;
  window._homeSliderBound = true;
  
  const slides = document.querySelectorAll('.hero-slider .slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');
  
  if (slides.length === 0) return;
  
  let currentSlide = 0;
  let slideInterval;
  let isAnimating = false;
  
  function goToSlide(index) {
    if (isAnimating) return;
    isAnimating = true;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    if (currentSlide >= slides.length) currentSlide = 0;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    // reset animation flag after CSS transition duration (800ms)
    setTimeout(() => { isAnimating = false; }, 800);
    resetInterval();
  }
  
  function nextSlide() { goToSlide(currentSlide + 1); }
  function prevSlideFunc() { goToSlide(currentSlide - 1); }
  
  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 5000);
  }
  
  if (prevBtn) prevBtn.addEventListener('click', prevSlideFunc);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (currentSlide !== index) goToSlide(index);
    });
  });
  
  // Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;
  const sliderContainer = document.getElementById('heroSlider');
  
  if (sliderContainer) {
    sliderContainer.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});
    
    sliderContainer.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, {passive: true});
  }
  
  function handleSwipe() {
    const minSwipeDist = 50;
    if (touchEndX < touchStartX - minSwipeDist) nextSlide();
    if (touchEndX > touchStartX + minSwipeDist) prevSlideFunc();
  }
  
  resetInterval();
}

// Carousel Horizontal Scroll
function scrollCarousel(direction) {
  const container = document.getElementById('freshArrivalsScroll');
  if (container) {
    const cardWidth = container.querySelector('.product-card').offsetWidth + 24; // card width + gap
    container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  }
}

// Attach these when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadHomepagePromoCoupon();
  renderCategoryNavigation();
  renderBrandStorySection();
  attachHomeSliderControls();
  if (document.getElementById('cart-items')) {
    renderCart();
    setupCartActions();
  }
  if (document.getElementById('customer-form')) {
    displayCheckout();
    setupCheckoutActions();
  }
  if (document.getElementById('order-id')) {
    displayOrderSuccess();
  }

  // ── Auth page wiring ──────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Init auth-page helpers (OTP inputs, password-match watchers, etc.)
  if (loginForm || registerForm) {
    initAuthPage();
  }

  // ============ COUPON EVENT LISTENERS ============
  const couponBtn = document.getElementById('apply-coupon-btn');
  if (couponBtn) {
    couponBtn.addEventListener('click', applyCoupon);
  }

  const showCouponsBtn = document.getElementById('show-coupons-btn');
  const couponsModal = document.getElementById('coupons-modal');
  const closeCouponsModal = document.getElementById('close-coupons-modal');

  if (showCouponsBtn && couponsModal) {
    showCouponsBtn.addEventListener('click', () => {
      couponsModal.classList.add('show');
      loadAvailableCoupons();
    });
  }

  if (closeCouponsModal && couponsModal) {
    closeCouponsModal.addEventListener('click', () => {
      couponsModal.classList.remove('show');
    });
    window.addEventListener('click', (e) => {
      if (e.target === couponsModal) couponsModal.classList.remove('show');
    });
  }

  const couponForm = document.getElementById('coupon-form');
  if (couponForm) {
    couponForm.addEventListener('submit', saveCoupon);
    document.getElementById('cancel-coupon-edit')?.addEventListener('click', cancelCouponEdit);
  }
});

// ============ WISHLIST FUNCTIONALITY ============
function toggleWishlist(productId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const index = wishlist.indexOf(String(productId));
  const btn = event ? event.currentTarget : null;
  
  if (index > -1) {
    wishlist.splice(index, 1);
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    if (typeof showToast === 'function') showToast('Removed from wishlist');
    else if (typeof showAdminToast === 'function') showAdminToast('Removed from wishlist');
  } else {
    wishlist.push(String(productId));
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    if (typeof showToast === 'function') showToast('Added to wishlist');
    else if (typeof showAdminToast === 'function') showAdminToast('Added to wishlist');
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
}

function updateWishlistCount() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const countElements = document.querySelectorAll('.wishlist-count');
  countElements.forEach(el => {
    if (wishlist.length > 0) {
      el.textContent = wishlist.length;
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

function isWishlisted(productId) {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  return wishlist.includes(String(productId));
}

document.addEventListener('DOMContentLoaded', () => {
  updateWishlistCount();
});
