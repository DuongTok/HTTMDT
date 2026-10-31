/* ==========================================================================
   NÉT DUYÊN — DỊCH VỤ CHO THUÊ ÁO DÀI & CỔ PHỤC CAO CẤP
   Slogan: "Giữ nét Việt, trọn nét duyên."
   ========================================================================== */

const STORAGE_KEYS = {
  CART: "ddvn_cart_v1",
  USER: "ddvn_user_v1",
  ORDERS: "ddvn_orders_v1",
  CUSTOM_PRODUCTS: "netduyen_custom_products_v1"
};

// Đồng bộ sản phẩm từ phân hệ Admin (nếu Admin có cập nhật sản phẩm trong localStorage)
(function syncAdminProducts() {
  try {
    const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        NETDUYEN_PRODUCTS = parsed;
        if (typeof DINGDANG_PRODUCTS !== "undefined") DINGDANG_PRODUCTS = parsed;
      }
    }
  } catch (e) {
    console.warn("Lỗi đọc dữ liệu đồng bộ Admin:", e);
  }
})();

// Helper: Format date YYYY-MM-DD
function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

let state = {
  cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]"),
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null"),
  orders: JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]"),
  collectionSlug: "all",
  sortBy: "created-descending",
  viewMode: 4,
  currentPage: 1,
  perPage: 24,
  searchQuery: "",
  pdpSelectedOptions: {},
  pdpQty: 1,
  pdpStartDate: getFutureDate(1),
  pdpEndDate: getFutureDate(4),
  pdpAddonMan: false,
  pdpAddonQuat: false,
  pdpAddonGuoc: false,
  pdpTabMode: "rent", // "rent" or "buy"
  currentPdpProduct: null
};

// Utilities
function formatVND(num) {
  if (num === null || num === undefined || isNaN(num)) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(Math.round(num)) + "₫";
}

function saveCart() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  updateCartUI();
}

function saveUser() {
  if (state.user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
  updateAuthTopbar();
}

function saveOrders() {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(state.orders));
}

function showToast(msg) {
  const toast = document.getElementById("ddToast");
  const text = document.getElementById("ddToastText");
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window.__ddToastTimer);
  window.__ddToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function updateAuthTopbar() {
  const el = document.getElementById("topbarAuthText");
  if (!el) return;
  if (state.user) {
    el.textContent = `Xin chào, ${state.user.name} (Hội viên VIP)`;
  } else {
    el.textContent = "Đăng nhập / Đăng ký";
  }
}

/* ==========================================================================
   CART CALCULATIONS & METHODS (RENTAL & PURCHASE)
   ========================================================================== */
function getCartTotalCount() {
  return state.cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function getCartRentTotal() {
  return state.cart.reduce((sum, item) => {
    const itemPrice = item.price || item.rentPrice || 0;
    return sum + (itemPrice * (item.qty || 1));
  }, 0);
}

function getCartDepositTotal() {
  return state.cart.reduce((sum, item) => {
    const dep = item.deposit || 0;
    return sum + (dep * (item.qty || 1));
  }, 0);
}

function getCartGrandTotal() {
  return getCartRentTotal() + getCartDepositTotal();
}

function getCartSubtotal() {
  return getCartRentTotal();
}

function addToCart(productId, variantId, qty = 1, openDrawer = true, isRental = true, buyMode = false, customOptions = {}) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const variant = (variantId && product.variants && product.variants.find(v => String(v.id) === String(variantId))) ||
                  (product.variants && product.variants[0]) ||
                  { id: product.id, title: "Tiêu chuẩn", price: product.price };

  const rentBase = product.rent_price || 280000;
  const deposit = isRental && !buyMode ? (product.deposit || 500000) : 0;
  
  // Calculate extra days surcharge if > 3 days
  let extraDaysCost = 0;
  let durationDays = 3;
  if (customOptions.startDate && customOptions.endDate) {
    const d1 = new Date(customOptions.startDate);
    const d2 = new Date(customOptions.endDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) durationDays = diff;
    if (durationDays > 3) {
      extraDaysCost = (durationDays - 3) * 50000;
    }
  }

  // Calculate addons
  const addonsList = customOptions.addons || [];
  let addonsCost = customOptions.addonsCost || 0;

  const finalItemPrice = buyMode
    ? (product.buy_price || 2500000)
    : (rentBase + extraDaysCost + addonsCost);

  const key = `${product.id}_${variant.id}_${buyMode ? "buy" : "rent"}_${customOptions.startDate || ""}_${Date.now()}`;

  state.cart.push({
    key,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    image: (product.images && product.images[0]) || "",
    variantId: variant.id,
    variantTitle: variant.title || "Tiêu chuẩn",
    isRental: !buyMode,
    buyMode: !!buyMode,
    rentPrice: rentBase,
    price: finalItemPrice,
    deposit: deposit,
    startDate: customOptions.startDate || state.pdpStartDate,
    endDate: customOptions.endDate || state.pdpEndDate,
    durationDays: durationDays,
    addons: addonsList,
    qty: qty || 1
  });

  saveCart();
  updateCartUI();

  if (openDrawer) {
    openMinicart();
  } else {
    showToast(buyMode ? `Đã thêm "${product.title}" (May mới) vào giỏ hàng!` : `Đã giữ lịch thuê "${product.title}" thành công!`);
  }
}

function updateCartQty(key, delta) {
  const idx = state.cart.findIndex(i => i.key === key);
  if (idx === -1) return;
  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  saveCart();
  if (location.hash === "#cart") renderCartPage();
}

function removeCartItem(key) {
  state.cart = state.cart.filter(i => i.key !== key);
  saveCart();
  if (location.hash === "#cart") renderCartPage();
}

function updateCartUI() {
  const count = getCartTotalCount();
  const headerBadge = document.getElementById("headerCartCount");
  const drawerBadge = document.getElementById("drawerCartCount");
  if (headerBadge) headerBadge.textContent = count;
  if (drawerBadge) drawerBadge.textContent = `(${count})`;

  const body = document.getElementById("minicartBody");
  const footer = document.getElementById("minicartFooter");
  if (!body || !footer) return;

  if (state.cart.length === 0) {
    footer.style.display = "none";
    body.innerHTML = `
      <div class="cart-empty" style="text-align:center;padding:40px 15px;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" style="margin-bottom:14px;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="empty-des" style="display:block;font-size:15px;font-weight:600;margin-bottom:6px;color:#111;">Giỏ trang phục đang trống</span>
        <p style="font-size:13px;color:#666;margin-bottom:20px;">Khám phá hơn 220+ mẫu Áo Dài, Áo Cưới Cặp và Cổ Phục đẹp cho sự kiện của bạn.</p>
        <button type="button" class="btn-primary" onclick="closeMinicart(); location.hash='#collections/all'">
          Khám phá Áo Dài ngay
        </button>
      </div>
    `;
    return;
  }

  body.innerHTML = state.cart.map(item => `
    <div class="minicart-item" style="border-bottom:1px solid #f0f0f0;padding:14px 0;display:flex;gap:12px;">
      <a href="#products/${item.handle}" onclick="closeMinicart()" class="minicart-item-img" style="width:72px;height:96px;flex-shrink:0;">
        <img src="${item.image}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" loading="lazy" />
      </a>
      <div class="minicart-item-info" style="flex:1;">
        <a href="#products/${item.handle}" onclick="closeMinicart()" class="minicart-item-title" style="font-weight:600;font-size:13px;color:#111;text-decoration:none;display:block;line-height:1.3;margin-bottom:4px;">
          ${item.title}
        </a>
        <div style="font-size:11.5px;color:#555;margin-bottom:4px;">
          Size: <strong>${item.variantTitle}</strong> • ${item.isRental ? '<span style="color:#2b8a3e;font-weight:600;">[THUÊ ĐỒ]</span>' : '<span style="color:#d9480f;font-weight:600;">[MUA MỚI]</span>'}
        </div>
        ${item.isRental ? `
          <div class="cart-rental-meta" style="font-size:11.5px;background:#f8f9fa;padding:4px 6px;border-radius:4px;color:#333;margin-bottom:4px;">
            📅 ${item.startDate} ➔ ${item.endDate} (${item.durationDays || 3} ngày)
          </div>
          ${item.addons && item.addons.length > 0 ? `<div style="font-size:11px;color:#2b8a3e;margin-bottom:4px;">+ ${item.addons.join(", ")}</div>` : ""}
          <div style="font-size:11.5px;color:#666;margin-bottom:4px;">
            Tiền thuê: <strong>${formatVND(item.price)}</strong> | Cọc: <strong style="color:#d9480f;">${formatVND(item.deposit)}</strong> (hoàn lại)
          </div>
        ` : `
          <div style="font-size:12px;color:#111;font-weight:600;margin-bottom:4px;">${formatVND(item.price)}</div>
        `}
        <div class="minicart-qty-row" style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
          <div class="minicart-qty-box">
            <button type="button" onclick="updateCartQty('${item.key}', -1)">−</button>
            <span>${item.qty}</span>
            <button type="button" onclick="updateCartQty('${item.key}', 1)">+</button>
          </div>
          <button type="button" class="btn-reset" style="font-size:12px;color:#888;text-decoration:underline;" onclick="removeCartItem('${item.key}')">Xóa</button>
        </div>
      </div>
    </div>
  `).join("");

  const rentTotal = getCartRentTotal();
  const depTotal = getCartDepositTotal();
  const grandTotal = getCartGrandTotal();

  footer.style.display = "block";
  footer.innerHTML = `
    <div style="padding:12px 0 6px;border-top:1px solid #ebebeb;font-size:13px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#444;">
        <span>Tiền thuê & Dịch vụ:</span>
        <span style="font-weight:600;color:#111;">${formatVND(rentTotal)}</span>
      </div>
      ${depTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#d9480f;">
          <span>Tiền cọc đảm bảo (Hoàn lại 100%):</span>
          <span style="font-weight:600;">${formatVND(depTotal)}</span>
        </div>
      ` : ""}
      <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px dashed #dedede;font-size:15px;font-weight:700;color:#111;">
        <span>Tổng thanh toán:</span>
        <span style="color:#c92a2a;">${formatVND(grandTotal)}</span>
      </div>
      <div style="font-size:11px;color:#666;font-style:italic;margin-top:4px;text-align:right;">
        * Tiền cọc sẽ được hoàn trả 100% ngay khi trả đồ.
      </div>
    </div>
    <div class="minicart-footer-btns" style="display:flex;gap:8px;margin-top:10px;">
      <button type="button" class="btn-secondary" style="flex:1;" onclick="closeMinicart(); location.hash='#cart'">Xem chi tiết</button>
      <button type="button" class="btn-primary" style="flex:1.2;" onclick="closeMinicart(); location.hash='#checkout'">Đặt cọc & Thanh toán</button>
    </div>
  `;
}

function openMinicart() {
  updateCartUI();
  const backdrop = document.getElementById("minicartBackdrop");
  const drawer = document.getElementById("minicartDrawer");
  if (backdrop) backdrop.classList.add("open");
  if (drawer) drawer.classList.add("open");
}

function closeMinicart() {
  const backdrop = document.getElementById("minicartBackdrop");
  const drawer = document.getElementById("minicartDrawer");
  if (backdrop) backdrop.classList.remove("open");
  if (drawer) drawer.classList.remove("open");
}

/* ==========================================================================
   SEARCH POPUP & PREDICTIVE SEARCH
   ========================================================================== */
function openSearchPopup() {
  const backdrop = document.getElementById("searchBackdrop");
  const popup = document.getElementById("searchPopup");
  if (backdrop) backdrop.classList.add("open");
  if (popup) popup.classList.add("open");
  setTimeout(() => {
    const inp = document.getElementById("predictiveSearchInput");
    if (inp) inp.focus();
  }, 100);
}

function closeSearchPopup() {
  const backdrop = document.getElementById("searchBackdrop");
  const popup = document.getElementById("searchPopup");
  if (backdrop) backdrop.classList.remove("open");
  if (popup) popup.classList.remove("open");
}

function handleSearchKeyup(e) {
  const query = e.target.value.trim().toLowerCase();
  const resultsBox = document.getElementById("predictiveSearchResults");
  if (!resultsBox) return;

  if (query.length < 2) {
    resultsBox.innerHTML = "";
    return;
  }

  const matches = NETDUYEN_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(query) ||
    (p.product_type && p.product_type.toLowerCase().includes(query)) ||
    (p.body_html && p.body_html.toLowerCase().includes(query))
  ).slice(0, 6);

  if (matches.length === 0) {
    resultsBox.innerHTML = `<div style="padding:20px;text-align:center;color:#666;font-size:13px;">Không tìm thấy trang phục nào phù hợp với "${query}".</div>`;
    return;
  }

  resultsBox.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:#888;padding:8px 0;text-transform:uppercase;">Kết quả gợi ý (${matches.length})</div>
    ${matches.map(p => `
      <a href="#products/${p.handle}" onclick="closeSearchPopup()" style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0;text-decoration:none;color:inherit;">
        <img src="${p.images[0] || ""}" alt="${p.title}" style="width:48px;height:64px;object-fit:cover;border-radius:4px;" />
        <div>
          <div style="font-size:13px;font-weight:600;color:#111;">${p.title}</div>
          <div style="font-size:12px;color:#c92a2a;font-weight:600;">Giá thuê: ${formatVND(p.rent_price || p.price)} / 3 ngày</div>
          <div style="font-size:11px;color:#777;">Cọc: ${formatVND(p.deposit || 500000)}</div>
        </div>
      </a>
    `).join("")}
  `;
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const inp = document.getElementById("predictiveSearchInput");
  if (!inp || !inp.value.trim()) return;
  const q = inp.value.trim();
  closeSearchPopup();
  location.hash = `#search/${encodeURIComponent(q)}`;
}

/* ==========================================================================
   PRODUCT CARD COMPONENT (RENTAL FIRST)
   ========================================================================== */
function renderProductCardHTML(product, isCompact = false) {
  const img1 = (product.images && product.images[0]) || "";
  const img2 = (product.images && product.images[1]) || img1;
  const rentPrice = product.rent_price || product.price || 280000;
  const deposit = product.deposit || 500000;
  const buyPrice = product.buy_price || product.price || 2500000;
  const typeLabel = product.product_type || "Áo Dài";

  let badgeText = "CHO THUÊ";
  if (product.collections && product.collections.includes("ao-cuoi-cap")) badgeText = "CƯỚI CẶP";
  else if (product.collections && product.collections.includes("co-phuc")) badgeText = "CỔ PHỤC";
  else if (product.collections && product.collections.includes("ao-dai-nam")) badgeText = "ÁO DÀI NAM";
  else if (product.collections && product.collections.includes("phu-kien")) badgeText = "PHỤ KIỆN";

  return `
    <div class="bls__grid__item">
      <div class="bls__product-item" data-product-handle="${product.handle}">
        <div class="bls__product-img">
          <div class="badge-rental-card">${badgeText}</div>
          <a class="bls__img-url" href="#products/${product.handle}" onclick="closeSearchPopup()">
            <div class="bls__product-main-img">
              <img src="${img1}" alt="${product.title}" loading="lazy" />
            </div>
            <div class="bls__product-hover-img">
              <img src="${img2}" alt="${product.title}" loading="lazy" />
            </div>
          </a>
          <div class="bls__product-action">
            <button
              type="button"
              class="bls__js-addtocart"
              onclick="location.hash='#products/${product.handle}'"
              aria-label="Xem lịch thuê & Đặt"
            >
              <span>Xem lịch thuê & Đặt</span>
            </button>
          </div>
        </div>
        <div class="bls__product-details">
          <div class="product-card-tags">
            <span>${typeLabel.toUpperCase()}</span>
          </div>
          <h3 class="bls__product-name">
            <a href="#products/${product.handle}" onclick="closeSearchPopup()">${product.title}</a>
          </h3>
          <div class="bls__product-price">
            <span class="special-price">${formatVND(rentPrice)}</span>
            <span style="font-size:12px;color:#777;font-weight:400;">/ 3 ngày</span>
          </div>
          <div class="card-rent-meta">
            Cọc: ${formatVND(deposit)} • May mới: ${formatVND(buyPrice)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   INTERACTIVE PDP RENTAL HELPERS
   ========================================================================== */
function switchPdpMode(mode) {
  state.pdpTabMode = mode;
  const rentBox = document.getElementById("pdpRentSection");
  const buyBox = document.getElementById("pdpBuySection");
  const tabRent = document.getElementById("pdpTabRent");
  const tabBuy = document.getElementById("pdpTabBuy");

  if (mode === "rent") {
    if (rentBox) rentBox.style.display = "block";
    if (buyBox) buyBox.style.display = "none";
    if (tabRent) tabRent.classList.add("active");
    if (tabBuy) tabBuy.classList.remove("active");
  } else {
    if (rentBox) rentBox.style.display = "none";
    if (buyBox) buyBox.style.display = "block";
    if (tabRent) tabRent.classList.remove("active");
    if (tabBuy) tabBuy.classList.add("active");
  }
}

function updateRentalDuration() {
  const startEl = document.getElementById("rentalStartDate");
  const endEl = document.getElementById("rentalEndDate");
  const badgeEl = document.getElementById("rentalDurationBadge");
  if (!startEl || !endEl || !badgeEl) return;

  state.pdpStartDate = startEl.value;
  state.pdpEndDate = endEl.value;

  const d1 = new Date(startEl.value);
  const d2 = new Date(endEl.value);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    badgeEl.textContent = "⚠️ Ngày trả đồ phải sau ngày nhận đồ ít nhất 1 ngày!";
    badgeEl.style.color = "#c92a2a";
    badgeEl.style.background = "#fff5f5";
  } else if (diffDays <= 3) {
    badgeEl.textContent = `⏳ Gói chuẩn: ${diffDays} ngày (${startEl.value} ➔ ${endEl.value})`;
    badgeEl.style.color = "#2b8a3e";
    badgeEl.style.background = "#f0f7f0";
  } else {
    badgeEl.textContent = `⏳ Thuê dài ngày: ${diffDays} ngày (${diffDays - 3} ngày phụ thu +50k/ngày)`;
    badgeEl.style.color = "#d9480f";
    badgeEl.style.background = "#fff9db";
  }

  updateRentalTotal(diffDays > 0 ? diffDays : 3);
}

function updateRentalTotal(days = 3) {
  const manEl = document.getElementById("addonMan");
  const quatEl = document.getElementById("addonQuat");
  const guocEl = document.getElementById("addonGuoc");

  const totalEl = document.getElementById("calcTotalPayment");
  const rentEl = document.getElementById("calcRentAmount");
  const addonsEl = document.getElementById("calcAddonsAmount");
  const depositEl = document.getElementById("calcDepositAmount");

  state.pdpAddonMan = manEl ? manEl.checked : false;
  state.pdpAddonQuat = quatEl ? quatEl.checked : false;
  state.pdpAddonGuoc = guocEl ? guocEl.checked : false;

  let addonsPrice = 0;
  if (state.pdpAddonMan) addonsPrice += 50000;
  if (state.pdpAddonQuat) addonsPrice += 40000;
  if (state.pdpAddonGuoc) addonsPrice += 45000;

  if (addonsEl) addonsEl.textContent = formatVND(addonsPrice);

  const product = state.currentPdpProduct;
  if (!product || !totalEl) return;

  const baseRent = product.rent_price || 280000;
  const deposit = product.deposit || 500000;

  let extraDaysCost = 0;
  if (days > 3) {
    extraDaysCost = (days - 3) * 50000;
  }

  const rentFeeWithExtra = baseRent + extraDaysCost;
  if (rentEl) rentEl.textContent = formatVND(rentFeeWithExtra);
  if (depositEl) depositEl.textContent = formatVND(deposit);

  const grandTotal = rentFeeWithExtra + addonsPrice + deposit;
  totalEl.textContent = formatVND(grandTotal);
}

function handleRentalAddToCart(productId, checkoutNow = false) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const variant = getMatchingVariant(product);

  const addonsList = [];
  let addonsCost = 0;
  if (state.pdpAddonMan) { addonsList.push("Mấn ngọc trai (+50K)"); addonsCost += 50000; }
  if (state.pdpAddonQuat) { addonsList.push("Quạt lụa (+40K)"); addonsCost += 40000; }
  if (state.pdpAddonGuoc) { addonsList.push("Guốc mộc (+45K)"); addonsCost += 45000; }

  addToCart(
    product.id,
    variant ? variant.id : null,
    state.pdpQty || 1,
    !checkoutNow,
    true,
    false,
    {
      startDate: state.pdpStartDate,
      endDate: state.pdpEndDate,
      addons: addonsList,
      addonsCost: addonsCost
    }
  );

  if (checkoutNow) {
    location.hash = "#checkout";
  }
}

function handleBuyNowDirect(productId) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const variant = getMatchingVariant(product);
  addToCart(
    product.id,
    variant ? variant.id : null,
    state.pdpQty || 1,
    false,
    false,
    true,
    {}
  );
  location.hash = "#checkout";
}

/* ==========================================================================
   VIEW 1: HOME VIEW (#home)
   ========================================================================== */
function renderHomeView() {
  document.title = "NÉT DUYÊN – Giữ nét Việt, trọn nét duyên. (Cho thuê Áo Dài & Cổ Phục)";
  
  const hotItems = NETDUYEN_PRODUCTS.slice(0, 8);
  const weddingItems = NETDUYEN_PRODUCTS.filter(p => p.collections && p.collections.includes("ao-cuoi-cap")).slice(0, 4);
  const coPhucItems = NETDUYEN_PRODUCTS.filter(p => p.collections && p.collections.includes("co-phuc")).slice(0, 4);

  const museImages = [
    "https://dingdangvietnam.com/cdn/shop/files/1789725324926_2068560641793806717_2068560641793806717_f11991394279088b902607028da9f4dd.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725646338_2068560641793806717_2068560641793806717_adb99abec3d1ddbe14cffe8523f270b7.jpg?v=1789726461&width=533",
    "https://cdn.shopify.com/s/files/1/0981/5025/2916/files/DSC05782.jpg?v=1792811197",
    "https://dingdangvietnam.com/cdn/shop/files/1789725487483_2068560641793806717_2068560641793806717_b7560d56d854ef0ab7569c054894a21a.jpg?v=1789726461&width=533",
    "https://cdn.shopify.com/s/files/1/0981/5025/2916/files/DSC05856.jpg?v=1792811197",
    "https://dingdangvietnam.com/cdn/shop/files/1789725569214_2068560641793806717_2068560641793806717_85ae82f353d553e51d0392e1fd08f98d.jpg?v=1789726461&width=533",
    "https://quyennguyen.vn/wp-content/uploads/2026/10/12_MRL08847-logo-900x1350.jpg",
    "https://dingdangvietnam.com/cdn/shop/files/1789725930167_2068560641793806717_2068560641793806717_ee38a508e3ccd264ed8bd387dd704306.jpg?v=1789726461&width=533"
  ];

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <!-- 1. Hero Banner -->
    <div class="hero-slideshow" onclick="location.hash='#collections/all'">
      <img src="https://dingdangvietnam.com/cdn/shop/files/banner_web_1.jpg?v=1790934586&width=2400" alt="NÉT DUYÊN – Giữ nét Việt, trọn nét duyên." />
      <div class="hero-banner-floating-badge">
        <span class="badge-brand">NÉT DUYÊN</span>
        <span class="badge-slogan">Giữ nét Việt, trọn nét duyên.</span>
        <div style="margin-top:10px;font-size:13px;letter-spacing:0.04em;">DỊCH VỤ CHO THUÊ ÁO DÀI & CỔ PHỤC CAO CẤP</div>
      </div>
    </div>

    <!-- 2. CATEGORY TILES (CHO THUÊ) -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">DANH MỤC TRANG PHỤC CHO THUÊ</h2>
          <p class="bls__section-des">Hơn 220+ mẫu trang phục được chăm sóc giặt hấp chuẩn studio</p>
        </div>
        <div class="collection-list-grid">
          <div class="collection-card" onclick="location.hash='#collections/ao-dai-nu'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792233848184_2307592614049898190_2307592614049898190_38c62ffd47c69d192158ed5b3c2f6223.jpg?v=1792234193&width=900" alt="ÁO DÀI NỮ" />
            <span class="collection-card-label">ÁO DÀI NỮ</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/ao-dai-nam'">
            <img src="https://quyennguyen.vn/wp-content/uploads/2026/10/12_MRL08847-logo-900x1350.jpg" alt="ÁO DÀI NAM" />
            <span class="collection-card-label">ÁO DÀI NAM</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/ao-cuoi-cap'">
            <img src="https://cdn.shopify.com/s/files/1/0981/5025/2916/files/DSC05782.jpg?v=1792811197" alt="ÁO CƯỚI CẶP" />
            <span class="collection-card-label">ÁO CƯỚI CẶP</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/co-phuc'">
            <img src="https://cdn.shopify.com/s/files/1/0981/5025/2916/files/M_u_on_Tr_m_Hoa___Kho_c_H_ng_H_2.jpg?v=1792811197" alt="CỔ PHỤC VIỆT" />
            <span class="collection-card-label">CỔ PHỤC VIỆT</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. QUY TRÌNH 4 BƯỚC THUÊ ÁO DÀI (HIGHLIGHT BOX) -->
    <section class="bls__section" style="padding-top:10px;">
      <div class="container-fluid">
        <div style="background:#fafafa;border:1px solid #ebebeb;border-radius:12px;padding:36px 24px;">
          <div class="bls__section-header" style="margin-bottom:28px;">
            <h2 class="bls__section-heading" style="font-size:22px;">QUY TRÌNH THUÊ 4 BƯỚC ĐƠN GIẢN TẠI NÉT DUYÊN</h2>
            <p class="bls__section-des">Nhanh chóng – Minh bạch – Giữ trọn vẻ rạng ngời cho bạn</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;">
            <div style="background:#fff;padding:22px;border-radius:8px;border:1px solid #ebebeb;text-align:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px;">1</div>
              <h4 style="font-size:14.5px;font-weight:700;margin-bottom:6px;color:#111;">CHỌN MẪU & LỊCH</h4>
              <p style="font-size:12.5px;color:#666;margin:0;">Chọn mẫu áo dài ưng ý, chọn ngày nhận & ngày trả phù hợp với lịch sự kiện.</p>
            </div>
            <div style="background:#fff;padding:22px;border-radius:8px;border:1px solid #ebebeb;text-align:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px;">2</div>
              <h4 style="font-size:14.5px;font-weight:700;margin-bottom:6px;color:#111;">ĐẶT CỌC GIỮ LỊCH</h4>
              <p style="font-size:12.5px;color:#666;margin:0;">Thanh toán tiền thuê và khoản cọc bảo đảm (VietQR / COD / CCCD tại showroom).</p>
            </div>
            <div style="background:#fff;padding:22px;border-radius:8px;border:1px solid #ebebeb;text-align:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px;">3</div>
              <h4 style="font-size:14.5px;font-weight:700;margin-bottom:6px;color:#111;">NHẬN ĐỒ ĐÃ GIẶT HẤP</h4>
              <p style="font-size:12.5px;color:#666;margin:0;">Trang phục giao trước 1 ngày, ủi phẳng phiu thơm tho và căn chỉnh vừa in số đo.</p>
            </div>
            <div style="background:#fff;padding:22px;border-radius:8px;border:1px solid #ebebeb;text-align:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;margin-bottom:12px;">4</div>
              <h4 style="font-size:14.5px;font-weight:700;margin-bottom:6px;color:#111;">TRẢ ĐỒ & HOÀN CỌC</h4>
              <p style="font-size:12.5px;color:#666;margin:0;">Gửi trả đồ (không cần giặt), Nét Duyên hoàn trả ngay 100% tiền cọc trong 2 giờ.</p>
            </div>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="#pages/rental-policy" class="btn-secondary" style="font-size:13px;padding:10px 22px;">Xem chi tiết Bảng giá cọc & Quy định</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FEATURED RENTAL ITEMS -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">TRANG PHỤC ĐƯỢC THUÊ NHIỀU NHẤT</h2>
          <p class="bls__section-des">Giá thuê từ 180K – 450K / Gói 3 ngày 2 đêm</p>
        </div>
        <div class="bls__grid">
          ${hotItems.map(p => renderProductCardHTML(p)).join("")}
        </div>
        <div style="text-align:center;margin-top:34px;">
          <a href="#collections/all" class="btn-secondary">Khám phá tất cả 220+ mẫu</a>
        </div>
      </div>
    </section>

    <!-- 5. Marquee Banner -->
    <div class="scrolling-marquee">
      <div class="scrolling-marquee-track">
        <span>NÉT DUYÊN • GIỮ NÉT VIỆT, TRỌN NÉT DUYÊN</span><span>•</span>
        <span>CHO THUÊ ÁO DÀI CAO CẤP</span><span>•</span>
        <span>HOÀN CỌC 100% NHANH CHÓNG</span><span>•</span>
        <span>MIỄN PHÍ GIẶT HẤP KHỬ KHUẨN</span><span>•</span>
        <span>HỖ TRỢ CHỈNH SỬA SỐ ĐO MIỄN PHÍ</span><span>•</span>
        <span>NÉT DUYÊN • GIỮ NÉT VIỆT, TRỌN NÉT DUYÊN</span><span>•</span>
        <span>CHO THUÊ ÁO DÀI CAO CẤP</span><span>•</span>
        <span>HOÀN CỌC 100% NHANH CHÓNG</span>
      </div>
    </div>

    <!-- 6. ÁO CƯỚI CẶP ĐÔI SECTION -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">ÁO CƯỚI CẶP ĐÔI & LỄ ĂN HỎI</h2>
          <p class="bls__section-des">Set đôi đồng điệu thêu Long Phụng sum vầy cho ngày vu quy</p>
        </div>
        <div class="bls__grid">
          ${weddingItems.map(p => renderProductCardHTML(p)).join("")}
        </div>
        <div style="text-align:center;margin-top:34px;">
          <a href="#collections/ao-cuoi-cap" class="btn-secondary">Xem trọn bộ Áo Cưới Cặp</a>
        </div>
      </div>
    </section>

    <!-- 7. CỔ PHỤC VIỆT NAM (NHẬT BÌNH & ÁO TẤC) -->
    <section class="bls__section" style="padding-top:10px;">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">CỔ PHỤC VIỆT NAM (NHẬT BÌNH & ÁO TẤC)</h2>
          <p class="bls__section-des">Nét đẹp di sản triều Nguyễn uy nghi và lộng lẫy</p>
        </div>
        <div class="bls__grid">
          ${coPhucItems.map(p => renderProductCardHTML(p)).join("")}
        </div>
        <div style="text-align:center;margin-top:34px;">
          <a href="#collections/co-phuc" class="btn-secondary">Xem bộ sưu tập Cổ Phục</a>
        </div>
      </div>
    </section>

    <!-- 8. MUSE / LOOKBOOK GALLERY -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">LOOKBOOK & HÌNH ẢNH THỰC TẾ</h2>
          <p class="bls__section-des">Khách hàng tỏa sáng cùng Nét Duyên trong từng khoảnh khắc</p>
        </div>
        <div class="muse-gallery-grid">
          ${museImages.map(src => `
            <div class="muse-gallery-item">
              <img src="${src}" alt="MUSE OF NÉT DUYÊN" loading="lazy" />
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   VIEW 2: COLLECTION VIEW (#collections/:slug)
   ========================================================================== */
function getFilteredAndSortedProducts(slug) {
  let list = slug === "all"
    ? [...NETDUYEN_PRODUCTS]
    : NETDUYEN_PRODUCTS.filter(p => p.collections && p.collections.includes(slug));

  if (list.length === 0) {
    list = [...NETDUYEN_PRODUCTS];
  }

  switch (state.sortBy) {
    case "price-ascending":
      list.sort((a, b) => (a.rent_price || a.price) - (b.rent_price || b.price));
      break;
    case "price-descending":
      list.sort((a, b) => (b.rent_price || b.price) - (a.rent_price || a.price));
      break;
    case "title-ascending":
      list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
      break;
    case "title-descending":
      list.sort((a, b) => b.title.localeCompare(a.title, "vi"));
      break;
    case "created-ascending":
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      break;
    case "created-descending":
    default:
      break;
  }
  return list;
}

function renderCollectionView(slug) {
  state.collectionSlug = slug || "all";
  const colMeta = NETDUYEN_COLLECTIONS[state.collectionSlug] || { title: state.collectionSlug.toUpperCase(), desc: "" };
  document.title = `${colMeta.title} – NÉT DUYÊN | Giữ nét Việt, trọn nét duyên.`;

  const allItems = getFilteredAndSortedProducts(state.collectionSlug);
  const totalPages = Math.max(1, Math.ceil(allItems.length / state.perPage));
  if (state.currentPage > totalPages) state.currentPage = 1;

  const startIdx = (state.currentPage - 1) * state.perPage;
  const pageItems = allItems.slice(startIdx, startIdx + state.perPage);

  // Pagination buttons
  let pageButtons = "";
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - state.currentPage) <= 1) {
      pageButtons += `
        <li>
          <a class="pagination__item ${p === state.currentPage ? "pagination__item--current" : ""}" onclick="changeCollectionPage(${p})">${p}</a>
        </li>
      `;
    } else if (p === state.currentPage - 2 || p === state.currentPage + 2) {
      pageButtons += `<li><span class="pagination__item" style="border:none;">&hellip;</span></li>`;
    }
  }
  if (state.currentPage < totalPages) {
    pageButtons += `
      <li>
        <a class="pagination__item" onclick="changeCollectionPage(${state.currentPage + 1})">Trang tiếp</a>
      </li>
    `;
  }

  const categoryPills = [
    { slug: "all", label: "Tất cả (220+)" },
    { slug: "ao-dai-nu", label: "Áo Dài Nữ" },
    { slug: "ao-dai-nam", label: "Áo Dài Nam" },
    { slug: "ao-cuoi-cap", label: "Áo Cưới Cặp" },
    { slug: "co-phuc", label: "Cổ Phục Việt" },
    { slug: "phu-kien", label: "Phụ Kiện Thuê" }
  ];

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <!-- Page Heading -->
    <div class="page-heading">
      <div class="container">
        <div class="heading-content">
          <h1 class="heading-title">${colMeta.title}</h1>
          ${colMeta.desc ? `<div class="heading-description">${colMeta.desc}</div>` : ""}
        </div>
        <nav class="breadcrumbs" aria-label="breadcrumbs">
          <ol class="bls__breadcrumb-list">
            <li class="bls__breadcrumb-item">
              <a class="bls__breadcrumb-link" href="#home">Trang chủ</a>
              <span style="padding:0 4px;">/</span>
            </li>
            <li class="bls__breadcrumb-item">
              <span class="bls__breadcrumb-link" aria-current="page">${colMeta.title}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- Category Switcher Bar -->
    <div class="container-fluid" style="margin-bottom:20px;">
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;">
        ${categoryPills.map(p => `
          <a
            href="#collections/${p.slug}"
            style="display:inline-block;padding:7px 16px;border-radius:20px;border:1px solid ${state.collectionSlug === p.slug ? '#111' : '#e0e0e0'};background:${state.collectionSlug === p.slug ? '#111' : '#fff'};color:${state.collectionSlug === p.slug ? '#fff' : '#444'};font-size:12.5px;font-weight:600;white-space:nowrap;text-decoration:none;"
          >
            ${p.label}
          </a>
        `).join("")}
      </div>
    </div>

    <!-- Product Grid Section -->
    <div class="section-collection-product">
      <div class="container-fluid">
        <!-- Toolbar -->
        <div class="toolbar-products">
          <div class="toolbar-left">
            <div class="grid-mode-switcher">
              <button type="button" class="grid-mode-btn ${state.viewMode === 2 ? "active" : ""}" onclick="setGridViewMode(2)" title="2 cột">II</button>
              <button type="button" class="grid-mode-btn ${state.viewMode === 3 ? "active" : ""}" onclick="setGridViewMode(3)" title="3 cột">III</button>
              <button type="button" class="grid-mode-btn ${state.viewMode === 4 ? "active" : ""}" onclick="setGridViewMode(4)" title="4 cột">IIII</button>
            </div>
            <div style="font-size:13px;color:#666;margin-left:14px;">
              Hiển thị <strong>${allItems.length}</strong> mẫu trang phục
            </div>
          </div>

          <div class="toolbar-sorter">
            <div class="sort-by-select">
              <button type="button" class="sort-by-btn" onclick="toggleSortDropdown(event)">
                <span>Sắp xếp: <strong>${getSortLabel(state.sortBy)}</strong></span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0.5L5 5.5L10 0.5H0Z"/></svg>
              </button>
              <div class="sort-by-dropdown" id="sortDropdownBox">
                <button type="button" onclick="changeSort('price-ascending')">Giá thuê: Thấp đến Cao</button>
                <button type="button" onclick="changeSort('price-descending')">Giá thuê: Cao đến Thấp</button>
                <button type="button" onclick="changeSort('created-descending')">Mới cập nhật</button>
                <button type="button" onclick="changeSort('title-ascending')">Tên: A-Z</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid Container -->
        <div class="bls__grid bls__grid-mode-${state.viewMode}" id="collectionGrid">
          ${pageItems.map(p => renderProductCardHTML(p)).join("")}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div class="pagination-wrap">
            <ul class="pagination">
              ${pageButtons}
            </ul>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function getSortLabel(val) {
  switch (val) {
    case "price-ascending": return "Giá thuê: Thấp đến Cao";
    case "price-descending": return "Giá thuê: Cao đến Thấp";
    case "title-ascending": return "Tên: A-Z";
    case "created-descending":
    default: return "Mới cập nhật";
  }
}

function toggleSortDropdown(e) {
  e.stopPropagation();
  const box = document.getElementById("sortDropdownBox");
  if (box) box.classList.toggle("open");
}

function changeSort(val) {
  state.sortBy = val;
  state.currentPage = 1;
  const box = document.getElementById("sortDropdownBox");
  if (box) box.classList.remove("open");
  renderCollectionView(state.collectionSlug);
}

function setGridViewMode(mode) {
  state.viewMode = mode;
  const grid = document.getElementById("collectionGrid");
  if (grid) {
    grid.className = `bls__grid bls__grid-mode-${mode}`;
  }
  document.querySelectorAll(".grid-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim().length === mode);
  });
}

function changeCollectionPage(page) {
  state.currentPage = page;
  renderCollectionView(state.collectionSlug);
  window.scrollTo({ top: 300, behavior: "smooth" });
}

/* ==========================================================================
   VIEW 3: PRODUCT DETAIL PAGE (#products/:handle)
   ========================================================================== */
function renderProductDetailView(handle) {
  const idx = NETDUYEN_PRODUCTS.findIndex(p => p.handle === handle || String(p.id) === String(handle));
  const product = idx !== -1 ? NETDUYEN_PRODUCTS[idx] : NETDUYEN_PRODUCTS[0];
  if (!product) return;

  state.currentPdpProduct = product;
  document.title = `${product.title} – NÉT DUYÊN | Cho thuê Áo Dài`;
  state.pdpQty = 1;
  state.pdpSelectedOptions = {};
  (product.options || []).forEach((opt, i) => {
    state.pdpSelectedOptions[i] = opt.values[0] || "S";
  });

  const prevProd = NETDUYEN_PRODUCTS[(idx - 1 + NETDUYEN_PRODUCTS.length) % NETDUYEN_PRODUCTS.length];
  const nextProd = NETDUYEN_PRODUCTS[(idx + 1) % NETDUYEN_PRODUCTS.length];
  const related = NETDUYEN_PRODUCTS.filter(p => p.id !== product.id && p.collections.some(c => product.collections.includes(c))).slice(0, 4);

  const selectedVariant = getMatchingVariant(product);
  const rentPrice = product.rent_price || 280000;
  const deposit = product.deposit || 500000;
  const buyPrice = product.buy_price || product.price || 2500000;

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="container-fluid">
      <!-- Breadcrumb Bar -->
      <div class="pdp-breadcrumb-bar">
        <ol class="bls__breadcrumb-list">
          <li class="bls__breadcrumb-item">
            <a class="bls__breadcrumb-link" href="#home">Trang chủ</a>
            <span style="padding:0 4px;">/</span>
          </li>
          <li class="bls__breadcrumb-item">
            <a class="bls__breadcrumb-link" href="#collections/${(product.collections && product.collections[0]) || 'all'}">
              ${(product.product_type || "Cho thuê Áo Dài").toUpperCase()}
            </a>
            <span style="padding:0 4px;">/</span>
          </li>
          <li class="bls__breadcrumb-item">
            <span class="bls__breadcrumb-link">${product.title}</span>
          </li>
        </ol>

        <div class="pdp-next-prev">
          <a href="#products/${prevProd.handle}" title="Sản phẩm trước: ${prevProd.title}" style="font-size:16px;padding:4px;">‹</a>
          <a href="#collections/all" title="Quay lại danh sách" style="display:inline-flex;align-items:center;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.8 7.4H10.8C9.3 7.4 8.5 6.8 8.5 5.4V2C8.5 0.7 9.3 0 10.8 0H13.8C15.3 0 16 0.7 16 2V5.4C16 6.1 15.8 6.6 15.5 6.9C15.1 7.3 14.6 7.4 13.8 7.4Z" fill="#111"/>
              <path d="M13.8 16H10.8C9.3 16 8.5 15.3 8.5 13.8V10.8C8.5 9.3 9.3 8.6 10.8 8.6H13.8C15.3 8.6 16 9.3 16 10.8V13.8C16 15.3 15.3 16 13.8 16Z" fill="#111"/>
              <path d="M5.3 7.4H2.2C0.7 7.4 0 6.8 0 5.4V2C0 0.7 0.7 0 2.2 0H5.2C6.7 0 7.4 0.7 7.4 2V5.4C7.4 6.1 7.3 6.6 6.9 6.9C6.6 7.3 6 7.4 5.3 7.4Z" fill="#111"/>
              <path d="M5.2 16H2.2C0.7 16 0 15.3 0 13.8V10.8C0 9.3 0.7 8.6 2.2 8.6H5.2C6.7 8.6 7.4 9.3 7.4 10.8V13.8C7.4 15.3 6.7 16 5.2 16Z" fill="#111"/>
            </svg>
          </a>
          <a href="#products/${nextProd.handle}" title="Sản phẩm tiếp: ${nextProd.title}" style="font-size:16px;padding:4px;">›</a>
        </div>
      </div>

      <!-- Main Layout: 65% Gallery / 35% Sticky Info -->
      <div class="pdp-main-layout">
        <!-- Left Vertical Gallery -->
        <div class="pdp-left-gallery">
          ${(product.images || []).map((imgUrl, i) => `
            <div class="pdp-gallery-item" onclick="openImageZoomModal('${imgUrl}', '${product.title.replace(/'/g, "")}')">
              <img src="${imgUrl}" alt="${product.title} - ${i + 1}" loading="${i < 2 ? "eager" : "lazy"}" />
            </div>
          `).join("")}
        </div>

        <!-- Right Sticky Information -->
        <div class="pdp-right-info">
          <div class="pdp-vendor-tag">THIẾT KẾ ĐỘC QUYỀN • NÉT DUYÊN</div>
          <h1 class="bls__product-title">${product.title}</h1>

          <!-- Member Price Status Box -->
          ${state.user ? `
            <div class="member-price-status is-member">
              <span>✓</span>
              <div>
                <div style="font-weight:700;">Ưu đãi Hội viên VIP NÉT DUYÊN kích hoạt</div>
                <div style="font-size:12px;">Tài khoản ${state.user.name} được giảm 5% giá thuê khi thanh toán.</div>
              </div>
            </div>
          ` : `
            <div class="member-price-status">
              <span>🔒</span>
              <div>
                <div class="member-price-title">Ưu đãi Hội viên NÉT DUYÊN</div>
                <div style="font-size:12px;color:#495057;">Đăng nhập tài khoản để nhận ưu đãi giảm 5% mọi đơn thuê.</div>
                <a href="#account" class="member-login-button">Đăng nhập ngay</a>
              </div>
            </div>
          `}

          <!-- Service Mode Toggle: THUÊ TRANG PHỤC vs MUA MAY MỚI -->
          <div style="display:flex;border:1px solid #ebebeb;border-radius:8px;overflow:hidden;margin-bottom:18px;">
            <button
              type="button"
              id="pdpTabRent"
              class="active"
              onclick="switchPdpMode('rent')"
              style="flex:1;padding:12px;background:#111;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
            >
              <span>✨ ĐẶT THUÊ (TIÊU CHUẨN)</span>
            </button>
            <button
              type="button"
              id="pdpTabBuy"
              onclick="switchPdpMode('buy')"
              style="flex:1;padding:12px;background:#f5f5f5;color:#555;border:none;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
            >
              <span>🛍️ MUA MAY MỚI SỞ HỮU</span>
            </button>
          </div>

          <!-- OPTION 1: RENTAL BOX -->
          <div id="pdpRentSection">
            <!-- Rental Pricing Box -->
            <div class="rental-pricing-box">
              <div class="rent-price-headline">
                <span class="rent-main-amount">${formatVND(rentPrice)}</span>
                <span class="rent-unit">/ Gói 3 ngày 2 đêm</span>
              </div>
              <div class="rent-sub-info">
                <div>🔒 Tiền cọc đảm bảo: <strong>${formatVND(deposit)}</strong> (Hoàn lại 100% khi trả đồ)</div>
                <div>✨ May mới sở hữu: <strong>${formatVND(buyPrice)}</strong></div>
              </div>
            </div>

            <!-- Variant Swatches -->
            <div id="pdpSwatchesContainer" style="margin-bottom:18px;">
              ${(product.options || []).map((opt, optIdx) => `
                <div class="pdp-swatch-group">
                  <div class="swatch-label-row">
                    <span>${opt.name}:</span>
                    <strong id="swatchLabelVal_${optIdx}">${state.pdpSelectedOptions[optIdx]}</strong>
                  </div>
                  <div class="swatch-list">
                    ${(opt.values || []).map(val => `
                      <div
                        class="bls__option-swatch ${state.pdpSelectedOptions[optIdx] === val ? "active" : ""}"
                        onclick="selectPdpOption('${product.id}', ${optIdx}, '${val.replace(/'/g, "\\'")}')"
                      >
                        ${val}
                      </div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Size Guide & Support -->
            <div class="bls__product-addons" style="margin-bottom:18px;">
              <span class="bls__product_addons-btn" onclick="openSizeGuideModal()">
                <svg width="18" height="19" viewBox="0 0 18 19" fill="none"><path d="M9 0.5C4.9 0.5 0.3 3.3 0 9.5C0 11.9 0.9 14.2 2.7 15.8C4.4 17.6 6.7 18.5 9 18.5C11.4 18.5 13.7 17.6 15.3 15.8C17 14.1 18 11.8 18 9.4C17.9 3.3 13.3 0.5 9 0.5Z" stroke="#555" stroke-width="1.3"/></svg>
                <span>Hướng dẫn chọn Size</span>
              </span>
              <a class="bls__product_addons-btn" href="#pages/rental-policy">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Chính sách cọc & Hoàn cọc 100%</span>
              </a>
            </div>

            <!-- Rental Date Schedule Box -->
            <div class="rental-schedule-box">
              <div class="schedule-header">
                <span>🗓️ CHỌN LỊCH NHẬN & TRẢ TRANG PHỤC</span>
              </div>
              <div class="schedule-dates-row">
                <div class="schedule-field">
                  <label>Ngày nhận đồ:</label>
                  <input
                    type="date"
                    id="rentalStartDate"
                    class="schedule-date-input"
                    value="${state.pdpStartDate}"
                    min="${getFutureDate(0)}"
                    onchange="updateRentalDuration()"
                  />
                </div>
                <div class="schedule-arrow">➔</div>
                <div class="schedule-field">
                  <label>Ngày trả đồ:</label>
                  <input
                    type="date"
                    id="rentalEndDate"
                    class="schedule-date-input"
                    value="${state.pdpEndDate}"
                    min="${getFutureDate(1)}"
                    onchange="updateRentalDuration()"
                  />
                </div>
              </div>
              <div class="schedule-summary-tag" id="rentalDurationBadge">
                ⏳ Gói chuẩn: 3 ngày (${state.pdpStartDate} ➔ ${state.pdpEndDate})
              </div>
            </div>

            <!-- Addons Checkboxes (Mấn, Quạt, Guốc) -->
            <div class="rental-addons-box">
              <div class="addon-title">💎 PHỤ KIỆN PHỐI KÈM ƯU ĐÃI (TÙY CHỌN):</div>
              <label class="addon-checkbox">
                <input type="checkbox" id="addonMan" onchange="updateRentalTotal(3)" />
                <span>Mấn nhung đính ngọc trai (+50.000₫)</span>
              </label>
              <label class="addon-checkbox">
                <input type="checkbox" id="addonQuat" onchange="updateRentalTotal(3)" />
                <span>Quạt lụa tròn thủy mặc (+40.000₫)</span>
              </label>
              <label class="addon-checkbox">
                <input type="checkbox" id="addonGuoc" onchange="updateRentalTotal(3)" />
                <span>Guốc mộc quai nhung đỏ (+45.000₫)</span>
              </label>
              <div class="addon-free-perk">✓ Miễn phí giặt hấp chuẩn studio + Tặng túi bảo quản chuyên dụng</div>
            </div>

            <!-- Real-time Cost Breakdown Box -->
            <div class="rental-calc-breakdown">
              <div class="calc-row">
                <span>Tiền thuê áo dài:</span>
                <span id="calcRentAmount">${formatVND(rentPrice)}</span>
              </div>
              <div class="calc-row">
                <span>Phụ kiện chọn thêm:</span>
                <span id="calcAddonsAmount">0₫</span>
              </div>
              <div class="calc-row" style="color:#d9480f;">
                <span>Tiền cọc đảm bảo:</span>
                <span id="calcDepositAmount">${formatVND(deposit)}</span>
              </div>
              <div class="calc-row calc-total">
                <span>TỔNG THANH TOÁN TẠM TÍNH:</span>
                <span id="calcTotalPayment" style="color:#c92a2a;">${formatVND(rentPrice + deposit)}</span>
              </div>
              <div class="deposit-guarantee-note">
                * Lưu ý: Tiền cọc ${formatVND(deposit)} là khoản bảo đảm trang phục, sẽ được Nét Duyên hoàn trả 100% vào tài khoản của bạn ngay khi shop nhận lại đồ nguyên vẹn.
              </div>
            </div>

            <!-- Rental Action Buttons -->
            <button type="button" class="btn-rent-main" onclick="handleRentalAddToCart('${product.id}', false)">
              <span>ĐẶT GIỮ LỊCH THUÊ NGAY</span>
            </button>
            <button type="button" class="btn-primary" style="width:100%;margin-bottom:18px;" onclick="handleRentalAddToCart('${product.id}', true)">
              <span>THUÊ & THANH TOÁN ĐẶT CỌC NGAY</span>
            </button>
          </div>

          <!-- OPTION 2: BUY NEW OUTRIGHT SECTION -->
          <div id="pdpBuySection" style="display:none;padding:16px;border:1px solid #ebebeb;border-radius:8px;background:#fafafa;margin-bottom:18px;">
            <div style="font-size:13px;color:#555;margin-bottom:6px;">GIÁ MAY ĐO MỚI HOÀN TOÀN:</div>
            <div style="font-size:24px;font-weight:700;color:#111;margin-bottom:12px;">${formatVND(buyPrice)}</div>
            <p style="font-size:12.5px;color:#666;line-height:1.5;margin-bottom:16px;">
              Sở hữu vĩnh viễn chiếc áo dài may theo số đo riêng của bạn. Thời gian hoàn thiện từ 3–5 ngày làm việc với chất liệu lụa tơ sống cao cấp nhất.
            </p>
            <button type="button" class="btn-primary" style="width:100%;" onclick="handleBuyNowDirect('${product.id}')">
              ĐẶT MAY MỚI SỞ HỮU (${formatVND(buyPrice)})
            </button>
          </div>

          <!-- Accordion Information Tabs -->
          <div class="pdp-accordions">
            <div class="pdp-accordion-item active">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Quy trình thuê 4 bước tại Nét Duyên</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                <ol style="padding-left:18px;font-size:13px;line-height:1.7;margin:0;">
                  <li><strong>Chọn mẫu & lịch:</strong> Chọn ngày nhận đồ và ngày trả trên website hoặc thử trực tiếp tại showroom.</li>
                  <li><strong>Thanh toán cọc:</strong> Thanh toán tiền thuê + tiền cọc bảo đảm trang phục qua VietQR hoặc COD.</li>
                  <li><strong>Nhận đồ giặt hấp:</strong> Nét Duyên giao trang phục đã được giặt hấp, ủi phẳng phiu trước 1 ngày.</li>
                  <li><strong>Trả đồ & Hoàn cọc 100%:</strong> Gửi trả trang phục (không cần giặt), Nét Duyên chuyển khoản hoàn cọc 100% trong 2 giờ.</li>
                </ol>
              </div>
            </div>

            <div class="pdp-accordion-item active">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Chính sách cọc & Hoàn tiền cọc</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                <p style="font-size:13px;line-height:1.6;margin:0;">
                  - Số tiền cọc: <strong>${formatVND(deposit)}</strong> (được hoàn lại 100%).<br/>
                  - Khách hàng có thể để lại tiền mặt, chuyển khoản hoặc CCCD gắn chip (tại showroom).<br/>
                  - Cam kết hoàn trả ngay khi nhận lại trang phục không bị cháy tàn thuốc, rách hoặc dính hóa chất tẩy rửa.
                </p>
              </div>
            </div>

            <div class="pdp-accordion-item">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Mô tả chi tiết & Chất liệu</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                ${product.body_html || "<p>Chất liệu cao cấp, phom dáng chuẩn mực truyền thống Việt Nam.</p>"}
              </div>
            </div>

            <div class="pdp-accordion-item">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Cam kết vệ sinh & Bảo quản</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                <p style="font-size:13px;line-height:1.6;margin:0;">
                  - 100% trang phục được giặt hấp khử khuẩn chuyên dụng sau mỗi lượt thuê.<br/>
                  - Khách hàng không cần phải giặt ủi trước khi gửi trả đồ.<br/>
                  - Tặng kèm móc treo và túi bọc vải bảo vệ chống bụi suốt thời gian sử dụng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Products Recommendations -->
      <section class="bls__section" style="padding-top:20px;">
        <div class="bls__section-header">
          <h2 class="bls__section-heading" style="font-size:22px;">NÉT DUYÊN GỢI Ý CHO BẠN</h2>
        </div>
        <div class="bls__grid">
          ${related.map(p => renderProductCardHTML(p)).join("")}
        </div>
      </section>
    </div>

    <!-- Sticky Bottom Add-to-Cart Bar -->
    <div id="bls__sticky-addcart" class="bls__sticky-addcart">
      <div class="container sticky-addcart-inner">
        <div class="sticky-addcart-product">
          <div class="sticky-addcart-img">
            <img src="${(product.images && product.images[0]) || ''}" alt="${product.title}" />
          </div>
          <div>
            <div style="font-weight:600;color:#111;font-size:14px;">${product.title}</div>
            <div style="font-size:13px;color:#c92a2a;font-weight:600;">${formatVND(rentPrice)} / 3 ngày</div>
          </div>
        </div>
        <div class="sticky-addcart-controls">
          <button type="button" class="btn-primary" onclick="handleRentalAddToCart('${product.id}', false)">
            Đặt giữ lịch thuê
          </button>
        </div>
      </div>
    </div>
  `;
}

function getMatchingVariant(product) {
  if (!product.variants || product.variants.length === 0) return null;
  const opt0 = state.pdpSelectedOptions[0];
  const opt1 = state.pdpSelectedOptions[1];
  let found = product.variants.find(v => {
    if (opt0 && opt1) return v.option1 === opt0 && v.option2 === opt1;
    if (opt0) return v.option1 === opt0 || v.title === opt0;
    return true;
  });
  return found || product.variants[0];
}

function selectPdpOption(productId, optIdx, val) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;
  state.pdpSelectedOptions[optIdx] = val;

  const lbl = document.getElementById(`swatchLabelVal_${optIdx}`);
  if (lbl) lbl.textContent = val;

  // Re-render active swatches
  const container = document.getElementById("pdpSwatchesContainer");
  if (container) {
    container.innerHTML = (product.options || []).map((opt, idx) => `
      <div class="pdp-swatch-group">
        <div class="swatch-label-row">
          <span>${opt.name}:</span>
          <strong id="swatchLabelVal_${idx}">${state.pdpSelectedOptions[idx]}</strong>
        </div>
        <div class="swatch-list">
          ${(opt.values || []).map(v => `
            <div
              class="bls__option-swatch ${state.pdpSelectedOptions[idx] === v ? "active" : ""}"
              onclick="selectPdpOption('${product.id}', ${idx}, '${v.replace(/'/g, "\\'")}')"
            >
              ${v}
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }
}

/* ==========================================================================
   VIEW 4: FULL CART PAGE (#cart) & CHECKOUT PAGE (#checkout)
   ========================================================================== */
function renderCartPage() {
  document.title = "Giỏ trang phục thuê – NÉT DUYÊN";
  const main = document.getElementById("MainContent");

  if (state.cart.length === 0) {
    main.innerHTML = `
      <div class="container" style="padding:70px 15px;text-align:center;">
        <h1 style="font-size:26px;font-weight:600;color:#111;margin-bottom:14px;">GIỎ TRANG PHỤC CỦA BẠN</h1>
        <p style="margin-bottom:26px;color:#666;">Hiện tại chưa có mẫu trang phục nào trong giỏ hàng.</p>
        <a href="#collections/all" class="btn-primary">Khám phá Kho Áo Dài Cho Thuê</a>
      </div>
    `;
    return;
  }

  const rentTotal = getCartRentTotal();
  const depTotal = getCartDepositTotal();
  const grandTotal = getCartGrandTotal();

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 70px;">
      <div class="page-heading" style="padding-top:0;">
        <h1 class="heading-title">GIỎ HÀNG & LỊCH THUÊ</h1>
      </div>
      <table class="cart-page-table">
        <thead>
          <tr>
            <th>Trang phục</th>
            <th>Lịch thuê & Dịch vụ</th>
            <th>Tiền thuê</th>
            <th>Cọc đảm bảo</th>
            <th>Số lượng</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${state.cart.map(item => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:16px;">
                  <img src="${item.image}" alt="${item.title}" style="width:70px;height:94px;object-fit:cover;border-radius:4px;" />
                  <div>
                    <a href="#products/${item.handle}" style="font-weight:600;color:#111;text-transform:uppercase;text-decoration:none;">${item.title}</a>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Size: ${item.variantTitle}</div>
                    <div style="font-size:11px;color:${item.isRental ? '#2b8a3e' : '#d9480f'};font-weight:600;margin-top:2px;">
                      ${item.isRental ? '[THUÊ TRANG PHỤC]' : '[MUA MAY MỚI]'}
                    </div>
                  </div>
                </div>
              </td>
              <td style="font-size:12.5px;color:#555;">
                ${item.isRental ? `
                  <div>📅 ${item.startDate} ➔ ${item.endDate}</div>
                  <div style="font-size:11px;color:#777;">(${item.durationDays || 3} ngày thuê)</div>
                  ${item.addons && item.addons.length > 0 ? `<div style="font-size:11px;color:#2b8a3e;margin-top:2px;">+ ${item.addons.join(", ")}</div>` : ""}
                ` : `
                  <div>May đo theo yêu cầu</div>
                `}
              </td>
              <td style="font-weight:600;color:#111;">${formatVND(item.price)}</td>
              <td style="font-weight:600;color:#d9480f;">${formatVND(item.deposit)}</td>
              <td>
                <div class="minicart-qty-box">
                  <button type="button" onclick="updateCartQty('${item.key}', -1)">−</button>
                  <span>${item.qty}</span>
                  <button type="button" onclick="updateCartQty('${item.key}', 1)">+</button>
                </div>
              </td>
              <td style="font-weight:700;color:#c92a2a;">${formatVND((item.price + (item.deposit || 0)) * item.qty)}</td>
              <td>
                <button class="btn-reset" onclick="removeCartItem('${item.key}')" style="color:#888;text-decoration:underline;font-size:12px;">Xóa</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:30px;">
        <div style="width:380px;max-width:100%;border:1px solid #ebebeb;padding:24px;background:#fafafa;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#444;margin-bottom:8px;">
            <span>Tiền thuê trang phục:</span>
            <span style="font-weight:600;color:#111;">${formatVND(rentTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#d9480f;margin-bottom:8px;">
            <span>Tiền cọc đảm bảo (Hoàn lại 100%):</span>
            <span style="font-weight:600;">${formatVND(depTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#2b8a3e;margin-bottom:12px;">
            <span>Phí giặt hấp diệt khuẩn:</span>
            <span style="font-weight:600;">Tài trợ 100%</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:17px;font-weight:700;color:#c92a2a;padding-top:12px;border-top:1px solid #e0e0e0;margin-bottom:16px;">
            <span>TỔNG THANH TOÁN:</span>
            <span>${formatVND(grandTotal)}</span>
          </div>
          <p style="font-size:11.5px;color:#666;font-style:italic;margin-bottom:18px;line-height:1.4;">
            * Tiền cọc ${formatVND(depTotal)} sẽ được hoàn trả đầy đủ vào tài khoản ngân hàng của bạn ngay khi shop nhận lại đồ.
          </p>
          <button type="button" class="btn-primary" style="width:100%;" onclick="location.hash='#checkout'">Tiến hành Đặt cọc & Thanh toán</button>
        </div>
      </div>
    </div>
  `;
}

function renderCheckoutPage() {
  document.title = "Thanh toán & Đặt cọc – NÉT DUYÊN";
  const main = document.getElementById("MainContent");
  if (state.cart.length === 0) {
    location.hash = "#collections/all";
    return;
  }

  const rentTotal = getCartRentTotal();
  const depTotal = getCartDepositTotal();
  const memberDiscount = state.user ? Math.round(rentTotal * 0.05) : 0;
  const grandTotal = rentTotal + depTotal - memberDiscount;

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 80px;">
      <div class="page-heading" style="padding-top:0;">
        <h1 class="heading-title">THANH TOÁN & ĐẶT CỌC GIỮ LỊCH</h1>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:40px;align-items:flex-start;">
        <!-- Left: Customer and Delivery Form -->
        <form onsubmit="handleCheckoutSubmit(event)" style="border:1px solid #ebebeb;padding:28px;border-radius:8px;background:#fff;">
          <h3 style="font-size:16px;font-weight:700;color:#111;margin-bottom:18px;text-transform:uppercase;">1. Thông tin người thuê trang phục</h3>
          <div class="form-group">
            <label>Họ và tên *</label>
            <input type="text" id="chkName" class="form-input" required value="${state.user ? state.user.name : ""}" placeholder="Nhập họ và tên người thuê" />
          </div>
          <div class="form-group">
            <label>Số điện thoại (có Zalo) *</label>
            <input type="tel" id="chkPhone" class="form-input" required value="${state.user ? state.user.phone || "" : ""}" placeholder="Số điện thoại để shop gọi hẹn giờ giao đồ" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="chkEmail" class="form-input" value="${state.user ? state.user.email : ""}" placeholder="Email nhận biên lai và lịch hoàn cọc" />
          </div>
          <div class="form-group">
            <label>Địa chỉ nhận đồ chi tiết *</label>
            <input type="text" id="chkAddress" class="form-input" required placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" />
          </div>

          <h3 style="font-size:16px;font-weight:700;color:#111;margin:24px 0 16px;text-transform:uppercase;">2. Thông số để Nét Duyên hỗ trợ vừa in</h3>
          <div class="form-group">
            <label>Ghi chú số đo người mặc (Chiều cao, Cân nặng, Vòng eo)</label>
            <input type="text" id="chkMeasurements" class="form-input" placeholder="Ví dụ: Nữ 1m62, 48kg, eo 66cm (Thợ may sẽ căn chỉnh trước khi giao)" />
          </div>
          <div class="form-group">
            <label>Số Căn cước công dân / CMND (Không bắt buộc)</label>
            <input type="text" id="chkIdCard" class="form-input" placeholder="Dùng để đối chiếu khi nhận đồ & nhận lại tiền cọc" />
          </div>

          <h3 style="font-size:16px;font-weight:700;color:#111;margin:24px 0 16px;text-transform:uppercase;">3. Phương thức thanh toán & Đặt cọc</h3>
          <div class="form-group">
            <select id="chkPayment" class="form-input" style="font-weight:600;">
              <option value="BANK">Chuyển khoản Ngân hàng (VietQR - Xác nhận giữ lịch ngay)</option>
              <option value="COD">Thanh toán & Cọc khi nhận hàng tận nơi (COD)</option>
              <option value="STORE">Nhận áo & Cọc trực tiếp tại Showroom Nét Duyên</option>
            </select>
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:14px;padding:15px;font-size:15px;">
            Hoàn tất đặt lịch thuê (${formatVND(grandTotal)})
          </button>
        </form>

        <!-- Right: Order Summary -->
        <div style="border:1px solid #ebebeb;padding:26px;background:#fafafa;border-radius:8px;">
          <h3 style="font-size:16px;font-weight:700;color:#111;margin-bottom:18px;text-transform:uppercase;">Tóm tắt đơn thuê (${getCartTotalCount()})</h3>
          ${state.cart.map(item => `
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #ebebeb;font-size:13px;">
              <div>
                <div style="color:#111;font-weight:600;">${item.title} × ${item.qty}</div>
                <div style="color:#666;font-size:11.5px;margin-top:2px;">Size: ${item.variantTitle}</div>
                ${item.isRental ? `
                  <div style="color:#2b8a3e;font-size:11px;margin-top:2px;">📅 ${item.startDate} ➔ ${item.endDate}</div>
                  <div style="color:#888;font-size:11px;">Cọc: ${formatVND(item.deposit)} (Hoàn lại)</div>
                ` : ""}
              </div>
              <div style="color:#111;font-weight:600;text-align:right;">
                ${formatVND(item.price * item.qty)}
              </div>
            </div>
          `).join("")}

          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px;">
            <span>Tiền thuê & Dịch vụ:</span>
            <span>${formatVND(rentTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px;color:#d9480f;">
            <span>Tiền cọc đảm bảo:</span>
            <span>${formatVND(depTotal)}</span>
          </div>
          ${memberDiscount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px;color:#2b8a3e;">
              <span>Ưu đãi Hội viên VIP (-5% thuê):</span>
              <span>−${formatVND(memberDiscount)}</span>
            </div>
          ` : ""}
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px;">
            <span>Phí giặt hấp & Khử khuẩn:</span>
            <span style="color:#2b8a3e;font-weight:600;">Miễn phí</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #dedede;font-size:17px;font-weight:700;color:#c92a2a;">
            <span>TỔNG THANH TOÁN:</span>
            <span>${formatVND(grandTotal)}</span>
          </div>
          <div style="font-size:11px;color:#555;font-style:italic;margin-top:8px;line-height:1.4;">
            * Cam kết hoàn trả ${formatVND(depTotal)} tiền cọc ngay vào tài khoản khi shop nhận lại trang phục nguyên vẹn.
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  const rentTotal = getCartRentTotal();
  const depTotal = getCartDepositTotal();
  const memberDiscount = state.user ? Math.round(rentTotal * 0.05) : 0;
  const grandTotal = rentTotal + depTotal - memberDiscount;

  const order = {
    id: "ND-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString("vi-VN"),
    customerName: document.getElementById("chkName").value,
    phone: document.getElementById("chkPhone").value,
    email: document.getElementById("chkEmail") ? document.getElementById("chkEmail").value : "",
    address: document.getElementById("chkAddress").value,
    measurements: document.getElementById("chkMeasurements") ? document.getElementById("chkMeasurements").value : "",
    idCard: document.getElementById("chkIdCard") ? document.getElementById("chkIdCard").value : "",
    payment: document.getElementById("chkPayment").value,
    items: [...state.cart],
    rentTotal: rentTotal,
    depositTotal: depTotal,
    total: grandTotal,
    status: "Chờ xác nhận & chuẩn bị áo",
    rentalStatus: "Đang giữ đồ (Chờ hoàn cọc)"
  };

  state.orders.unshift(order);
  saveOrders();
  state.cart = [];
  saveCart();
  showToast(`Đặt lịch thuê thành công! Mã đơn: ${order.id}`);
  location.hash = "#account";
}

/* ==========================================================================
   VIEW 5: CUSTOMER ACCOUNT & ORDERS (#account)
   ========================================================================== */
function renderAccountView() {
  document.title = "Tài khoản hội viên – NÉT DUYÊN";
  const main = document.getElementById("MainContent");

  if (!state.user) {
    main.innerHTML = `
      <div class="container">
        <div class="auth-box">
          <h2>ĐĂNG NHẬP HỘI VIÊN</h2>
          <p style="font-size:13px;color:#666;margin-bottom:18px;text-align:center;">
            Đăng nhập để theo dõi lịch sử thuê áo dài, tiến độ hoàn cọc và nhận ưu đãi giảm 5%.
          </p>
          <form onsubmit="handleAuthLogin(event)">
            <div class="form-group">
              <label>Email *</label>
              <input type="email" id="loginEmail" class="form-input" required placeholder="Nhập địa chỉ email" value="khachhang@netduyen.vn" />
            </div>
            <div class="form-group">
              <label>Mật khẩu *</label>
              <input type="password" id="loginPass" class="form-input" required placeholder="Nhập mật khẩu" value="123456" />
            </div>
            <button type="submit" class="btn-primary" style="width:100%;margin-bottom:12px;">Đăng nhập</button>
          </form>
          <div style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid #ebebeb;">
            <p style="font-size:13px;margin-bottom:12px;">Chưa có tài khoản?</p>
            <button type="button" class="btn-secondary" style="width:100%;" onclick="renderRegisterBox()">Tạo tài khoản Hội viên VIP</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 80px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:30px;padding-bottom:20px;border-bottom:1px solid #ebebeb;">
        <div>
          <h1 style="font-size:24px;font-weight:700;color:#111;text-transform:uppercase;">TÀI KHOẢN HỘI VIÊN</h1>
          <p style="font-size:13.5px;color:#555;margin:4px 0 0;">
            Xin chào <strong>${state.user.name}</strong> (${state.user.email}) — <span style="color:#2b8a3e;font-weight:600;">Hội viên VIP (-5% mọi đơn thuê)</span>
          </p>
        </div>
        <button type="button" class="btn-secondary" onclick="handleLogout()">Đăng xuất</button>
      </div>

      <h3 style="font-size:17px;font-weight:700;color:#111;margin-bottom:16px;text-transform:uppercase;">Lịch sử thuê áo & Đơn hàng (${state.orders.length})</h3>
      ${state.orders.length === 0 ? `
        <div style="padding:30px;border:1px solid #ebebeb;border-radius:8px;text-align:center;color:#666;">
          <p style="margin-bottom:16px;">Bạn chưa có lịch thuê áo dài nào.</p>
          <a href="#collections/all" class="btn-primary">Khám phá Kho Áo Dài Cho Thuê</a>
        </div>
      ` : `
        <table class="cart-page-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Trang phục & Lịch thuê</th>
              <th>Tiền thuê</th>
              <th>Cọc đảm bảo</th>
              <th>Tổng tiền</th>
              <th>Trạng thái cọc</th>
              <th>Trạng thái đơn</th>
            </tr>
          </thead>
          <tbody>
            ${state.orders.map(o => `
              <tr>
                <td style="font-weight:700;color:#111;">${o.id}</td>
                <td>${o.date}</td>
                <td style="font-size:12.5px;">
                  ${(o.items || []).map(i => `
                    <div style="margin-bottom:4px;">
                      <strong>${i.title}</strong> (${i.variantTitle}) ×${i.qty}
                      ${i.isRental ? `<div style="color:#2b8a3e;font-size:11px;">📅 ${i.startDate} ➔ ${i.endDate}</div>` : ""}
                    </div>
                  `).join("")}
                </td>
                <td style="font-weight:600;">${formatVND(o.rentTotal || o.total)}</td>
                <td style="font-weight:600;color:#d9480f;">${formatVND(o.depositTotal || 0)}</td>
                <td style="font-weight:700;color:#c92a2a;">${formatVND(o.total)}</td>
                <td>
                  <span style="background:#fff9db;color:#d9480f;padding:4px 8px;border-radius:4px;font-size:11.5px;font-weight:600;">
                    ${o.rentalStatus || "Đang giữ đồ"}
                  </span>
                </td>
                <td>
                  <span style="background:#ebfbee;color:#2b8a3e;padding:4px 8px;border-radius:4px;font-size:11.5px;font-weight:600;">
                    ${o.status || "Đang xử lý"}
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `}
    </div>
  `;
}

function renderRegisterBox() {
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="container">
      <div class="auth-box">
        <h2>ĐĂNG KÝ HỘI VIÊN VIP</h2>
        <form onsubmit="handleAuthRegister(event)">
          <div class="form-group">
            <label>Họ và tên *</label>
            <input type="text" id="regName" class="form-input" required placeholder="Họ và tên của bạn" />
          </div>
          <div class="form-group">
            <label>Số điện thoại *</label>
            <input type="tel" id="regPhone" class="form-input" required placeholder="Số điện thoại" />
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="regEmail" class="form-input" required placeholder="Email của bạn" />
          </div>
          <div class="form-group">
            <label>Mật khẩu *</label>
            <input type="password" id="regPass" class="form-input" required placeholder="Mật khẩu" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-bottom:12px;">Đăng ký ngay</button>
        </form>
        <div style="text-align:center;margin-top:16px;">
          <button type="button" class="btn-secondary" style="width:100%;" onclick="renderAccountView()">Quay lại Đăng nhập</button>
        </div>
      </div>
    </div>
  `;
}

function handleAuthLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  state.user = {
    name: email.split("@")[0].toUpperCase() || "Khách Hàng VIP",
    email: email,
    phone: "0363860055"
  };
  saveUser();
  showToast(`Đăng nhập thành công! Chào mừng ${state.user.name}`);
  renderAccountView();
}

function handleAuthRegister(e) {
  e.preventDefault();
  state.user = {
    name: document.getElementById("regName").value.trim(),
    phone: document.getElementById("regPhone").value.trim(),
    email: document.getElementById("regEmail").value.trim()
  };
  saveUser();
  showToast(`Đăng ký thành công! Chào mừng ${state.user.name}`);
  renderAccountView();
}

function handleLogout() {
  state.user = null;
  saveUser();
  showToast("Đã đăng xuất tài khoản.");
  renderAccountView();
}

/* ==========================================================================
   VIEW 6: SEARCH RESULTS (#search/:query)
   ========================================================================== */
function renderSearchView(query) {
  const q = decodeURIComponent(query || "").trim().toLowerCase();
  document.title = `Tìm kiếm: "${q}" – NÉT DUYÊN`;
  const matches = NETDUYEN_PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.product_type && p.product_type.toLowerCase().includes(q)) ||
    (p.body_html && p.body_html.toLowerCase().includes(q))
  );

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">KẾT QUẢ TÌM KIẾM</h1>
        <div class="heading-description">Tìm thấy <strong>${matches.length}</strong> mẫu trang phục cho từ khóa "${q}"</div>
      </div>
    </div>
    <div class="container-fluid" style="padding-bottom:80px;">
      ${matches.length === 0 ? `
        <div style="text-align:center;padding:50px 15px;">
          <p style="margin-bottom:20px;color:#666;">Không có mẫu nào phù hợp. Bạn hãy thử tìm "Áo dài nữ", "Cưới cặp", "Nhật bình" hoặc "Áo dài nam".</p>
          <a href="#collections/all" class="btn-primary">Xem tất cả trang phục cho thuê</a>
        </div>
      ` : `
        <div class="bls__grid bls__grid-mode-4">
          ${matches.map(p => renderProductCardHTML(p)).join("")}
        </div>
      `}
    </div>
  `;
}

/* ==========================================================================
   VIEW 7: BLOGS / LOOKBOOK (#blogs)
   ========================================================================== */
function renderBlogsView() {
  document.title = "Lookbook & Câu chuyện di sản – NÉT DUYÊN";
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">LOOKBOOK & CÂU CHUYỆN DI SẢN</h1>
        <div class="heading-description">Những bộ ảnh áo dài tuyệt đẹp và bí quyết tỏa sáng trong trang phục truyền thống</div>
      </div>
    </div>
    <div class="container" style="padding-bottom:80px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;">
        ${NETDUYEN_BLOGS.map(b => `
          <article style="border:1px solid #ebebeb;border-radius:8px;overflow:hidden;background:#fff;">
            <img src="${b.image}" alt="${b.title}" style="width:100%;height:240px;object-fit:cover;" />
            <div style="padding:22px;">
              <div style="font-size:12px;color:#888;margin-bottom:8px;">${b.date} • Tác giả: ${b.author}</div>
              <h3 style="font-size:16px;font-weight:700;line-height:1.4;margin-bottom:12px;color:#111;">${b.title}</h3>
              <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:16px;">${b.excerpt}</p>
              <div style="border-top:1px solid #f0f0f0;padding-top:12px;">${b.content}</div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 8: POLICY & RENTAL GUIDE PAGE (#pages/:slug)
   ========================================================================== */
function renderPolicyView(slug) {
  const pol = NETDUYEN_POLICIES[slug] || NETDUYEN_POLICIES["rental-policy"] || NETDUYEN_POLICIES["privacy-policy"];
  document.title = `${pol.title} – NÉT DUYÊN`;
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">${pol.title}</h1>
      </div>
    </div>
    <div class="container" style="max-width:860px;padding-bottom:80px;font-size:14px;line-height:1.8;color:#333;">
      ${pol.content}
    </div>
  `;
}

/* ==========================================================================
   MODALS: SIZE GUIDE & IMAGE ZOOM
   ========================================================================== */
function openSizeGuideModal() {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  const backdrop = document.getElementById("ddModalBackdrop");
  if (!box || !content || !backdrop) return;
  box.style.maxWidth = "520px";
  content.innerHTML = `
    <div class="sg-page" style="padding:10px;">
      <h2 class="sg-title" style="font-size:18px;font-weight:700;margin-bottom:12px;text-align:center;">BẢNG SIZE ÁO DÀI NÉT DUYÊN (CM)</h2>
      <div class="sg-table-wrap">
        <table class="sg-table" style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;border:1px solid #ddd;">Thông số</th>
              <th style="padding:8px;border:1px solid #ddd;">S</th>
              <th style="padding:8px;border:1px solid #ddd;">M</th>
              <th style="padding:8px;border:1px solid #ddd;">L</th>
              <th style="padding:8px;border:1px solid #ddd;">XL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;">Vòng ngực</th>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">82–85</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">86–89</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">90–93</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">94–98</td>
            </tr>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;">Vòng eo</th>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">64–67</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">68–71</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">72–75</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">76–80</td>
            </tr>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;">Vòng mông</th>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">88–91</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">92–95</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">96–99</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">100–104</td>
            </tr>
            <tr>
              <th style="padding:8px;border:1px solid #ddd;">Cân nặng gợi ý</th>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">42–48 kg</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">49–54 kg</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">55–60 kg</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">61–68 kg</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size:12px;color:#666;font-style:italic;margin-top:12px;line-height:1.5;">
        * Nét Duyên luôn hỗ trợ thợ may chỉnh nới/bóp eo theo số đo cụ thể của bạn trước khi giao đồ hoàn toàn miễn phí.
      </p>
    </div>
  `;
  backdrop.classList.add("open");
}

function openImageZoomModal(imgUrl, title) {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  const backdrop = document.getElementById("ddModalBackdrop");
  if (!box || !content || !backdrop) return;
  box.style.maxWidth = "880px";
  content.innerHTML = `
    <div style="text-align:center;">
      <img src="${imgUrl}" alt="${title}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:4px;" />
      <div style="font-size:13px;color:#555;margin-top:8px;font-weight:600;">${title}</div>
    </div>
  `;
  backdrop.classList.add("open");
}

function closeDdModal() {
  const backdrop = document.getElementById("ddModalBackdrop");
  if (backdrop) backdrop.classList.remove("open");
}
const closeDDModal = closeDdModal;

/* ==========================================================================
   LIVE CHAT WIDGET
   ========================================================================== */
function toggleOmegaChat() {
  const box = document.getElementById("omegaChatBox");
  if (box) box.classList.toggle("open");
}

function handleOmegaChatSend(e) {
  e.preventDefault();
  const inp = document.getElementById("omegaChatInput");
  const msgBox = document.getElementById("omegaChatMessages");
  if (!inp || !inp.value.trim()) return;
  const text = inp.value.trim();
  inp.value = "";
  msgBox.innerHTML += `
    <div style="background:#111111;color:#fff;padding:9px 13px;border-radius:8px;margin-bottom:10px;margin-left:30px;text-align:right;">
      ${text}
    </div>
  `;
  setTimeout(() => {
    msgBox.innerHTML += `
      <div style="background:#ffffff;padding:10px 14px;border-radius:8px;border:1px solid #ebebeb;margin-bottom:10px;">
        Cảm ơn bạn đã liên hệ NÉT DUYÊN! Chuyên viên tư vấn thuê áo dài sẽ hỗ trợ bạn ngay hoặc bạn có thể gọi Hotline <strong>0363 860 055</strong> (Giữ nét Việt, trọn nét duyên).
      </div>
    `;
    msgBox.scrollTop = msgBox.scrollHeight;
  }, 500);
}

/* ==========================================================================
   ROUTER & INITIALIZATION
   ========================================================================== */
function handleRoute() {
  const hash = location.hash || "#home";
  window.scrollTo({ top: 0, behavior: "instant" });

  if (hash === "#home" || hash === "#/" || hash === "") {
    renderHomeView();
  } else if (hash.startsWith("#collections/")) {
    const slug = hash.replace("#collections/", "").split("?")[0] || "all";
    if (slug !== state.collectionSlug) state.currentPage = 1;
    renderCollectionView(slug);
  } else if (hash.startsWith("#products/")) {
    const handle = decodeURIComponent(hash.replace("#products/", ""));
    renderProductDetailView(handle);
  } else if (hash === "#cart") {
    renderCartPage();
  } else if (hash === "#checkout") {
    renderCheckoutPage();
  } else if (hash === "#account") {
    renderAccountView();
  } else if (hash.startsWith("#search/")) {
    renderSearchView(hash.replace("#search/", ""));
  } else if (hash === "#blogs") {
    renderBlogsView();
  } else if (hash.startsWith("#pages/")) {
    renderPolicyView(hash.replace("#pages/", ""));
  } else {
    renderHomeView();
  }
}

window.addEventListener("hashchange", handleRoute);
window.addEventListener("click", () => {
  const box = document.getElementById("sortDropdownBox");
  if (box) box.classList.remove("open");
});

window.addEventListener("scroll", () => {
  const hdr = document.getElementById("page-header");
  if (hdr) {
    hdr.classList.toggle("is-sticky", window.scrollY > 50);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  updateAuthTopbar();
  handleRoute();
});
