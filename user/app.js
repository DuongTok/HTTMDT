/* ==========================================================================
   NÉT DUYÊN — DỊCH VỤ CHO THUÊ ÁO DÀI & CỔ PHỤC CAO CẤP
   Slogan: "Giữ nét Việt, trọn nét duyên."
   Full Version: Interactive PDP, Image Switching, Reviews, Clickwrap, Promo & Rewards
   ========================================================================== */

const STORAGE_KEYS = {
  CART: "ddvn_cart_v1",
  USER: "ddvn_user_v1",
  ORDERS: "ddvn_orders_v1",
  CUSTOM_PRODUCTS: "netduyen_custom_products_v1",
  REVIEWS: "netduyen_reviews_v1",
  PROMO_SEEN: "netduyen_promo_closed_v1"
};

// Default Customer Feedback Data
const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    productId: 9300000001,
    name: "Nguyễn Thảo My",
    phone: "098***432",
    date: "28/10/2026",
    rating: 5,
    productTitle: "SET ÁO CƯỚI CẶP ĐÔI LONG PHỤNG SUM VẦY",
    variantRented: "Cô dâu S / Chú rể L (Gói 3 ngày)",
    comment: "Áo nhận được rất thơm tho, tà áo ủi phẳng lỳ tinh tươm. Mình có nhờ shop bóp nhẹ eo 2cm shop làm rất tỉ mỉ, mặc lên chụp ảnh lễ ăn hỏi ai cũng khen nức nở. Lúc gửi trả đồ xong 30 phút là shop chuyển khoản hoàn lại 100% tiền cọc 1.800.000₫ ngay. Rất uy tín và chuyên nghiệp!",
    photos: [
      "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315", "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265918copy4.jpg?v=1787218844"
    ],
    verified: true
  },
  {
    id: "rev-2",
    productId: 9100000001,
    name: "Trần Minh Quân",
    phone: "091***885",
    date: "26/10/2026",
    rating: 5,
    productTitle: "ÁO DÀI NAM LONG VÂN GẤM ĐEN HOÀNG GIA",
    variantRented: "Size L (Gói 3 ngày 2 đêm)",
    comment: "Áo form cứng cáp, gấm dệt chỉ vàng sắc nét, mặc dự tiệc cưới bạn thân rất sang trọng và đĩnh đạc. Giao hàng đúng giờ trước sự kiện 1 ngày. Tiền cọc hoàn trả đầy đủ không thiếu 1 đồng. Sẽ tiếp tục ủng hộ Nét Duyên!",
    photos: [
      "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265820copy3.jpg?v=1787217874"
    ],
    verified: true
  },
  {
    id: "rev-3",
    productId: 9200000001,
    name: "Lê Hoàng Yến",
    phone: "090***619",
    date: "24/10/2026",
    rating: 5,
    productTitle: "CỔ PHỤC ÁO NHẬT BÌNH CUNG ĐÌNH HUẾ",
    variantRented: "Freesize (Gói 3 ngày kèm Mấn)",
    comment: "Cổ phục Nhật Bình đẹp xuất sắc từng đường kim thêu hoa văn ngũ phụng, chất vải dày dặn và mấn ngọc đội vừa vặn êm đầu. Nhóm mình chụp ở Hoàng Thành Thăng Long được bao nhiêu người hỏi thuê ở đâu. 10/10 điểm!",
    photos: [
      "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265701copy4.jpg?v=1787216608", "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/0144.jpg?v=1767843482"
    ],
    verified: true
  },
  {
    id: "rev-4",
    productId: 7806504894531,
    name: "Vũ Thùy Linh",
    phone: "097***210",
    date: "22/10/2026",
    rating: 5,
    productTitle: "ÁO DÀI THƯ HIÊN - VÁY HAI DÂY DẶM TIÊN",
    variantRented: "Size M / Lớp Ngoài & Trong",
    comment: "Chất tơ sống bay bổng, màu sắc nhẹ nhàng đúng chuẩn ảnh chụp trên web. Khi nhận có cả móc treo và túi bọc bảo quản sạch sẽ. Shop hỗ trợ nhiệt tình và hoàn cọc siêu nhanh.",
    photos: [
      "https://dingdangvietnam.com/cdn/shop/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315&width=940"
    ],
    verified: true
  }
];

// Initialize Reviews Store
function getStoredReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (raw) {
      // Invalidate old broken review images cache if present
      if (raw.includes("0981/5025") || raw.includes("quyennguyen.vn")) {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
        return DEFAULT_REVIEWS;
      }
      return JSON.parse(raw);
    }
  } catch (e) {}
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
  return DEFAULT_REVIEWS;
}

function saveReviews(revs) {
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(revs));
}

// Đồng bộ sản phẩm từ phân hệ Admin (nếu Admin có cập nhật sản phẩm trong localStorage)
(function syncAdminProducts() {
  try {
    const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (custom) {
      // Invalidate old broken cache if present
      if (custom.includes("0981/5025") || custom.includes("quyennguyen.vn")) {
        localStorage.removeItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
        return;
      }
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
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || '{"name":"KHÁCH HÀNG VIP","email":"khachhang@netduyen.vn","phone":"0363860055","points":150,"vouchers":["NETDUYEN50"]}'),
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
  pdpTabMode: "rent",
  currentPdpProduct: null,
  activePromoCode: null,
  appliedVoucherDiscount: 0,
  usePointsDiscount: false,
  reviewFilter: "all"
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
  }, 3000);
}

function updateAuthTopbar() {
  const el = document.getElementById("topbarAuthText");
  if (!el) return;
  if (state.user) {
    el.textContent = `Xin chào, ${state.user.name} (${state.user.points || 0} Điểm Duyên)`;
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
  const base = getCartRentTotal() + getCartDepositTotal();
  const disc = state.appliedVoucherDiscount || 0;
  return Math.max(0, base - disc);
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

  const addonsList = customOptions.addons || [];
  let addonsCost = customOptions.addonsCost || 0;

  const finalItemPrice = buyMode
    ? (product.buy_price || 2500000)
    : (rentBase + extraDaysCost + addonsCost);

  const activeImg = customOptions.image || (product.images && product.images[0]) || "";
  const key = `${product.id}_${variant.id}_${buyMode ? "buy" : "rent"}_${customOptions.startDate || ""}_${Date.now()}`;

  state.cart.push({
    key,
    productId: product.id,
    handle: product.handle,
    title: product.title,
    image: activeImg,
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
          Phân loại: <strong>${item.variantTitle}</strong> • ${item.isRental ? '<span style="color:#2b8a3e;font-weight:600;">[THUÊ ĐỒ]</span>' : '<span style="color:#d9480f;font-weight:600;">[MUA MỚI]</span>'}
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
              <img src="${img1}" alt="${product.title}" loading="lazy" onerror="this.onerror=null;this.src='https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315';" />
            </div>
            <div class="bls__product-hover-img">
              <img src="${img2}" alt="${product.title}" loading="lazy" onerror="this.onerror=null;this.src='https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265918copy4.jpg?v=1787218844';" />
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
   INTERACTIVE PDP RENTAL & IMAGE SWITCHING HELPERS
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

  const mainImgEl = document.getElementById("pdpMainFeaturedImg");
  const activeImg = mainImgEl ? mainImgEl.src : (product.images && product.images[0]);

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
      addonsCost: addonsCost,
      image: activeImg
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

// SWITCH ACTIVE FEATURED IMAGE IN PDP
function setPdpActiveImage(imgUrl, thumbIdx) {
  const mainImg = document.getElementById("pdpMainFeaturedImg");
  if (!mainImg) return;
  mainImg.style.opacity = "0.4";
  setTimeout(() => {
    mainImg.src = imgUrl;
    mainImg.style.opacity = "1";
  }, 120);

  // Update active thumbnail
  document.querySelectorAll(".pdp-thumb-item").forEach((thumb, idx) => {
    thumb.classList.toggle("active", idx === thumbIdx);
  });
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

  // INTERACTIVE IMAGE SWITCHING:
  // When an option is picked (color, type, style), switch to that specific sample image!
  const opt = product.options && product.options[optIdx];
  if (opt && opt.values && product.images && product.images.length > 0) {
    const valIdx = opt.values.indexOf(val);
    if (valIdx !== -1) {
      const targetImgIdx = valIdx % product.images.length;
      setPdpActiveImage(product.images[targetImgIdx], targetImgIdx);
    }
  }
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
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265918copy4.jpg?v=1787218844",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265820copy3.jpg?v=1787217874",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265701copy4.jpg?v=1787216608",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/0144.jpg?v=1767843482",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/092_70290991-cc0e-4e8f-9487-5c27e2c55e22.jpg?v=1767842006",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/0133.jpg?v=1767859673",
    "https://cdn.shopify.com/s/files/1/0604/1947/3475/files/087_1fd57989-3f27-43ef-97b9-4fc67c855f3d.jpg?v=1767841805"
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
          <p class="bls__section-des">Hơn 180+ mẫu trang phục được chăm sóc giặt hấp chuẩn studio</p>
        </div>
        <div class="collection-list-grid">
          <div class="collection-card" onclick="location.hash='#collections/ao-dai-nu'">
            <img src="https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315" alt="ÁO DÀI NỮ" />
            <span class="collection-card-label">ÁO DÀI NỮ</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/ao-dai-nam'">
            <img src="https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265820copy3.jpg?v=1787217874" alt="ÁO DÀI NAM" />
            <span class="collection-card-label">ÁO DÀI NAM</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/ao-cuoi-cap'">
            <img src="https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265918copy4.jpg?v=1787218844" alt="ÁO CƯỚI CẶP" />
            <span class="collection-card-label">ÁO CƯỚI CẶP</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/co-phuc'">
            <img src="https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107265701copy4.jpg?v=1787216608" alt="CỔ PHỤC VIỆT" />
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
        <span>HOÀN CỌC 100% NHANH CHÓNG TRONG 2 GIỜ</span><span>•</span>
        <span>MIỄN PHÍ GIẶT HẤP KHỬ KHUẨN</span><span>•</span>
        <span>HỖ TRỢ CHỈNH SỬA SỐ ĐO MIỄN PHÍ</span><span>•</span>
        <span>TÍCH ĐIỂM DUYÊN ĐỔI VOUCHER</span><span>•</span>
        <span>NÉT DUYÊN • GIỮ NÉT VIỆT, TRỌN NÉT DUYÊN</span>
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
              <img src="${src}" alt="MUSE OF NÉT DUYÊN" loading="lazy" onerror="this.onerror=null;this.src='https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315';" />
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

    <div class="section-collection-product">
      <div class="container-fluid">
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

        <div class="bls__grid bls__grid-mode-${state.viewMode}" id="collectionGrid">
          ${pageItems.map(p => renderProductCardHTML(p)).join("")}
        </div>

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
  const related = NETDUYEN_PRODUCTS.filter(p => p.id !== product.id && p.collections && p.collections.some(c => product.collections && product.collections.includes(c))).slice(0, 4);

  const selectedVariant = getMatchingVariant(product);
  const rentPrice = product.rent_price || 280000;
  const deposit = product.deposit || 500000;
  const buyPrice = product.buy_price || product.price || 2500000;

  const images = product.images && product.images.length > 0 ? product.images : [""];
  const initialMainImg = images[0];

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

      <!-- Main Layout: 60% Interactive Gallery / 40% Sticky Info -->
      <div class="pdp-main-layout">
        <!-- Left Interactive Gallery with Featured Stage & Thumbnails -->
        <div class="pdp-left-gallery">
          <div class="pdp-stage-wrap" id="pdpMainStageWrap" onclick="openImageZoomModal(document.getElementById('pdpMainFeaturedImg').src, '${product.title.replace(/'/g, "")}')">
            <img id="pdpMainFeaturedImg" class="pdp-stage-main-img" src="${initialMainImg}" alt="${product.title}" onerror="this.onerror=null;this.src='https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315';" />
            <div class="pdp-zoom-badge">🔍 Nhấp phóng to ảnh mẫu</div>
          </div>

          <!-- Thumbnail Row (Clicking switches main image) -->
          <div class="pdp-thumb-list" id="pdpThumbnailsRow">
            ${images.map((imgUrl, i) => `
              <div
                class="pdp-thumb-item ${i === 0 ? 'active' : ''}"
                onclick="setPdpActiveImage('${imgUrl}', ${i})"
                title="Mẫu ảnh ${i + 1}"
              >
                <img src="${imgUrl}" alt="${product.title} - ${i + 1}" loading="lazy" onerror="this.onerror=null;this.src='https://cdn.shopify.com/s/files/1/0604/1947/3475/files/DINGDANGAODAI0107266017copy3.jpg?v=1787219315';" />
              </div>
            `).join("")}
          </div>
          <div style="font-size:12px;color:#777;margin-top:6px;font-style:italic;">
            * Nhấp vào ảnh thumbnail hoặc chọn phân loại bên phải để xem chi tiết từng mẫu màu & thiết kế.
          </div>
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
                <div style="font-size:12px;">Tài khoản ${state.user.name} (${state.user.points || 0} Điểm Duyên) được giảm 5% khi thanh toán.</div>
              </div>
            </div>
          ` : `
            <div class="member-price-status">
              <span>🔒</span>
              <div>
                <div class="member-price-title">Ưu đãi Hội viên NÉT DUYÊN</div>
                <div style="font-size:12px;color:#495057;">Đăng nhập tài khoản để tích điểm đổi voucher và giảm 5% mọi đơn thuê.</div>
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

            <!-- Variant Swatches with Dynamic Image Switch on Click -->
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
                * Tiền cọc ${formatVND(deposit)} là khoản bảo đảm trang phục, sẽ được Nét Duyên hoàn trả 100% vào tài khoản của bạn ngay khi shop nhận lại đồ nguyên vẹn.
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
          </div>
        </div>
      </div>

      <!-- CUSTOMER REVIEWS & FEEDBACK SECTION -->
      <section class="pdp-reviews-section" id="pdpReviewsSection">
        <div class="bls__section-header" style="text-align:left;margin-bottom:20px;">
          <h2 class="bls__section-heading" style="font-size:22px;">ĐÁNH GIÁ & FEEDBACK TỪ KHÁCH THUÊ THỰC TẾ</h2>
          <p class="bls__section-des">Hình ảnh thật 100% từ khách hàng đã trải nghiệm dịch vụ thuê áo dài NÉT DUYÊN</p>
        </div>

        <!-- Rating Summary Card -->
        <div class="reviews-header-card">
          <div class="rating-score-box">
            <div class="rating-big-num">4.9</div>
            <div class="rating-stars-gold">★★★★★</div>
            <div style="font-size:12.5px;color:#666;">Dựa trên <strong>48 đánh giá</strong></div>
          </div>
          <div class="rating-bars-wrap">
            <div class="rating-bar-row">
              <span>5 sao</span>
              <div class="rating-bar-track"><div class="rating-bar-fill" style="width:92%;"></div></div>
              <span>92%</span>
            </div>
            <div class="rating-bar-row">
              <span>4 sao</span>
              <div class="rating-bar-track"><div class="rating-bar-fill" style="width:8%;"></div></div>
              <span>8%</span>
            </div>
            <div class="rating-bar-row">
              <span>3 sao</span>
              <div class="rating-bar-track"><div class="rating-bar-fill" style="width:0%;"></div></div>
              <span>0%</span>
            </div>
          </div>
          <div>
            <button type="button" class="btn-open-review" onclick="openWriteReviewModal('${product.id}')">
              ✍️ Viết đánh giá (+50 Điểm Duyên)
            </button>
          </div>
        </div>

        <!-- Reviews Filter Bar -->
        <div class="reviews-filter-bar">
          <button type="button" class="review-filter-btn ${state.reviewFilter === 'all' ? 'active' : ''}" onclick="setReviewFilter('all')">Tất cả (48)</button>
          <button type="button" class="review-filter-btn ${state.reviewFilter === 'photo' ? 'active' : ''}" onclick="setReviewFilter('photo')">Có hình ảnh (26)</button>
          <button type="button" class="review-filter-btn ${state.reviewFilter === '5star' ? 'active' : ''}" onclick="setReviewFilter('5star')">5 Sao (44)</button>
          <button type="button" class="review-filter-btn ${state.reviewFilter === '4star' ? 'active' : ''}" onclick="setReviewFilter('4star')">4 Sao (4)</button>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list" id="pdpReviewsListContainer">
          ${renderReviewsListHTML(product.id)}
        </div>
      </section>

      <!-- Related Products Recommendations -->
      <section class="bls__section" style="padding-top:40px;">
        <div class="bls__section-header">
          <h2 class="bls__section-heading" style="font-size:22px;">NÉT DUYÊN GỢI Ý CHO BẠN</h2>
        </div>
        <div class="bls__grid">
          ${related.map(p => renderProductCardHTML(p)).join("")}
        </div>
      </section>
    </div>

    <!-- Sticky Bottom Bar -->
    <div id="bls__sticky-addcart" class="bls__sticky-addcart">
      <div class="container sticky-addcart-inner">
        <div class="sticky-addcart-product">
          <div class="sticky-addcart-img">
            <img src="${initialMainImg}" alt="${product.title}" />
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

function renderReviewsListHTML(productId) {
  const allRevs = getStoredReviews();
  let filtered = allRevs;
  if (state.reviewFilter === "photo") {
    filtered = allRevs.filter(r => r.photos && r.photos.length > 0);
  } else if (state.reviewFilter === "5star") {
    filtered = allRevs.filter(r => r.rating === 5);
  } else if (state.reviewFilter === "4star") {
    filtered = allRevs.filter(r => r.rating === 4);
  }

  if (filtered.length === 0) {
    return `<div style="padding:20px;text-align:center;color:#666;">Chưa có đánh giá nào phù hợp với bộ lọc.</div>`;
  }

  return filtered.map(r => {
    const starStr = "★".repeat(r.rating) + "☆".repeat(Math.max(0, 5 - r.rating));
    const firstLetter = (r.name || "K").charAt(0).toUpperCase();
    return `
      <div class="review-item-card">
        <div class="review-customer-header">
          <div class="review-customer-info">
            <div class="review-avatar">${firstLetter}</div>
            <div>
              <div style="font-weight:700;font-size:13.5px;color:#111;">
                ${r.name}
                ${r.verified ? '<span class="review-verified-badge">✓ Đã thuê đồ tại Nét Duyên</span>' : ''}
              </div>
              <div style="font-size:11.5px;color:#888;">Gói thuê: ${r.variantRented || 'Gói 3 ngày'} • Ngày đăng: ${r.date}</div>
            </div>
          </div>
          <div class="rating-stars-gold" style="font-size:15px;margin:0;">${starStr}</div>
        </div>
        <div class="review-text">${r.comment}</div>
        ${r.photos && r.photos.length > 0 ? `
          <div class="review-photos-grid">
            ${r.photos.map(pUrl => `
              <img
                src="${pUrl}"
                alt="Ảnh feedback khách hàng Nét Duyên"
                class="review-photo-thumb"
                onclick="openImageZoomModal('${pUrl}', 'Feedback thực tế từ khách hàng ${r.name}')"
                loading="lazy"
              />
            `).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

function setReviewFilter(filterType) {
  state.reviewFilter = filterType;
  const container = document.getElementById("pdpReviewsListContainer");
  if (container && state.currentPdpProduct) {
    container.innerHTML = renderReviewsListHTML(state.currentPdpProduct.id);
  }
  document.querySelectorAll(".review-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.toLowerCase().includes(filterType.toLowerCase()) || (filterType === 'all' && btn.textContent.includes('Tất cả')));
  });
}

function openWriteReviewModal(productId) {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  const backdrop = document.getElementById("ddModalBackdrop");
  if (!box || !content || !backdrop) return;

  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId)) || state.currentPdpProduct;

  box.style.maxWidth = "520px";
  content.innerHTML = `
    <div style="padding:10px;">
      <h3 style="font-size:18px;font-weight:700;color:#111;margin-bottom:6px;">GỬI ĐÁNH GIÁ & FEEDBACK</h3>
      <p style="font-size:12.5px;color:#666;margin-bottom:16px;">
        Chia sẻ cảm nhận thực tế về chất vải, phom dáng và dịch vụ thuê để nhận ngay <strong>+50 Điểm Duyên</strong> đổi voucher.
      </p>

      <form onsubmit="handleReviewSubmit(event, '${product ? product.id : ''}')">
        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:4px;">Bạn chấm điểm trang phục mấy sao? *</label>
          <select id="reviewRatingInput" class="form-input" style="font-weight:700;color:#f59f00;">
            <option value="5">★★★★★ - 5 Sao (Cực kỳ hài lòng, áo đẹp thơm, hoàn cọc nhanh)</option>
            <option value="4">★★★★☆ - 4 Sao (Hài lòng, áo vừa vặn)</option>
            <option value="3">★★★☆☆ - 3 Sao (Bình thường)</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:4px;">Họ và tên của bạn *</label>
          <input type="text" id="reviewNameInput" class="form-input" required value="${state.user ? state.user.name : ''}" placeholder="Nhập họ tên của bạn" />
        </div>

        <div class="form-group" style="margin-bottom:12px;">
          <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:4px;">Số điện thoại (để xác thực đã thuê đồ) *</label>
          <input type="tel" id="reviewPhoneInput" class="form-input" required value="${state.user ? state.user.phone || '' : ''}" placeholder="Số điện thoại của bạn (sẽ ẩn 3 số cuối)" />
        </div>

        <div class="form-group" style="margin-bottom:16px;">
          <label style="font-size:12.5px;font-weight:600;display:block;margin-bottom:4px;">Cảm nhận chi tiết của bạn *</label>
          <textarea id="reviewCommentInput" class="form-input" rows="4" required placeholder="Áo mặc lên tôn dáng không? Phom áo và chất liệu thế nào? Shop hoàn trả tiền cọc có nhanh chóng không?"></textarea>
        </div>

        <button type="submit" class="btn-primary" style="width:100%;padding:13px;font-weight:700;">GỬI ĐÁNH GIÁ NGAY (+50 ĐIỂM DUYÊN)</button>
      </form>
    </div>
  `;
  backdrop.classList.add("open");
}

function handleReviewSubmit(e, productId) {
  e.preventDefault();
  const name = document.getElementById("reviewNameInput").value.trim();
  const phone = document.getElementById("reviewPhoneInput").value.trim();
  const rating = parseInt(document.getElementById("reviewRatingInput").value, 10) || 5;
  const comment = document.getElementById("reviewCommentInput").value.trim();

  const revs = getStoredReviews();
  const newRev = {
    id: "rev-" + Date.now(),
    productId: productId || 0,
    name: name,
    phone: phone.slice(0, 3) + "***" + phone.slice(-3),
    date: new Date().toLocaleDateString("vi-VN"),
    rating: rating,
    productTitle: state.currentPdpProduct ? state.currentPdpProduct.title : "Áo Dài Nét Duyên",
    variantRented: "Gói thuê 3 ngày (Đã hoàn cọc)",
    comment: comment,
    photos: state.currentPdpProduct && state.currentPdpProduct.images ? [state.currentPdpProduct.images[0]] : [],
    verified: true
  };

  revs.unshift(newRev);
  saveReviews(revs);

  // Award 50 points to user
  if (state.user) {
    state.user.points = (state.user.points || 0) + 50;
    saveUser();
  }

  closeDdModal();
  showToast("🎉 Cảm ơn bạn! Đánh giá đã được đăng và bạn nhận được +50 Điểm Duyên!");

  const container = document.getElementById("pdpReviewsListContainer");
  if (container) {
    container.innerHTML = renderReviewsListHTML(productId);
  }
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
                    <div style="font-size:12px;color:#666;margin-top:4px;">Size / Phân loại: ${item.variantTitle}</div>
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
  const voucherDiscount = state.appliedVoucherDiscount || 0;
  const grandTotal = Math.max(0, rentTotal + depTotal - memberDiscount - voucherDiscount);

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 80px;">
      <div class="page-heading" style="padding-top:0;">
        <h1 class="heading-title">THANH TOÁN & ĐẶT CỌC GIỮ LỊCH</h1>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:40px;align-items:flex-start;">
        <!-- Left: Customer Form and Clickwrap -->
        <form onsubmit="handleCheckoutSubmit(event)" style="border:1px solid #ebebeb;padding:28px;border-radius:8px;background:#fff;">
          <h3 style="font-size:16px;font-weight:700;color:#111;margin-bottom:18px;text-transform:uppercase;">1. Thông tin người thuê trang phục</h3>
          <div class="form-group">
            <label>Họ và tên người thuê *</label>
            <input type="text" id="chkName" class="form-input" required value="${state.user ? state.user.name : ""}" placeholder="Nhập họ và tên" />
          </div>
          <div class="form-group">
            <label>Số điện thoại (có Zalo) *</label>
            <input type="tel" id="chkPhone" class="form-input" required value="${state.user ? state.user.phone || "" : ""}" placeholder="Số điện thoại nhận hẹn giờ giao đồ" />
          </div>
          <div class="form-group">
            <label>Email nhận biên lai hoàn cọc</label>
            <input type="email" id="chkEmail" class="form-input" value="${state.user ? state.user.email : ""}" placeholder="Email của bạn" />
          </div>
          <div class="form-group">
            <label>Địa chỉ nhận trang phục tận nơi *</label>
            <input type="text" id="chkAddress" class="form-input" required placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" />
          </div>

          <h3 style="font-size:16px;font-weight:700;color:#111;margin:24px 0 16px;text-transform:uppercase;">2. Thông số để Nét Duyên chỉnh eo tà vừa in</h3>
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

          <!-- 4. CLICKWRAP AGREEMENT & LEGAL ELECTRONIC SIGNATURE -->
          <div class="clickwrap-agreement-box">
            <label class="clickwrap-checkbox-label">
              <input type="checkbox" id="chkAgreeContract" required onchange="handleClickwrapChange()" />
              <span>
                Tôi xác nhận đã đọc, hiểu rõ và đồng ý với các điều khoản trong 
                <a href="javascript:void(0)" onclick="openContractModal()" class="contract-link">
                  Hợp đồng cho thuê trang phục & Quy chế hoàn trả tiền cọc
                </a> 
                của NÉT DUYÊN. Tôi xác nhận việc tích chọn này có giá trị pháp lý như Chữ ký điện tử của tôi.
              </span>
            </label>
            <div class="electronic-signature-note">
              <span class="sig-badge">CHỨNG THỰC ĐIỆN TỬ</span>
              <span>Giao kết được mã hóa và lưu trữ cùng Mã đơn hàng theo Luật Giao dịch điện tử.</span>
            </div>
          </div>

          <button
            type="submit"
            id="btnSubmitCheckout"
            class="btn-primary"
            style="width:100%;margin-top:14px;padding:15px;font-size:15px;font-weight:700;"
          >
            Hoàn tất đặt lịch thuê (${formatVND(grandTotal)})
          </button>
        </form>

        <!-- Right: Order Summary & Voucher / Reward Points -->
        <div style="border:1px solid #ebebeb;padding:26px;background:#fafafa;border-radius:8px;">
          <h3 style="font-size:16px;font-weight:700;color:#111;margin-bottom:18px;text-transform:uppercase;">Tóm tắt đơn thuê (${getCartTotalCount()})</h3>
          ${state.cart.map(item => `
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #ebebeb;font-size:13px;">
              <div>
                <div style="color:#111;font-weight:600;">${item.title} × ${item.qty}</div>
                <div style="color:#666;font-size:11.5px;margin-top:2px;">Phân loại: ${item.variantTitle}</div>
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

          <!-- Voucher & Loyalty Points Box -->
          <div class="checkout-points-apply">
            <label style="font-size:12.5px;font-weight:700;color:#111;display:block;margin-bottom:6px;">MÃ GIẢM GIÁ / VOUCHER:</label>
            <div style="display:flex;gap:6px;margin-bottom:10px;">
              <input type="text" id="voucherCodeInput" class="form-input" style="padding:8px 10px;text-transform:uppercase;" placeholder="Nhập mã (VD: NETDUYEN50)" value="${state.activePromoCode || ''}" />
              <button type="button" class="btn-primary" style="padding:0 14px;font-size:12px;" onclick="applyVoucherCode()">Áp dụng</button>
            </div>
            ${state.user ? `
              <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#b8621b;font-weight:600;cursor:pointer;">
                <input type="checkbox" id="chkUseRewardPoints" ${state.usePointsDiscount ? 'checked' : ''} onchange="toggleUsePoints(this.checked)" />
                <span>Dùng ${state.user.points || 0} Điểm Duyên tích lũy (Giảm ${formatVND((state.user.points || 0) * 500)})</span>
              </label>
            ` : ""}
          </div>

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
          ${voucherDiscount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13.5px;color:#c92a2a;font-weight:600;">
              <span>Giảm giá Voucher / Điểm Duyên:</span>
              <span>−${formatVND(voucherDiscount)}</span>
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

function handleClickwrapChange() {
  const chk = document.getElementById("chkAgreeContract");
  const btn = document.getElementById("btnSubmitCheckout");
  if (btn && chk) {
    btn.style.opacity = chk.checked ? "1" : "0.7";
  }
}

function applyVoucherCode() {
  const inp = document.getElementById("voucherCodeInput");
  if (!inp) return;
  const code = inp.value.trim().toUpperCase();
  if (code === "NETDUYEN50" || code === "DUYEN50K") {
    state.activePromoCode = code;
    state.appliedVoucherDiscount = 50000;
    showToast("🎉 Đã áp dụng mã giảm giá 50.000₫ thành công!");
    renderCheckoutPage();
  } else if (code === "DUYEN100K") {
    state.activePromoCode = code;
    state.appliedVoucherDiscount = 100000;
    showToast("🎉 Đã áp dụng mã giảm giá 100.000₫ thành công!");
    renderCheckoutPage();
  } else if (code === "DUYEN200K") {
    state.activePromoCode = code;
    state.appliedVoucherDiscount = 200000;
    showToast("🎉 Đã áp dụng mã giảm giá 200.000₫ thành công!");
    renderCheckoutPage();
  } else {
    showToast("⚠️ Mã giảm giá không hợp lệ hoặc đã hết hạn!");
  }
}

function toggleUsePoints(isUse) {
  state.usePointsDiscount = isUse;
  if (isUse && state.user && state.user.points) {
    state.appliedVoucherDiscount = (state.user.points || 0) * 500;
    showToast(`Đã áp dụng ${state.user.points} Điểm Duyên giảm ${formatVND(state.appliedVoucherDiscount)}!`);
  } else {
    state.appliedVoucherDiscount = 0;
  }
  renderCheckoutPage();
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const agreeChk = document.getElementById("chkAgreeContract");
  if (!agreeChk || !agreeChk.checked) {
    showToast("⚠️ BẮT BUỘC: Bạn phải tick đồng ý Hợp đồng thuê trang phục trước khi đặt hàng!");
    if (agreeChk) {
      agreeChk.focus();
      agreeChk.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  const rentTotal = getCartRentTotal();
  const depTotal = getCartDepositTotal();
  const memberDiscount = state.user ? Math.round(rentTotal * 0.05) : 0;
  const voucherDiscount = state.appliedVoucherDiscount || 0;
  const grandTotal = Math.max(0, rentTotal + depTotal - memberDiscount - voucherDiscount);

  // Loyalty Points Earned: 1 point per 10,000 VND of rent
  const earnedPoints = Math.max(10, Math.floor(rentTotal / 10000));

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
    pointsEarned: earnedPoints,
    clickwrapAgreed: true,
    agreedAt: new Date().toISOString(),
    contractCode: "HDDT-" + Math.floor(100000 + Math.random() * 900000),
    status: "Chờ xác nhận & chuẩn bị áo",
    rentalStatus: "Đang giữ đồ (Chờ hoàn cọc)"
  };

  // Credit points to user account
  if (state.user) {
    if (state.usePointsDiscount) {
      state.user.points = 0; // consumed
    }
    state.user.points = (state.user.points || 0) + earnedPoints;
    saveUser();
  }

  state.orders.unshift(order);
  saveOrders();
  state.cart = [];
  state.appliedVoucherDiscount = 0;
  state.usePointsDiscount = false;
  saveCart();

  showToast(`🎉 Đặt lịch thuê thành công! Mã đơn: ${order.id} (+ ${earnedPoints} Điểm Duyên)`);
  location.hash = "#account";
}

/* ==========================================================================
   VIEW 5: CUSTOMER ACCOUNT, ORDERS & LOYALTY REWARDS (#account)
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
            Đăng nhập để theo dõi lịch sử thuê áo dài, tiến độ hoàn cọc và tích lũy Điểm Duyên đổi voucher.
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
            <button type="button" class="btn-secondary" style="width:100%;" onclick="renderRegisterBox()">Tạo tài khoản Hội viên VIP (+100 Điểm)</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const userPoints = state.user.points || 0;

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 80px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #ebebeb;">
        <div>
          <h1 style="font-size:24px;font-weight:700;color:#111;text-transform:uppercase;">TÀI KHOẢN HỘI VIÊN NÉT DUYÊN</h1>
          <p style="font-size:13.5px;color:#555;margin:4px 0 0;">
            Xin chào <strong>${state.user.name}</strong> (${state.user.email}) — <span style="color:#2b8a3e;font-weight:600;">Hội viên VIP (-5% mọi đơn thuê)</span>
          </p>
        </div>
        <button type="button" class="btn-secondary" onclick="handleLogout()">Đăng xuất</button>
      </div>

      <!-- LOYALTY REWARDS CARD (TÍCH ĐIỂM DUYÊN) -->
      <div class="loyalty-card-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:#b8621b;text-transform:uppercase;">VÍ ĐIỂM THƯỞNG NÉT DUYÊN REWARDS</div>
            <div class="loyalty-points-counter">
              <span>✨ ${userPoints}</span>
              <span style="font-size:16px;font-weight:600;color:#555;">Điểm Duyên</span>
            </div>
            <div style="font-size:12.5px;color:#666;margin-top:4px;">
              Tương đương giá trị giảm trừ: <strong style="color:#b8621b;">${formatVND(userPoints * 500)}</strong> (Cứ 10.000₫ tiền thuê tích 1 điểm).
            </div>
          </div>
          <div>
            <button type="button" class="btn-primary" style="padding:10px 18px;font-size:13px;" onclick="location.hash='#collections/all'">
              Thuê thêm tích điểm
            </button>
          </div>
        </div>

        <div style="margin-top:16px;border-top:1px dashed #dec2a6;padding-top:14px;">
          <div style="font-size:13px;font-weight:700;color:#111;margin-bottom:8px;">ĐỔI VOUCHER GIẢM GIÁ 1-CLICK:</div>
          <div class="loyalty-reward-grid">
            <div class="voucher-item-box">
              <div style="font-weight:800;font-size:16px;color:#c92a2a;">VOUCHER 50.000₫</div>
              <div style="font-size:11.5px;color:#666;margin:4px 0 10px;">Cần 100 Điểm Duyên</div>
              <button
                type="button"
                class="btn-secondary"
                style="padding:6px 12px;font-size:11.5px;width:100%;"
                ${userPoints < 100 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                onclick="redeemVoucher(100, 50000, 'DUYEN50K')"
              >
                ${userPoints >= 100 ? 'Đổi voucher ngay' : 'Chưa đủ điểm'}
              </button>
            </div>

            <div class="voucher-item-box">
              <div style="font-weight:800;font-size:16px;color:#c92a2a;">VOUCHER 100.000₫</div>
              <div style="font-size:11.5px;color:#666;margin:4px 0 10px;">Cần 200 Điểm Duyên</div>
              <button
                type="button"
                class="btn-secondary"
                style="padding:6px 12px;font-size:11.5px;width:100%;"
                ${userPoints < 200 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                onclick="redeemVoucher(200, 100000, 'DUYEN100K')"
              >
                ${userPoints >= 200 ? 'Đổi voucher ngay' : 'Chưa đủ điểm'}
              </button>
            </div>

            <div class="voucher-item-box">
              <div style="font-weight:800;font-size:16px;color:#c92a2a;">VOUCHER 200.000₫</div>
              <div style="font-size:11.5px;color:#666;margin:4px 0 10px;">Cần 350 Điểm Duyên</div>
              <button
                type="button"
                class="btn-secondary"
                style="padding:6px 12px;font-size:11.5px;width:100%;"
                ${userPoints < 350 ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}
                onclick="redeemVoucher(350, 200000, 'DUYEN200K')"
              >
                ${userPoints >= 350 ? 'Đổi voucher ngay' : 'Chưa đủ điểm'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <h3 style="font-size:17px;font-weight:700;color:#111;margin-bottom:16px;text-transform:uppercase;">
        Lịch sử thuê áo & Giao kết điện tử (${state.orders.length})
      </h3>
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
              <th>Xác thực HĐ</th>
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
                  <span style="background:#f1f3f5;color:#495057;padding:3px 6px;border-radius:3px;font-size:10.5px;font-weight:700;" title="Đã ký giao kết điện tử">
                    ✓ ${o.contractCode || "ĐÃ KÝ HĐ"}
                  </span>
                </td>
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

function redeemVoucher(cost, discount, code) {
  if (!state.user || (state.user.points || 0) < cost) {
    showToast("⚠️ Bạn chưa đủ Điểm Duyên để đổi mã này!");
    return;
  }
  state.user.points -= cost;
  if (!state.user.vouchers) state.user.vouchers = [];
  state.user.vouchers.push(code);
  saveUser();
  state.activePromoCode = code;
  showToast(`🎉 Đổi thành công mã ${code} (Giảm ${formatVND(discount)})! Mã đã được lưu vào giỏ hàng.`);
  renderAccountView();
}

function renderRegisterBox() {
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="container">
      <div class="auth-box">
        <h2>ĐĂNG KÝ HỘI VIÊN VIP</h2>
        <p style="font-size:13px;color:#2b8a3e;font-weight:600;margin-bottom:16px;text-align:center;">
          🎁 Nhận ngay 100 Điểm Duyên (trị giá 50.000₫) khi đăng ký hôm nay!
        </p>
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
          <button type="submit" class="btn-primary" style="width:100%;margin-bottom:12px;">Đăng ký ngay & Nhận 100 Điểm</button>
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
    phone: "0363860055",
    points: 150,
    vouchers: ["NETDUYEN50"]
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
    email: document.getElementById("regEmail").value.trim(),
    points: 100, // Welcome gift
    vouchers: ["NETDUYEN50"]
  };
  saveUser();
  showToast(`🎉 Đăng ký thành công! Bạn nhận được 100 Điểm Duyên chào mừng!`);
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
   MODALS: SIZE GUIDE, IMAGE ZOOM, CONTRACT MODAL
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

function openContractModal() {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  const backdrop = document.getElementById("ddModalBackdrop");
  if (!box || !content || !backdrop) return;

  box.style.maxWidth = "680px";
  content.innerHTML = `
    <div style="padding:15px;max-height:80vh;overflow-y:auto;font-size:13.5px;line-height:1.7;color:#333;">
      <div style="text-align:center;margin-bottom:18px;border-bottom:1px solid #e0e0e0;padding-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#666;letter-spacing:0.06em;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-size:11px;color:#666;margin-bottom:8px;">Độc lập - Tự do - Hạnh phúc</div>
        <h2 style="font-size:18px;font-weight:800;color:#111;margin:6px 0;">HỢP ĐỒNG CHO THUÊ TRANG PHỤC & BIÊN BẢN ĐẶT CỌC ĐIỆN TỬ</h2>
        <div style="font-size:11.5px;color:#c92a2a;font-weight:600;">Mã hợp đồng: HDDT-NETDUYEN-2026</div>
      </div>

      <p><strong>BÊN CHO THUÊ (BÊN A):</strong> NÉT DUYÊN TRADITIONAL COSTUMES<br/>
      Hotline: 0363 860 055 | Email: contact@netduyen.vn<br/>
      Địa chỉ Showroom: 207 Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội.</p>

      <p><strong>BÊN THUÊ (BÊN B):</strong> Khách hàng đặt đơn thuê trực tuyến trên website <em>netduyen.vercel.app</em> theo thông tin đăng ký tại bước Thanh toán.</p>

      <h4 style="font-size:14px;font-weight:700;color:#111;margin:16px 0 6px;">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & THỜI HẠN THUÊ</h4>
      <p>- Bên A đồng ý cho Bên B thuê trang phục (Áo Dài/Cổ Phục/Phụ kiện) theo danh mục đơn hàng.<br/>
      - Thời hạn thuê tiêu chuẩn: <strong>03 ngày 02 đêm</strong> tính từ ngày nhận trang phục đến ngày giao trả đồ.<br/>
      - Nếu Bên B muốn gia hạn, phụ phí là 50.000₫/ngày (Áo dài đơn) hoặc 100.000₫/ngày (Áo cưới cặp/Cổ phục).</p>

      <h4 style="font-size:14px;font-weight:700;color:#111;margin:16px 0 6px;">ĐIỀU 2: TIỀN ĐẶT CỌC & CAM KẾT HOÀN TRẢ 100%</h4>
      <p>- Khoản tiền đặt cọc tương ứng với từng sản phẩm được ghi nhận trên hệ thống và tách bạch trong hóa đơn thanh toán.<br/>
      - <strong>Cam kết hoàn cọc 100%:</strong> Bên A cam kết hoàn trả đầy đủ 100% khoản cọc vào tài khoản ngân hàng của Bên B trong vòng <strong>02 giờ làm việc</strong> kể từ khi nhận lại trang phục nguyên vẹn.</p>

      <h4 style="font-size:14px;font-weight:700;color:#111;margin:16px 0 6px;">ĐIỀU 3: TRÁCH NHIỆM BẢO QUẢN & GIẶT HẤP</h4>
      <p>- 100% chi phí giặt hấp diệt khuẩn và ủi phẳng chuẩn studio do Bên A tài trợ.<br/>
      - Bên B <strong>tuyệt đối không tự ý giặt bằng máy giặt gia đình hoặc sử dụng chất tẩy mạnh</strong>.<br/>
      - Trường hợp rách nát, cháy xém hoặc ố màu không thể phục hồi, Bên B chịu phí khắc phục theo giá trị may mới.</p>

      <h4 style="font-size:14px;font-weight:700;color:#111;margin:16px 0 6px;">ĐIỀU 4: HIỆU LỰC GIAO KẾT ĐIỆN TỬ</h4>
      <p>- Hợp đồng này được xác lập bằng phương thức điện tử tuân thủ Luật Giao dịch điện tử số 20/2023/QH15 và Nghị định 52/2013/NĐ-CP.<br/>
      - Thao tác tick chọn <em>"Tôi đã đọc, hiểu và đồng ý"</em> của Bên B có giá trị pháp lý ràng buộc tương đương chữ ký tay.</p>

      <div style="text-align:center;margin-top:20px;padding-top:14px;border-top:1px solid #e0e0e0;">
        <button type="button" class="btn-primary" style="padding:12px 28px;font-weight:700;" onclick="acceptContractFromModal()">
          ✓ TÔI ĐÃ HIỂU VÀ ĐỒNG Ý KÝ KẾT ĐIỆN TỬ
        </button>
      </div>
    </div>
  `;
  backdrop.classList.add("open");
}

function acceptContractFromModal() {
  const chk = document.getElementById("chkAgreeContract");
  if (chk) {
    chk.checked = true;
    handleClickwrapChange();
  }
  closeDdModal();
  showToast("✓ Đã xác thực Chữ ký điện tử cho Hợp đồng thuê trang phục!");
}

function closeDdModal() {
  const backdrop = document.getElementById("ddModalBackdrop");
  if (backdrop) backdrop.classList.remove("open");
}
const closeDDModal = closeDdModal;

/* ==========================================================================
   WELCOME PROMO POPUP & FLOATING GIFT
   ========================================================================== */
function openPromoPopup() {
  const popup = document.getElementById("promoPopupBackdrop");
  if (popup) popup.classList.add("open");
}

function closePromoPopup(dontShowAgain = false) {
  const popup = document.getElementById("promoPopupBackdrop");
  if (popup) popup.classList.remove("open");
  if (dontShowAgain) {
    sessionStorage.setItem(STORAGE_KEYS.PROMO_SEEN, "true");
  }
}

function copyPromoCode(code) {
  navigator.clipboard.writeText(code).catch(() => {});
  state.activePromoCode = code;
  state.appliedVoucherDiscount = 50000;
  showToast(`🎉 Đã sao chép mã ${code}! Đã tự động áp dụng giảm 50.000₫ tại giỏ hàng.`);
}

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
    // Trigger welcome promo popup once per session after 1.2s
    if (!sessionStorage.getItem(STORAGE_KEYS.PROMO_SEEN)) {
      setTimeout(() => {
        if (location.hash === "#home" || location.hash === "#/" || !location.hash) {
          openPromoPopup();
        }
      }, 1200);
    }
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

/* ==========================================================================
   FLOATING PROMO PILL & SMART AUTO-HIDE SCROLL
   ========================================================================== */
function dismissFloatingGift(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const wrap = document.getElementById("promoFloatingWrap");
  if (wrap) {
    wrap.classList.add("hidden");
    setTimeout(() => {
      wrap.style.display = "none";
    }, 250);
  }
  localStorage.setItem("netduyen_hide_promo_pill", "true");
  showToast("Đã ẩn nút ưu đãi hôm nay.");
}

function initHeaderAndPillState() {
  if (localStorage.getItem("netduyen_hide_promo_pill") === "true") {
    const wrap = document.getElementById("promoFloatingWrap");
    if (wrap) wrap.style.display = "none";
  }
}

if (typeof window !== "undefined") {
  window.dismissFloatingGift = dismissFloatingGift;
  window.initHeaderAndPillState = initHeaderAndPillState;
}

let lastScrollY = typeof window !== "undefined" ? (window.scrollY || 0) : 0;
let scrollTicking = false;

window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const currentScrollY = window.scrollY || 0;
      const hdr = document.getElementById("page-header");
      const topbar = document.getElementById("shopify-section-top-bar");

      if (hdr) {
        hdr.classList.toggle("is-sticky", currentScrollY > 40);

        // Smart auto-hide:
        // Scrolling down past 70px -> slide header up out of view for max dress browsing space
        if (currentScrollY > 70 && currentScrollY - lastScrollY > 5) {
          hdr.classList.add("header-hidden");
          if (topbar) topbar.classList.add("topbar-hidden");
        }
        // Scrolling up -> slide header smoothly back into view
        else if (lastScrollY - currentScrollY > 5 || currentScrollY <= 40) {
          hdr.classList.remove("header-hidden");
          if (currentScrollY <= 40 && topbar) {
            topbar.classList.remove("topbar-hidden");
          }
        }
      }

      lastScrollY = Math.max(0, currentScrollY);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
  initHeaderAndPillState();
  updateCartUI();
  updateAuthTopbar();
  handleRoute();
});
