/* ==========================================================================
   NÉT DUYÊN — GIỮ NÉT VIỆT, TRỌN NÉT DUYÊN (app.js)
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

let state = {
  cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || "[]"),
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || "null"),
  orders: JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]"),
  collectionSlug: "ao-dai",
  sortBy: "created-descending",
  viewMode: 4,
  currentPage: 1,
  perPage: 24,
  searchQuery: "",
  pdpSelectedOptions: {},
  pdpQty: 1
};

const SORT_LABELS = {
  "manual": "Nổi bật",
  "most-relevant": "Phù hợp nhất",
  "best-selling": "Bán chạy nhất",
  "title-ascending": "Thứ tự bảng chữ cái (từ A-Z)",
  "title-descending": "Thứ tự bảng chữ cái (từ Z-A)",
  "price-ascending": "Giá (từ thấp đến cao)",
  "price-descending": "Giá (từ cao xuống thấp)",
  "created-ascending": "Ngày (từ cũ đến mới)",
  "created-descending": "Ngày (từ mới đến cũ)"
};

// Format VND exactly like dingdangvietnam.com: 2.950.000₫
function formatVND(amount) {
  const n = Math.round(Number(amount) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
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
   CART & MINICART DRAWER
   ========================================================================== */
function getCartTotalCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function addToCart(productId, variantId, qty = 1, openDrawer = true) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const variant = (variantId && product.variants.find(v => String(v.id) === String(variantId))) || product.variants[0];
  const price = variant ? variant.price : product.price;
  const variantTitle = variant ? variant.title : "S";
  const key = `${product.id}_${variant ? variant.id : "default"}`;

  const existing = state.cart.find(item => item.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      key,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      image: product.images[0],
      variantId: variant ? variant.id : product.id,
      variantTitle,
      sku: variant ? variant.sku : "",
      price,
      qty
    });
  }
  saveCart();
  if (openDrawer) {
    openMinicart();
  } else {
    showToast(`Đã thêm "${product.title}" vào giỏ hàng!`);
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
      <div class="cart-empty">
        <svg width="62" height="69" viewBox="0 0 62 69" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M2.08737 28.4645L2.73622 31.7945C2.84185 32.3366 2.48803 32.8616 1.94594 32.9673C1.40385 33.0729 0.878769 32.7191 0.773143 32.177L0.124283 28.847C-0.665369 24.7938 2.40693 21 6.52744 21H55.4733C59.5451 21 62.6061 24.7104 61.898 28.7297L55.7575 63.5715C55.2054 66.7055 52.5032 69 49.3328 69H13.9327C10.8871 69 8.25497 66.8784 7.57386 63.8981L6.61662 59.71C6.49356 59.1716 6.83027 58.6354 7.36867 58.5123C7.90707 58.3893 8.44328 58.726 8.56634 59.2644L9.52358 63.4524C9.99963 65.5355 11.8324 67 13.9327 67H49.3328C51.5189 67 53.4017 65.416 53.7878 63.2245L59.9283 28.3827C60.4248 25.565 58.2786 23 55.4733 23H6.52744C3.68849 23 1.53379 25.623 2.08737 28.4645Z" fill="#DEDEDE"/>
          <path d="M28.9027 2.47902C29.391 1.74918 29.1972 0.760308 28.4699 0.27033C27.7425 -0.219647 26.7571 -0.0251418 26.2688 0.704705L9.76598 25.3734C9.2777 26.1032 9.47153 27.0921 10.1988 27.5821C10.9262 28.072 11.9116 27.8775 12.3999 27.1477L28.9027 2.47902Z" fill="#DEDEDE"/>
          <path d="M49.6341 26.9818C50.3923 27.422 51.3625 27.162 51.8014 26.401C52.2397 25.6401 51.9806 24.6664 51.2224 24.2262L31.0853 12.5365C30.327 12.0963 29.3567 12.3563 28.9181 13.1173C28.4794 13.8781 28.7385 14.8518 29.4967 15.292L49.6341 26.9818Z" fill="#DEDEDE"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M31.0099 46.9028C30.7467 46.9639 30.423 47.2225 30.2155 47.4984C29.7609 48.1028 28.9649 48.1704 28.4376 47.6495C27.9102 47.1285 27.8512 46.2162 28.3058 45.6118C28.7285 45.0498 29.5089 44.3029 30.5098 44.0707C31.0378 43.9482 31.6328 43.9702 32.2308 44.2541C32.8242 44.5358 33.335 45.0345 33.7603 45.7078C34.1687 46.354 34.0425 47.2573 33.4786 47.7253C32.9147 48.1933 32.1266 48.0487 31.7183 47.4024C31.5084 47.0702 31.3454 46.9614 31.266 46.9237C31.1911 46.8882 31.114 46.8787 31.0099 46.9028Z" fill="#DEDEDE"/>
          <path d="M22.5 42C23.3284 42 24 41.3284 24 40.5C24 39.6716 23.3284 39 22.5 39C21.6716 39 21 39.6716 21 40.5C21 41.3284 21.6716 42 22.5 42Z" fill="#DEDEDE"/>
          <path d="M39.5 42C40.3287 42 41 41.3284 41 40.5C41 39.6716 40.3287 39 39.5 39C38.6713 39 38 39.6716 38 40.5C38 41.3284 38.6713 42 39.5 42Z" fill="#DEDEDE"/>
        </svg>
        <span class="empty-des">Giỏ hàng của bạn đang trống.</span>
        <p>Bạn có thể xem tất cả các sản phẩm có sẵn và mua một số sản phẩm tại cửa hàng.</p>
        <div style="margin-top:26px;">
          <button type="button" class="btn-primary" onclick="closeMinicart(); location.hash='#collections/ao-dai'">
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    `;
    return;
  }

  body.innerHTML = state.cart.map(item => `
    <div class="minicart-item">
      <a href="#products/${item.handle}" onclick="closeMinicart()" class="minicart-item-img">
        <img src="${item.image}" alt="${item.title}" loading="lazy" />
      </a>
      <div class="minicart-item-info">
        <a href="#products/${item.handle}" onclick="closeMinicart()" class="minicart-item-title">${item.title}</a>
        <div class="minicart-item-variant">Phân loại: <strong style="color:#111;">${item.variantTitle}</strong></div>
        <div class="minicart-item-price">${formatVND(item.price)}</div>
        <div class="minicart-qty-row">
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

  footer.style.display = "block";
  footer.innerHTML = `
    <div class="minicart-subtotal-row">
      <span>Tổng phụ:</span>
      <span>${formatVND(getCartSubtotal())}</span>
    </div>
    <div class="minicart-footer-btns">
      <button type="button" class="btn-secondary" style="width:100%;" onclick="closeMinicart(); location.hash='#cart'">Xem giỏ hàng</button>
      <button type="button" class="btn-primary" style="width:100%;" onclick="closeMinicart(); location.hash='#checkout'">Thanh toán</button>
    </div>
  `;
}

function openMinicart() {
  updateCartUI();
  document.getElementById("minicartBackdrop").classList.add("open");
  document.getElementById("minicartDrawer").classList.add("open");
}

function closeMinicart() {
  document.getElementById("minicartBackdrop").classList.remove("open");
  document.getElementById("minicartDrawer").classList.remove("open");
}

/* ==========================================================================
   TOP CANVAS SEARCH POPUP
   ========================================================================== */
function openSearchPopup() {
  document.getElementById("searchBackdrop").classList.add("open");
  document.getElementById("searchPopup").classList.add("open");
  setTimeout(() => {
    const inp = document.getElementById("predictiveSearchInput");
    if (inp) inp.focus();
  }, 150);
  handlePredictiveSearch(document.getElementById("predictiveSearchInput")?.value || "");
}

function closeSearchPopup() {
  document.getElementById("searchBackdrop").classList.remove("open");
  document.getElementById("searchPopup").classList.remove("open");
}

function triggerQuickSearch(term) {
  const inp = document.getElementById("predictiveSearchInput");
  if (inp) {
    inp.value = term;
    handlePredictiveSearch(term);
  }
}

function handlePredictiveSearch(query) {
  const container = document.getElementById("predictiveSearchResults");
  if (!container) return;
  const q = (query || "").trim().toLowerCase();

  const matches = q
    ? NETDUYEN_PRODUCTS.filter(p => p.title.toLowerCase().includes(q) || (p.product_type && p.product_type.toLowerCase().includes(q)))
    : NETDUYEN_PRODUCTS.slice(0, 5);

  const displayList = matches.slice(0, 5);
  if (displayList.length === 0) {
    container.innerHTML = `<p style="text-align:center;margin-top:24px;color:#555;">Không tìm thấy sản phẩm phù hợp với "${query}".</p>`;
    return;
  }

  container.innerHTML = `
    <div style="max-width:1100px;margin:24px auto 0;">
      <div style="font-size:13px;font-weight:500;color:#111;margin-bottom:14px;text-transform:uppercase;">
        ${q ? `Kết quả tìm kiếm (${matches.length})` : "Sản phẩm phổ biến"}
      </div>
      <div class="predictive-search-results-grid">
        ${displayList.map(p => renderProductCardHTML(p, true)).join("")}
      </div>
    </div>
  `;
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const q = document.getElementById("predictiveSearchInput")?.value || "";
  state.searchQuery = q.trim();
  closeSearchPopup();
  location.hash = `#search/${encodeURIComponent(state.searchQuery)}`;
}

/* ==========================================================================
   PRODUCT CARD COMPONENT (Exact dingdangvietnam.com markup & behavior)
   ========================================================================== */
function renderProductCardHTML(product, isCompact = false) {
  const img1 = product.images[0] || "";
  const img2 = product.images[1] || img1;
  const v0 = product.variants[0] || { id: product.id, price: product.price, compare_at_price: product.compare_at_price };
  const price = v0.price || product.price;
  const compare = v0.compare_at_price || product.compare_at_price;
  const isOnSale = compare && compare > price;
  const saveAmount = isOnSale ? compare - price : 0;

  return `
    <div class="bls__grid__item">
      <div class="bls__product-item" data-product-handle="${product.handle}">
        <div class="bls__product-img">
          ${isOnSale ? `<div class="bls__product-label"><span class="bls__sale-label">Sale off</span></div>` : ""}
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
              onclick="addToCart('${product.id}', '${v0.id}', 1, true)"
              aria-label="Thêm vào giỏ hàng"
            >
              <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.5454 11.3287C10.3922 11.3287 10.2452 11.2672 10.1369 11.1576C10.0285 11.048 9.96763 10.8994 9.96763 10.7444H8.81201C8.81201 11.2093 8.99464 11.6552 9.31972 11.984C9.6448 12.3128 10.0857 12.4975 10.5454 12.4975C11.0052 12.4975 11.4461 12.3128 11.7711 11.984C12.0962 11.6552 12.2789 11.2093 12.2789 10.7444H11.1232C11.1232 10.8994 11.0624 11.048 10.954 11.1576C10.8456 11.2672 10.6987 11.3287 10.5454 11.3287Z" fill="#111" />
                <path d="M6.47907 11.3287C6.32583 11.3287 6.17886 11.2672 6.0705 11.1576C5.96214 11.048 5.90127 10.8994 5.90127 10.7444H4.74023C4.74023 10.9749 4.78514 11.2032 4.87238 11.4162C4.95962 11.6292 5.08748 11.8228 5.24868 11.9858C5.40988 12.1488 5.60125 12.2782 5.81186 12.3664C6.02248 12.4546 6.24822 12.5 6.47618 12.5C6.70415 12.5 6.92989 12.4546 7.1405 12.3664C7.35112 12.2782 7.54249 12.1488 7.70368 11.9858C7.86488 11.8228 7.99275 11.6292 8.07999 11.4162C8.16723 11.2032 8.21213 10.9749 8.21213 10.7444H7.05652C7.05652 10.8993 6.99569 11.0479 6.88741 11.1575C6.77913 11.267 6.63225 11.3286 6.47907 11.3287Z" fill="#111" />
                <path d="M14.0173 1.66048C13.9858 1.65506 13.9539 1.65237 13.9219 1.65244H4.67702C4.52377 1.65244 4.37681 1.71401 4.26845 1.8236C4.16009 1.93319 4.09921 2.08182 4.09921 2.23681C4.09921 2.39179 4.16009 2.54042 4.26845 2.65001C4.37681 2.7596 4.52377 2.82117 4.67702 2.82117H13.2398L13.087 3.74811L12.277 8.66477H4.73949L2.77495 3.74811L1.60308 0.840914C1.54111 0.70415 1.42937 0.596826 1.29113 0.541284C1.15289 0.485742 0.998786 0.486261 0.860911 0.542733C0.723035 0.599206 0.612007 0.70728 0.550938 0.844458C0.489868 0.981637 0.483464 1.13735 0.533058 1.27918L2.40407 5.9223L3.68102 9.34519C3.77528 9.63335 3.96993 9.83349 4.25088 9.83349H12.7663C12.9031 9.83356 13.0355 9.78452 13.14 9.6951C13.2444 9.60568 13.314 9.48168 13.3365 9.34519L14.2589 3.74811L14.4921 2.33286C14.5173 2.18001 14.4814 2.02331 14.3924 1.89722C14.3033 1.77113 14.1684 1.68598 14.0173 1.66048Z" fill="#111" />
              </svg>
              <span>Thêm vào giỏ hàng</span>
            </button>
          </div>
        </div>
        <div class="bls__product-details">
          ${product.isOriginal && !isCompact ? `
            <div class="product-card-tags">
              <span>NÉT DUYÊN ORIGINAL</span>
            </div>
          ` : ""}
          <h3 class="bls__product-name">
            <a href="#products/${product.handle}" onclick="closeSearchPopup()">${product.title}</a>
          </h3>
          <div class="bls__product-price">
            ${isOnSale ? `
              <span class="special-price">${formatVND(price)}</span>
              <span class="compare-price">${formatVND(compare)}</span>
            ` : `
              <span>${formatVND(price)}</span>
            `}
          </div>
          ${isOnSale && !isCompact ? `<div class="price__save">Tiết kiệm ${formatVND(saveAmount)}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 1: COLLECTION PAGE (/collections/ao-dai & other collections)
   ========================================================================== */
function getFilteredAndSortedProducts(slug) {
  let list = slug === "all"
    ? [...NETDUYEN_PRODUCTS]
    : NETDUYEN_PRODUCTS.filter(p => p.collections && p.collections.includes(slug));

  if (list.length === 0) {
    list = [...NETDUYEN_PRODUCTS];
  }

  switch (state.sortBy) {
    case "title-ascending":
      list.sort((a, b) => a.title.localeCompare(b.title, "vi"));
      break;
    case "title-descending":
      list.sort((a, b) => b.title.localeCompare(a.title, "vi"));
      break;
    case "price-ascending":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-descending":
      list.sort((a, b) => b.price - a.price);
      break;
    case "created-ascending":
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case "best-selling":
    case "most-relevant":
    case "manual":
    case "created-descending":
    default:
      break;
  }
  return list;
}

function renderCollectionView(slug) {
  state.collectionSlug = slug || "ao-dai";
  const colMeta = NETDUYEN_COLLECTIONS[state.collectionSlug] || { title: state.collectionSlug.toUpperCase(), desc: "" };
  document.title = `${colMeta.title} – NÉT DUYÊN | Giữ nét Việt, trọn nét duyên.`;

  const allItems = getFilteredAndSortedProducts(state.collectionSlug);
  const totalPages = Math.max(1, Math.ceil(allItems.length / state.perPage));
  if (state.currentPage > totalPages) state.currentPage = 1;

  const startIdx = (state.currentPage - 1) * state.perPage;
  const pageItems = allItems.slice(startIdx, startIdx + state.perPage);

  // Build pagination numbers
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
        <a class="pagination__item" onclick="changeCollectionPage(${state.currentPage + 1})">Trang tiếp theo</a>
      </li>
    `;
  }

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
          </div>

          <div class="toolbar-sorter">
            <h4 class="facet-filters__label">
              <label>Sắp xếp theo:</label>
            </h4>
            <div class="select-custom" id="sortDropdownBox">
              <div class="select-selected" onclick="toggleSortDropdown(event)">
                <span>${SORT_LABELS[state.sortBy] || "Ngày (từ mới đến cũ)"}</span>
                <span style="font-size:10px;">▼</span>
              </div>
              <ul class="select__select">
                ${Object.entries(SORT_LABELS).map(([val, label]) => `
                  <li class="${state.sortBy === val ? "selected" : ""}" onclick="selectSortOption('${val}')">${label}</li>
                `).join("")}
              </ul>
            </div>
          </div>
        </div>

        <!-- Grid -->
        <div id="bls__product-grid" class="bls__grid" data-view-mode="${state.viewMode}">
          ${pageItems.map(p => renderProductCardHTML(p)).join("")}
        </div>

        <!-- Pagination -->
        ${totalPages > 1 ? `
          <div class="pagination-wrapper">
            <nav class="pagination" role="navigation" aria-label="Phân trang">
              <ul class="pagination__list">
                ${pageButtons}
              </ul>
            </nav>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

function toggleSortDropdown(e) {
  e.stopPropagation();
  const box = document.getElementById("sortDropdownBox");
  if (box) box.classList.toggle("open");
}

function selectSortOption(val) {
  state.sortBy = val;
  state.currentPage = 1;
  renderCollectionView(state.collectionSlug);
}

function setGridViewMode(mode) {
  state.viewMode = mode;
  const grid = document.getElementById("bls__product-grid");
  if (grid) grid.setAttribute("data-view-mode", String(mode));
  document.querySelectorAll(".grid-mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.length === mode);
  });
}

function changeCollectionPage(page) {
  state.currentPage = page;
  renderCollectionView(state.collectionSlug);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ==========================================================================
   VIEW 2: HOMEPAGE (#home — Exact replica of dingdangvietnam.com/)
   ========================================================================== */
function renderHomeView() {
  document.title = "NÉT DUYÊN – Giữ nét Việt, trọn nét duyên.";
  const hotItems = NETDUYEN_PRODUCTS.slice(0, 8);
  const specialDeals = NETDUYEN_PRODUCTS.filter(p => p.collections.includes("special-deals")).slice(0, 8);

  const museImages = [
    "https://dingdangvietnam.com/cdn/shop/files/1789725324926_2068560641793806717_2068560641793806717_f11991394279088b902607028da9f4dd.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725646338_2068560641793806717_2068560641793806717_adb99abec3d1ddbe14cffe8523f270b7.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725722201_2068560641793806717_2068560641793806717_3bca7be426fb84c327c6bb0c30d94bc3.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725487483_2068560641793806717_2068560641793806717_b7560d56d854ef0ab7569c054894a21a.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725399847_2068560641793806717_2068560641793806717_5a587c293e224de8f06c5826bf70ac23.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725569214_2068560641793806717_2068560641793806717_85ae82f353d553e51d0392e1fd08f98d.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725854901_2068560641793806717_2068560641793806717_81a017b527168b9eb750bfb7f42e5224.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725930167_2068560641793806717_2068560641793806717_ee38a508e3ccd264ed8bd387dd704306.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725535253_2068560641793806717_2068560641793806717_c38fede1986f2767d19b8a8ce980d7ff.jpg?v=1789726461&width=533",
    "https://dingdangvietnam.com/cdn/shop/files/1789725578443_2068560641793806717_2068560641793806717_ae405c13fc29c6434357b5e1cf0912f6.jpg?v=1789726461&width=533"
  ];

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <!-- 1. Hero Banner -->
    <div class="hero-slideshow" onclick="location.hash='#collections/ao-dai'">
      <img src="https://dingdangvietnam.com/cdn/shop/files/banner_web_1.jpg?v=1790934586&width=2400" alt="NÉT DUYÊN – Giữ nét Việt, trọn nét duyên." />
      <div class="hero-banner-floating-badge">
        <span class="badge-brand">NÉT DUYÊN</span>
        <span class="badge-slogan">Giữ nét Việt, trọn nét duyên.</span>
      </div>
    </div>

    <!-- 2. YOUR NEXT FAVOURITE -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">YOUR NEXT FAVOURITE</h2>
          <p class="bls__section-des">You might’ve just found it</p>
        </div>
        <div class="collection-list-grid">
          <div class="collection-card" onclick="location.hash='#collections/ao-dai'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792233848184_2307592614049898190_2307592614049898190_38c62ffd47c69d192158ed5b3c2f6223.jpg?v=1792234193&width=900" alt="ÁO DÀI" />
            <span class="collection-card-label">ÁO DÀI</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/dam-1'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792234058267_2307592614049898190_2307592614049898190_9cb678f1afa7d278387aa08d37f9b28b.jpg?v=1792234194&width=900" alt="ĐẦM" />
            <span class="collection-card-label">ĐẦM</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/ao-1'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792233927725_2307592614049898190_2307592614049898190_f475d106da5ecec29094a456e167bdad.jpg?v=1792234194&width=900" alt="ÁO" />
            <span class="collection-card-label">ÁO</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/quan'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792233995144_2307592614049898190_2307592614049898190_0c38667f3c4bd3d14996a9995d4302bb.jpg?v=1792234193&width=900" alt="QUẦN" />
            <span class="collection-card-label">QUẦN</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Dual Banner: FOR A LITTLE MOMENT / FOR EVERYDAY -->
    <section class="bls__section" style="padding-top:10px;">
      <div class="container-fluid">
        <div class="dual-banner-grid">
          <div class="editorial-banner-item" onclick="location.hash='#collections/ao-dai'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792233332721_2307592614049898190_2307592614049898190_b2e14dd148b494a70c29e764820001c2.jpg?v=1792233508&width=900" alt="NÉT DUYÊN FOR A LITTLE MOMENT" />
            <div class="editorial-banner-overlay">
              <h3>NÉT DUYÊN FOR A LITTLE MOMENT</h3>
              <p>When you feel a little extra</p>
              <span class="btn-banner">Khám phá ngay</span>
            </div>
          </div>
          <div class="editorial-banner-item" onclick="location.hash='#collections/ao-1'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/DD_ATELIER0362_copy_5_e9693423-997b-42f8-808e-02b0cbc8c8f3.jpg?v=1789648384&width=900" alt="NÉT DUYÊN FOR EVERYDAY" />
            <div class="editorial-banner-overlay">
              <h3>NÉT DUYÊN FOR EVERYDAY</h3>
              <p>Made to be worn your way</p>
              <span class="btn-banner">Khám phá ngay</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. HOT ITEMS -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">HOT ITEMS</h2>
        </div>
        <div class="bls__grid">
          ${hotItems.map(p => renderProductCardHTML(p)).join("")}
        </div>
        <div style="text-align:center;margin-top:34px;">
          <a href="#collections/ao-dai" class="btn-secondary">Xem tất cả</a>
        </div>
      </div>
    </section>

    <!-- 5. Scrolling Marquee (LIMITED-TIME OFFER) -->
    <div class="scrolling-marquee">
      <div class="scrolling-marquee-track">
        <span>LIMITED-TIME OFFER</span><span>•</span>
        <span>SPECIAL DEALS</span><span>•</span>
        <span>UP TO 50% OFF</span><span>•</span>
        <span>LIMITED-TIME OFFER</span><span>•</span>
        <span>SPECIAL DEALS</span><span>•</span>
        <span>UP TO 50% OFF</span><span>•</span>
        <span>LIMITED-TIME OFFER</span><span>•</span>
        <span>SPECIAL DEALS</span><span>•</span>
        <span>UP TO 50% OFF</span><span>•</span>
        <span>LIMITED-TIME OFFER</span><span>•</span>
        <span>SPECIAL DEALS</span><span>•</span>
        <span>UP TO 50% OFF</span>
      </div>
    </div>

    <!-- 6. SPECIAL DEALS -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">SPECIAL DEALS</h2>
          <p class="bls__section-des">(Ưu đãi độc quyền trên website)</p>
        </div>
        <div class="bls__grid">
          ${specialDeals.map(p => renderProductCardHTML(p)).join("")}
        </div>
        <div style="text-align:center;margin-top:34px;">
          <a href="#collections/special-deals" class="btn-secondary">Xem tất cả ưu đãi</a>
        </div>
      </div>
    </section>

    <!-- 7. Dual Banner: FOR A DATE / FOR A SPECIAL DAY -->
    <section class="bls__section" style="padding-top:10px;">
      <div class="container-fluid">
        <div class="dual-banner-grid">
          <div class="editorial-banner-item" onclick="location.hash='#collections/dam-1'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/DINGDANG_AODAI_0107264238_copy_2_6a98c871-40cc-46d3-a186-dbf0cd96c3f7.jpg?v=1789648384&width=900" alt="NÉT DUYÊN FOR A DATE" />
            <div class="editorial-banner-overlay">
              <h3>NÉT DUYÊN FOR A DATE</h3>
              <p>Something soft for the two of you</p>
              <span class="btn-banner">Khám phá ngay</span>
            </div>
          </div>
          <div class="editorial-banner-item" onclick="location.hash='#collections/dong-dao'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1792234510320_2307592614049898190_2307592614049898190_436e973ff7d1e936e85328a1e42d7e79.jpg?v=1792235299&width=900" alt="NÉT DUYÊN FOR A SPECIAL DAY" />
            <div class="editorial-banner-overlay">
              <h3>NÉT DUYÊN FOR A SPECIAL DAY</h3>
              <p>Go all out and make it memorable</p>
              <span class="btn-banner">Khám phá ngay</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. GIFTS TO DISCOVER -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">GIFTS TO DISCOVER</h2>
          <p class="bls__section-des">Thoughtful pieces for every occasion</p>
        </div>
        <div class="collection-list-grid">
          <div class="collection-card" onclick="location.hash='#collections/gifts'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/haichau2_8e93c2ec-75fd-4592-9647-c9b6b29bcf1a.webp?v=1789725583&width=900" alt="HOME DECOR" />
            <span class="collection-card-label">HOME DECOR</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/accessories'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/DINGDANG03092597032copy3_446be2ab-e2dc-48bf-9508-80bb1538c0fa.webp?v=1789725609&width=900" alt="KHĂN VÀ TÚI" />
            <span class="collection-card-label">KHĂN VÀ TÚI</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/gifts'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/1789733619115_451162515835105214_451162515835105214_b2c9656f4f2102d5cdc769e44e5b1ab0.jpg?v=1789733699&width=900" alt="SOUVENIRS" />
            <span class="collection-card-label">SOUVENIRS</span>
          </div>
          <div class="collection-card" onclick="location.hash='#collections/gifts'">
            <img src="https://dingdangvietnam.com/cdn/shop/files/DINGDANGDEC73723copy.webp?v=1789725583&width=900" alt="GIFTS" />
            <span class="collection-card-label">GIFT SET</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. MUSE OF NÉT DUYÊN -->
    <section class="bls__section">
      <div class="container-fluid">
        <div class="bls__section-header">
          <h2 class="bls__section-heading">MUSE OF NÉT DUYÊN</h2>
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
   VIEW 3: PRODUCT DETAIL PAGE (#products/:handle)
   ========================================================================== */
function renderProductDetailView(handle) {
  const idx = NETDUYEN_PRODUCTS.findIndex(p => p.handle === handle || String(p.id) === String(handle));
  const product = idx !== -1 ? NETDUYEN_PRODUCTS[idx] : NETDUYEN_PRODUCTS[0];
  if (!product) return;

  document.title = `${product.title} – NÉT DUYÊN`;
  state.pdpQty = 1;
  state.pdpSelectedOptions = {};
  (product.options || []).forEach((opt, i) => {
    state.pdpSelectedOptions[i] = opt.values[0] || "S";
  });

  const prevProd = NETDUYEN_PRODUCTS[(idx - 1 + NETDUYEN_PRODUCTS.length) % NETDUYEN_PRODUCTS.length];
  const nextProd = NETDUYEN_PRODUCTS[(idx + 1) % NETDUYEN_PRODUCTS.length];
  const related = NETDUYEN_PRODUCTS.filter(p => p.id !== product.id && p.collections.some(c => product.collections.includes(c))).slice(0, 4);

  const selectedVariant = getMatchingVariant(product);
  const price = selectedVariant ? selectedVariant.price : product.price;
  const compare = selectedVariant ? selectedVariant.compare_at_price : product.compare_at_price;

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="container-fluid">
      <!-- Breadcrumb & Prev/Next Product Navigation -->
      <div class="pdp-breadcrumb-bar">
        <ol class="bls__breadcrumb-list">
          <li class="bls__breadcrumb-item">
            <a class="bls__breadcrumb-link" href="#home">Trang chủ</a>
            <span style="padding:0 4px;">/</span>
          </li>
          <li class="bls__breadcrumb-item">
            <a class="bls__breadcrumb-link" href="#collections/ao-dai">ÁO DÀI</a>
            <span style="padding:0 4px;">/</span>
          </li>
          <li class="bls__breadcrumb-item">
            <span class="bls__breadcrumb-link">${product.title}</span>
          </li>
        </ol>

        <div class="pdp-next-prev">
          <a href="#products/${prevProd.handle}" title="Sản phẩm trước: ${prevProd.title}" style="font-size:16px;padding:4px;">‹</a>
          <a href="#collections/ao-dai" title="Quay lại danh sách sản phẩm" style="display:inline-flex;align-items:center;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.8019 7.43638H10.7669C9.27167 7.43638 8.54639 6.76644 8.54639 5.40422V2.03217C8.54639 0.669945 9.27167 0 10.7669 0H13.7684C15.2636 0 15.9889 0.669945 15.9889 2.03217V5.41539C15.9889 6.07416 15.8215 6.56546 15.4756 6.90043C15.1074 7.2689 14.5718 7.43638 13.8019 7.43638Z" fill="#111111"/>
              <path d="M13.7794 16.0003H10.7779C9.28266 16.0003 8.55737 15.2745 8.55737 13.7783V10.7747C8.55737 9.27851 9.28266 8.55273 10.7779 8.55273H13.7794C15.2746 8.55273 15.9999 9.27851 15.9999 10.7747V13.7783C15.9999 15.2745 15.2746 16.0003 13.7794 16.0003Z" fill="#111111"/>
              <path d="M5.25478 7.43638H2.21975C0.72455 7.43638 -0.000732422 6.76644 -0.000732422 5.40422V2.03217C-0.000732422 0.669945 0.72455 0 2.21975 0H5.2213C6.7165 0 7.44179 0.669945 7.44179 2.03217V5.41539C7.44179 6.07416 7.27441 6.56546 6.92851 6.90043C6.56029 7.2689 6.0247 7.43638 5.25478 7.43638Z" fill="#111111"/>
              <path d="M5.2213 16.0003H2.21975C0.72455 16.0003 -0.000732422 15.2745 -0.000732422 13.7783V10.7747C-0.000732422 9.27851 0.72455 8.55273 2.21975 8.55273H5.2213C6.7165 8.55273 7.44179 9.27851 7.44179 10.7747V13.7783C7.44179 15.2745 6.7165 16.0003 5.2213 16.0003Z" fill="#111111"/>
            </svg>
          </a>
          <a href="#products/${nextProd.handle}" title="Sản phẩm tiếp: ${nextProd.title}" style="font-size:16px;padding:4px;">›</a>
        </div>
      </div>

      <!-- Main 2-Column Layout (65% Gallery / 35% Sticky Info) -->
      <div class="pdp-main-layout">
        <!-- Left 2-Column Vertical Gallery -->
        <div class="pdp-left-gallery">
          ${product.images.map((imgUrl, i) => `
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
                <div style="font-weight:700;">Ưu đãi Hội viên NÉT DUYÊN đã kích hoạt</div>
                <div style="font-size:12px;">Tài khoản ${state.user.name} được giảm thêm 5% khi thanh toán.</div>
              </div>
            </div>
          ` : `
            <div class="member-price-status">
              <span>🔒</span>
              <div>
                <div class="member-price-title">Ưu đãi dành riêng cho Hội viên</div>
                <div style="font-size:12px;color:#495057;">Đăng nhập tài khoản hội viên NÉT DUYÊN để nhận mức giá ưu đãi đặc quyền.</div>
                <a href="#account" class="member-login-button">Đăng nhập ngay</a>
              </div>
            </div>
          `}

          <div class="pdp-price-wrap" id="pdpPriceDisplay">
            ${compare && compare > price ? `
              <span style="color:#c92a2a;font-weight:600;">${formatVND(price)}</span>
              <span style="color:#888;text-decoration:line-through;font-size:14px;">${formatVND(compare)}</span>
            ` : `
              <span>${formatVND(price)}</span>
            `}
          </div>

          <!-- Variant Swatches -->
          <div id="pdpSwatchesContainer">
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

          <!-- Addons: Size Guide (CM) & Styling Guide -->
          <div class="bls__product-addons">
            <span class="bls__product_addons-btn" onclick="openSizeGuideModal()">
              <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
                <path d="M9.11538 0.5C4.96154 0.5 0.346154 3.26923 0 9.5C0 11.9231 0.923077 14.2308 2.65385 15.8462C4.38462 17.5769 6.69231 18.5 9 18.5C11.4231 18.5 13.7308 17.5769 15.3462 15.8462C17.0769 14.1154 18 11.8077 18 9.38461C17.8846 3.26923 13.2692 0.5 9.11538 0.5Z" stroke="#555555" stroke-width="1.3"/>
              </svg>
              <span>Hướng dẫn kích thước</span>
            </span>

            <a class="bls__product_addons-btn" href="https://cdn.shopify.com/s/files/1/0604/1947/3475/files/hdanPhi_n_Van.pdf?v=1790138049" target="_blank" rel="noopener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M20 20H4l8-7 8 7Z"/><path d="M12 13V5"/><path d="M9 5h6"/>
              </svg>
              <span>Hướng Dẫn Cách Phối</span>
            </a>
          </div>

          <!-- Quantity + Add to Cart -->
          <div class="pdp-cart-row">
            <div class="pdp-qty-input">
              <button type="button" onclick="changePdpQty(-1)">−</button>
              <input type="number" id="pdpQtyField" value="1" min="1" readonly />
              <button type="button" onclick="changePdpQty(1)">+</button>
            </div>
            <button type="button" class="add-cart-button" onclick="handlePdpAddToCart('${product.id}', false)">
              Thêm vào giỏ hàng
            </button>
          </div>

          <button type="button" class="buy-now-button" onclick="handlePdpAddToCart('${product.id}', true)">
            Mua ngay
          </button>

          <!-- Accordion Information Tabs (Exact dingdangvietnam.com tabs) -->
          <div class="pdp-accordions">
            <div class="pdp-accordion-item active">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Ưu đãi của bạn</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                <ul style="list-style:disc;padding-left:18px;">
                  <li><strong>“Dư Sắc” – Độc quyền Website</strong> | <a href="#collections/du-sac" style="text-decoration:underline;">Xem tại đây</a></li>
                  <li><strong>Online Exclusive – Áo sơ mi giá từ 890K</strong> | <a href="#collections/ao-1" style="text-decoration:underline;">Xem tại đây</a></li>
                  <li><strong>Up to 50% for Selected Items</strong> | <a href="#collections/special-deals" style="text-decoration:underline;">Xem tại đây</a></li>
                </ul>
              </div>
            </div>

            <div class="pdp-accordion-item active">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Mô tả</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                ${product.body_html}
              </div>
            </div>

            <div class="pdp-accordion-item">
              <button type="button" class="pdp-accordion-header" onclick="this.parentElement.classList.toggle('active')">
                <span>Chăm sóc</span>
                <span>+</span>
              </button>
              <div class="pdp-accordion-body">
                <p>- Chỉ giặt tay nhẹ nhàng hoặc giặt khô; không giặt máy<br/>
                - Chỉ dùng bàn ủi hơi nước; tránh để nhiệt trực tiếp lên bề mặt vải<br/>
                - Treo ở nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Recommendations: NÉT DUYÊN GỢI Ý CHO BẠN -->
      <section class="bls__section" style="padding-top:10px;">
        <div class="bls__section-header">
          <h2 class="bls__section-heading" style="font-size:22px;">NÉT DUYÊN GỢI Ý CHO BẠN</h2>
        </div>
        <div class="bls__grid">
          ${related.map(p => renderProductCardHTML(p)).join("")}
        </div>
      </section>
    </div>

    <!-- Sticky Bottom Add-to-Cart Bar (#bls__sticky-addcart) -->
    <div id="bls__sticky-addcart" class="bls__sticky-addcart">
      <div class="container sticky-addcart-inner">
        <div class="sticky-addcart-product">
          <div class="sticky-addcart-img">
            <img src="${product.images[0]}" alt="${product.title}" />
          </div>
          <div>
            <div style="font-weight:500;color:#111111;font-size:14px;">${product.title}</div>
            <div style="font-size:13px;color:#111111;font-weight:500;" id="stickyBarPrice">${formatVND(price)}</div>
          </div>
        </div>
        <div class="sticky-addcart-controls">
          <select id="stickyVariantSelect" class="sticky-addcart-select" onchange="handleStickyVariantChange('${product.id}', this.value)">
            ${product.variants.map(v => `
              <option value="${v.id}" ${selectedVariant && String(selectedVariant.id) === String(v.id) ? "selected" : ""}>
                ${v.title} - ${formatVND(v.price)}
              </option>
            `).join("")}
          </select>
          <button type="button" class="btn-primary" onclick="handlePdpAddToCart('${product.id}', false)">
            Thêm vào giỏ hàng
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

  // Re-render swatches & price
  const variant = getMatchingVariant(product);
  const price = variant ? variant.price : product.price;
  const compare = variant ? variant.compare_at_price : product.compare_at_price;

  const priceEl = document.getElementById("pdpPriceDisplay");
  if (priceEl) {
    priceEl.innerHTML = compare && compare > price
      ? `<span style="color:#c92a2a;font-weight:600;">${formatVND(price)}</span> <span style="color:#888;text-decoration:line-through;font-size:14px;">${formatVND(compare)}</span>`
      : `<span>${formatVND(price)}</span>`;
  }

  const stickyPriceEl = document.getElementById("stickyBarPrice");
  if (stickyPriceEl) stickyPriceEl.textContent = formatVND(price);

  const stickySel = document.getElementById("stickyVariantSelect");
  if (stickySel && variant) stickySel.value = String(variant.id);

  // Update active class on swatches
  const container = document.getElementById("pdpSwatchesContainer");
  if (container) {
    container.innerHTML = (product.options || []).map((opt, idx) => `
      <div class="pdp-swatch-group">
        <div class="swatch-label-row">
          <span>${opt.name}:</span>
          <strong>${state.pdpSelectedOptions[idx]}</strong>
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

function handleStickyVariantChange(productId, variantId) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;
  const v = product.variants.find(item => String(item.id) === String(variantId));
  if (!v) return;
  if (v.option1) state.pdpSelectedOptions[0] = v.option1;
  if (v.option2) state.pdpSelectedOptions[1] = v.option2;
  selectPdpOption(productId, 0, state.pdpSelectedOptions[0]);
}

function changePdpQty(delta) {
  state.pdpQty = Math.max(1, (state.pdpQty || 1) + delta);
  const f = document.getElementById("pdpQtyField");
  if (f) f.value = state.pdpQty;
}

function handlePdpAddToCart(productId, buyNow = false) {
  const product = NETDUYEN_PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;
  const variant = getMatchingVariant(product);
  addToCart(product.id, variant ? variant.id : null, state.pdpQty || 1, !buyNow);
  if (buyNow) {
    location.hash = "#checkout";
  }
}

/* ==========================================================================
   MODALS: SIZE GUIDE (CM) & IMAGE ZOOM
   ========================================================================== */
function openSizeGuideModal() {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  box.style.maxWidth = "480px";
  content.innerHTML = `
    <div class="sg-page">
      <h2 class="sg-title">Size guide(CM)</h2>
      <div class="sg-table-wrap">
        <table class="sg-table">
          <thead>
            <tr>
              <th></th>
              <th>XS</th>
              <th>S</th>
              <th>M</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Rộng ngực</th>
              <td>80</td>
              <td>84</td>
              <td>88</td>
              <td>92</td>
            </tr>
            <tr>
              <th>Vòng eo</th>
              <td>62</td>
              <td>66</td>
              <td>70</td>
              <td>74</td>
            </tr>
            <tr>
              <th>Rộng hông</th>
              <td>86</td>
              <td>90</td>
              <td>94</td>
              <td>98</td>
            </tr>
          </tbody>
        </table>
      </div>
      <img class="sg-image" src="https://cdn.shopify.com/s/files/1/0581/0110/4753/files/measuring-guide.png?v=1717163155" alt="Measuring guide" />
    </div>
  `;
  document.getElementById("ddModalBackdrop").classList.add("open");
}

function openImageZoomModal(imgUrl, title) {
  const box = document.getElementById("ddModalBox");
  const content = document.getElementById("ddModalContent");
  box.style.maxWidth = "720px";
  content.innerHTML = `
    <img src="${imgUrl}" alt="${title}" style="width:100%;height:auto;border-radius:6px;" />
  `;
  document.getElementById("ddModalBackdrop").classList.add("open");
}

function closeDdModal() {
  document.getElementById("ddModalBackdrop").classList.remove("open");
}

/* ==========================================================================
   VIEW 4: FULL CART PAGE (#cart) & CHECKOUT PAGE (#checkout)
   ========================================================================== */
function renderCartPage() {
  document.title = "Giỏ hàng của bạn – NÉT DUYÊN";
  const main = document.getElementById("MainContent");

  if (state.cart.length === 0) {
    main.innerHTML = `
      <div class="container" style="padding:70px 15px;text-align:center;">
        <h1 style="font-size:28px;font-weight:500;color:#111;margin-bottom:14px;">GIỎ HÀNG CỦA BẠN</h1>
        <p style="margin-bottom:26px;">Giỏ hàng của bạn đang trống.</p>
        <a href="#collections/ao-dai" class="btn-primary">Quay lại cửa hàng</a>
      </div>
    `;
    return;
  }

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 70px;">
      <div class="page-heading" style="padding-top:0;">
        <h1 class="heading-title">GIỎ HÀNG</h1>
      </div>
      <table class="cart-page-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Tổng</th>
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
                    <a href="#products/${item.handle}" style="font-weight:500;color:#111;text-transform:uppercase;">${item.title}</a>
                    <div style="font-size:12px;color:#666;margin-top:4px;">Size / Phân loại: ${item.variantTitle}</div>
                  </div>
                </div>
              </td>
              <td style="font-weight:500;color:#111;">${formatVND(item.price)}</td>
              <td>
                <div class="minicart-qty-box">
                  <button type="button" onclick="updateCartQty('${item.key}', -1)">−</button>
                  <span>${item.qty}</span>
                  <button type="button" onclick="updateCartQty('${item.key}', 1)">+</button>
                </div>
              </td>
              <td style="font-weight:500;color:#111;">${formatVND(item.price * item.qty)}</td>
              <td>
                <button class="btn-reset" onclick="removeCartItem('${item.key}')" style="color:#888;text-decoration:underline;font-size:12px;">Xóa</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;">
        <div style="width:360px;max-width:100%;border:1px solid #ebebeb;padding:24px;">
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:500;color:#111;margin-bottom:12px;">
            <span>Tổng phụ:</span>
            <span>${formatVND(getCartSubtotal())}</span>
          </div>
          <p style="font-size:12px;color:#666;margin-bottom:20px;">Thuế và phí vận chuyển được tính khi thanh toán.</p>
          <button type="button" class="btn-primary" style="width:100%;" onclick="location.hash='#checkout'">Thanh toán ngay</button>
        </div>
      </div>
    </div>
  `;
}

function renderCheckoutPage() {
  document.title = "Thanh toán – NÉT DUYÊN";
  const main = document.getElementById("MainContent");
  if (state.cart.length === 0) {
    location.hash = "#collections/ao-dai";
    return;
  }

  const subtotal = getCartSubtotal();
  const memberDiscount = state.user ? Math.round(subtotal * 0.05) : 0;
  const finalTotal = subtotal - memberDiscount;

  main.innerHTML = `
    <div class="container" style="padding:40px 15px 80px;">
      <div class="page-heading" style="padding-top:0;">
        <h1 class="heading-title">THANH TOÁN ĐƠN HÀNG</h1>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:40px;align-items:flex-start;">
        <form onsubmit="handleCheckoutSubmit(event)" style="border:1px solid #ebebeb;padding:28px;">
          <h3 style="font-size:16px;font-weight:500;color:#111;margin-bottom:18px;text-transform:uppercase;">Thông tin giao hàng</h3>
          <div class="form-group">
            <label>Họ và tên *</label>
            <input type="text" id="chkName" class="form-input" required value="${state.user ? state.user.name : ""}" placeholder="Nhập họ và tên người nhận" />
          </div>
          <div class="form-group">
            <label>Số điện thoại *</label>
            <input type="tel" id="chkPhone" class="form-input" required value="${state.user ? state.user.phone || "" : ""}" placeholder="Số điện thoại liên hệ" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="chkEmail" class="form-input" value="${state.user ? state.user.email : ""}" placeholder="Email nhận thông báo đơn hàng" />
          </div>
          <div class="form-group">
            <label>Địa chỉ nhận hàng chi tiết *</label>
            <input type="text" id="chkAddress" class="form-input" required placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" />
          </div>
          <div class="form-group">
            <label>Phương thức thanh toán</label>
            <select id="chkPayment" class="form-input">
              <option value="COD">Thanh toán khi nhận hàng (COD)</option>
              <option value="BANK">Chuyển khoản Ngân hàng (VietQR)</option>
            </select>
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-top:10px;">Hoàn tất đơn hàng (${formatVND(finalTotal)})</button>
        </form>

        <div style="border:1px solid #ebebeb;padding:28px;background:#fafafa;">
          <h3 style="font-size:16px;font-weight:500;color:#111;margin-bottom:18px;text-transform:uppercase;">Tóm tắt đơn hàng (${getCartTotalCount()})</h3>
          ${state.cart.map(item => `
            <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #ebebeb;font-size:13px;">
              <div>
                <div style="color:#111;font-weight:500;">${item.title} × ${item.qty}</div>
                <div style="color:#666;font-size:12px;">Phân loại: ${item.variantTitle}</div>
              </div>
              <div style="color:#111;font-weight:500;">${formatVND(item.price * item.qty)}</div>
            </div>
          `).join("")}
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
            <span>Tạm tính:</span>
            <span>${formatVND(subtotal)}</span>
          </div>
          ${memberDiscount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#008a00;">
              <span>Ưu đãi Hội viên VIP (-5%):</span>
              <span>−${formatVND(memberDiscount)}</span>
            </div>
          ` : ""}
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
            <span>Phí vận chuyển:</span>
            <span>Miễn phí</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #dedede;font-size:17px;font-weight:600;color:#111;">
            <span>Tổng cộng:</span>
            <span>${formatVND(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  const subtotal = getCartSubtotal();
  const memberDiscount = state.user ? Math.round(subtotal * 0.05) : 0;
  const order = {
    id: "DD-" + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString("vi-VN"),
    customerName: document.getElementById("chkName").value,
    phone: document.getElementById("chkPhone").value,
    address: document.getElementById("chkAddress").value,
    payment: document.getElementById("chkPayment").value,
    items: [...state.cart],
    total: subtotal - memberDiscount,
    status: "Đang xử lý"
  };
  state.orders.unshift(order);
  saveOrders();
  state.cart = [];
  saveCart();
  showToast(`Đặt hàng thành công! Mã đơn: ${order.id}`);
  location.hash = "#account";
}

/* ==========================================================================
   VIEW 5: CUSTOMER ACCOUNT & LOGIN / REGISTER (#account)
   ========================================================================== */
function renderAccountView() {
  document.title = "Tài khoản – NÉT DUYÊN";
  const main = document.getElementById("MainContent");

  if (!state.user) {
    main.innerHTML = `
      <div class="container">
        <div class="auth-box">
          <h2>ĐĂNG NHẬP</h2>
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
            <p style="font-size:13px;margin-bottom:12px;">Khách hàng mới? Đăng ký tài khoản Hội viên để hưởng ưu đãi riêng.</p>
            <button type="button" class="btn-secondary" style="width:100%;" onclick="renderRegisterBox()">Tạo tài khoản mới</button>
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
          <h1 style="font-size:26px;font-weight:500;color:#111;text-transform:uppercase;">TÀI KHOẢN CỦA TÔI</h1>
          <p style="font-size:14px;color:#555;">Xin chào <strong>${state.user.name}</strong> (${state.user.email}) — <span style="color:#008a00;font-weight:500;">Hội viên VIP (-5% mọi đơn hàng)</span></p>
        </div>
        <button type="button" class="btn-secondary" onclick="handleLogout()">Đăng xuất</button>
      </div>

      <h3 style="font-size:18px;font-weight:500;color:#111;margin-bottom:16px;text-transform:uppercase;">Lịch sử đơn hàng (${state.orders.length})</h3>
      ${state.orders.length === 0 ? `
        <p style="padding:24px;border:1px solid #ebebeb;color:#555;">Bạn chưa có đơn hàng nào. <a href="#collections/ao-dai" style="text-decoration:underline;font-weight:500;">Khám phá Bộ sưu tập Áo Dài ngay</a>.</p>
      ` : `
        <table class="cart-page-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Sản phẩm</th>
              <th>Thanh toán</th>
              <th>Tổng cộng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${state.orders.map(o => `
              <tr>
                <td style="font-weight:600;color:#111;">${o.id}</td>
                <td>${o.date}</td>
                <td>${o.items.map(i => `${i.title} (${i.variantTitle}) ×${i.qty}`).join("<br/>")}</td>
                <td>${o.payment}</td>
                <td style="font-weight:600;color:#111;">${formatVND(o.total)}</td>
                <td><span style="background:#ebfbee;color:#2b8a3e;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:500;">${o.status}</span></td>
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
        <h2>ĐĂNG KÝ TÀI KHOẢN</h2>
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
            <input type="email" id="regEmail" class="form-input" required placeholder="Địa chỉ email" />
          </div>
          <div class="form-group">
            <label>Mật khẩu *</label>
            <input type="password" id="regPass" class="form-input" required placeholder="Tối thiểu 6 ký tự" />
          </div>
          <button type="submit" class="btn-primary" style="width:100%;margin-bottom:12px;">Đăng ký</button>
          <button type="button" class="btn-secondary" style="width:100%;" onclick="renderAccountView()">Quay lại Đăng nhập</button>
        </form>
      </div>
    </div>
  `;
}

function handleAuthLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  state.user = {
    name: email.split("@")[0].toUpperCase(),
    email,
    phone: "0363860055"
  };
  saveUser();
  showToast("Đăng nhập thành công!");
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
  showToast("Cảm ơn bạn đã đăng ký hội viên NÉT DUYÊN!");
  renderAccountView();
}

function handleLogout() {
  state.user = null;
  saveUser();
  showToast("Đã đăng xuất tài khoản.");
  renderAccountView();
}

/* ==========================================================================
   VIEW 6: SEARCH RESULTS (#search/:query), BLOGS (#blogs), POLICIES (#pages/:slug)
   ========================================================================== */
function renderSearchView(query) {
  const q = decodeURIComponent(query || "").trim();
  document.title = `Tìm kiếm: "${q}" – NÉT DUYÊN`;
  const results = NETDUYEN_PRODUCTS.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));

  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">KẾT QUẢ TÌM KIẾM CHO "${q.toUpperCase()}" (${results.length})</h1>
      </div>
    </div>
    <div class="container-fluid" style="padding-bottom:60px;">
      ${results.length === 0 ? `
        <p style="text-align:center;padding:40px 0;">Không tìm thấy sản phẩm nào khớp với từ khóa "${q}".</p>
      ` : `
        <div class="bls__grid">
          ${results.map(p => renderProductCardHTML(p)).join("")}
        </div>
      `}
    </div>
  `;
}

function renderBlogsView() {
  document.title = "BLOG – NÉT DUYÊN";
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">NEWS & STORIES</h1>
        <nav class="breadcrumbs">
          <ol class="bls__breadcrumb-list">
            <li class="bls__breadcrumb-item"><a href="#home">Trang chủ</a> /</li>
            <li class="bls__breadcrumb-item"><span>Blog</span></li>
          </ol>
        </nav>
      </div>
    </div>
    <div class="container" style="padding-bottom:70px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;">
        ${NETDUYEN_BLOGS.map(b => `
          <div style="border:1px solid #ebebeb;border-radius:8px;overflow:hidden;">
            <div style="aspect-ratio:4/3;overflow:hidden;">
              <img src="${b.image}" alt="${b.title}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="padding:20px;">
              <div style="font-size:12px;color:#888;margin-bottom:6px;">${b.date} • ${b.author}</div>
              <h3 style="font-size:15px;font-weight:500;color:#111;margin-bottom:10px;line-height:1.4;">${b.title}</h3>
              <p style="font-size:13px;color:#555;margin-bottom:14px;">${b.excerpt}</p>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderPolicyView(slug) {
  const pol = NETDUYEN_POLICIES[slug] || NETDUYEN_POLICIES["privacy-policy"];
  document.title = `${pol.title} – NÉT DUYÊN`;
  const main = document.getElementById("MainContent");
  main.innerHTML = `
    <div class="page-heading">
      <div class="container">
        <h1 class="heading-title">${pol.title}</h1>
      </div>
    </div>
    <div class="container" style="max-width:820px;padding-bottom:80px;font-size:14px;line-height:1.8;color:#333;">
      ${pol.content}
    </div>
  `;
}

/* ==========================================================================
   OMEGA MESSENGER CHAT
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
        Cảm ơn bạn đã nhắn tin cho NÉT DUYÊN! Chuyên viên tư vấn sẽ phản hồi ngay hoặc bạn có thể liên hệ Hotline <strong>0363 860 055</strong> (Giữ nét Việt, trọn nét duyên).
      </div>
    `;
    msgBox.scrollTop = msgBox.scrollHeight;
  }, 500);
}

/* ==========================================================================
   ROUTER & INITIALIZATION
   ========================================================================== */
function handleRoute() {
  const hash = location.hash || "#collections/ao-dai";
  window.scrollTo({ top: 0, behavior: "instant" });

  if (hash === "#home" || hash === "#/") {
    renderHomeView();
  } else if (hash.startsWith("#collections/")) {
    const slug = hash.replace("#collections/", "").split("?")[0] || "ao-dai";
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
    renderCollectionView("ao-dai");
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
