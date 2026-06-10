// ===== CONFIG =====
let WHATSAPP_NUMBER = "970566707278";

let BANK_INFO = {
  islamic_account:  "2065173",
  islamic_iban:     "PS53PIBC083120651730033132000",
  islamic_name:     "يارا حاتم جواد مهدي",
  palestine_wallet: "0597479675",
  palestine_name:   "يارا حاتم جواد مهدي",
  pal_bank_account: "XXXX-XXXX-XXXX-XXXX",
  pal_bank_iban:    "PS92XXXXXXXXXXXXXXXXXXXX",
  pal_bank_name:    "يارا"
};

const DEFAULT_STORE_CATEGORIES = ['فساتين محجب', 'فساتين قصيرة', 'بلايز قصيرة', 'عبايات', 'أحذية'];

const _PROD_CACHE_KEY = 'yara_products_v1';
const _PROD_CACHE_TTL = 15 * 60 * 1000;
const _PROD_BATCH     = 20;

// ===== STATE =====
let state = {
  products: [],
  cart: [],
  wishlist: [],
  currentProduct: null,
  currentCategory: "الكل",
  checkoutStep: 1,
  customerInfo: null,
  selectedPayment: null,
  categories: ['الكل', ...DEFAULT_STORE_CATEGORIES],
  paymentVisibility: {
    islamic: true,
    palestine: true,
    palBank: true
  },
  catImages: {},
  collections: [],
  activeCollection: null
};

// ===== INIT =====
const _SPINNER_HTML = `<style>@keyframes _yspin{to{transform:rotate(360deg)}}</style>
<div style="grid-column:1/-1;text-align:center;padding:80px 20px">
  <div style="width:44px;height:44px;border:4px solid #f0d8e5;border-top-color:#B5547A;border-radius:50%;animation:_yspin .8s linear infinite;margin:0 auto 16px"></div>
  <div style="color:#aaa;font-size:14px">جاري تحميل المنتجات...</div>
</div>`;

async function init() {
  loadCart();
  loadWishlist();
  updateCartBadge();

  const grid = document.getElementById("products-grid");
  if (grid) grid.innerHTML = _SPINNER_HTML;

  await Promise.all([loadProducts(), loadBankInfo()]);

  if (state.productsLoadError) {
    if (grid) grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
        <div style="font-size:38px;margin-bottom:12px">📡</div>
        <div style="font-size:16px;font-weight:700;color:#333;margin-bottom:8px">تعذّر تحميل المنتجات</div>
        <div style="font-size:13px;color:#999;margin-bottom:20px">يرجى التحقق من الاتصال بالإنترنت ثم حاولي مجدداً</div>
        <button onclick="location.reload()" style="background:#B5547A;color:white;border:none;padding:12px 28px;border-radius:8px;font-family:'Cairo',sans-serif;font-size:14px;cursor:pointer;font-weight:700">إعادة المحاولة</button>
      </div>`;
    return;
  }

  renderProducts();
}

function _readProdCache() {
  try {
    const r = localStorage.getItem(_PROD_CACHE_KEY);
    if (!r) return null;
    const { d, t } = JSON.parse(r);
    return (Date.now() - t < _PROD_CACHE_TTL) ? d : null;
  } catch { return null; }
}

function _writeProdCache(products) {
  try { localStorage.setItem(_PROD_CACHE_KEY, JSON.stringify({ d: products, t: Date.now() })); } catch {}
}

function loadProducts() {
  return new Promise(resolve => {
    const cached = _readProdCache();
    if (cached) {
      state.products = cached;
      resolve();
    }

    let resolved = !!cached;
    const fail = setTimeout(() => {
      if (!resolved) { resolved = true; state.productsLoadError = true; resolve(); }
    }, 20000);

    db.collection('products').onSnapshot(
      snap => {
        if (!resolved && snap.metadata.fromCache && snap.docs.length === 0) return;
        clearTimeout(fail);
        const products = snap.docs.map(d => d.data());
        state.products = products;
        _writeProdCache(products);
        if (!resolved) { resolved = true; resolve(); }
        else { renderProducts(); renderCollectionBanner(); }
      },
      err => {
        clearTimeout(fail);
        console.error(err);
        if (!resolved) {
          if (!state.products.length) state.productsLoadError = true;
          resolved = true;
          resolve();
        }
      }
    );
  });
}

function loadCart() {
  const stored = localStorage.getItem("yara_cart");
  if (stored) state.cart = JSON.parse(stored);
}

function saveCart() {
  localStorage.setItem("yara_cart", JSON.stringify(state.cart));
}

function loadWishlist() {
  const stored = localStorage.getItem("yara_wishlist");
  if (stored) state.wishlist = JSON.parse(stored);
}

function saveWishlist() {
  localStorage.setItem("yara_wishlist", JSON.stringify(state.wishlist));
}

async function loadBankInfo() {
  try {
    const docSnap = await db.collection('settings').doc('main').get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data.whatsapp) WHATSAPP_NUMBER = data.whatsapp;
      Object.assign(BANK_INFO, data);

      if (Array.isArray(data.categories) && data.categories.length) {
        const categories = Array.from(new Set(data.categories.filter(cat => cat && cat.trim() && cat !== 'الكل').map(cat => cat.trim())));
        state.categories = ['الكل', ...categories];
      }

      if (data.paymentVisibility) {
        state.paymentVisibility = { ...state.paymentVisibility, ...data.paymentVisibility };
      }

      if (data.catImages) {
        state.catImages = { ...data.catImages };
      }

      if (Array.isArray(data.collections)) {
        state.collections = data.collections;
      }
    }
  } catch (e) {
    console.error('خطأ في تحميل الإعدادات:', e);
  }

  renderCategoryNavigation();
  renderCollectionBanner();
  renderFooterCategoryLinks();
  renderPaymentMethods();

  const ia      = document.getElementById("islamic-account");
  const iiban   = document.getElementById("islamic-iban");
  const iname   = document.getElementById("islamic-name");
  const pw      = document.getElementById("palestine-wallet");
  const pname   = document.getElementById("palestine-name");
  const pa      = document.getElementById("palestine-account");
  const piban   = document.getElementById("palestine-iban");
  const pbname  = document.getElementById("pal-bank-name");
  if (ia)     ia.textContent     = BANK_INFO.islamic_account;
  if (iiban)  iiban.textContent  = BANK_INFO.islamic_iban    || "PS53PIBC083120651730033132000";
  if (iname)  iname.textContent  = BANK_INFO.islamic_name    || "يارا حاتم جواد مهدي";
  if (pw)     pw.textContent     = BANK_INFO.palestine_wallet;
  if (pname)  pname.textContent  = BANK_INFO.palestine_name  || "يارا";
  if (pa)     pa.textContent     = BANK_INFO.pal_bank_account || "XXXX-XXXX-XXXX";
  if (piban)  piban.textContent  = BANK_INFO.pal_bank_iban   || "PS92XXXXXXXXXXXXXXXXXXXX";
  if (pbname) pbname.textContent = BANK_INFO.pal_bank_name   || "يارا";

  const footerWA = document.getElementById('footer-whatsapp');
  if (footerWA) footerWA.textContent = '+' + WHATSAPP_NUMBER;
  const footerWALink = document.getElementById('footer-wa-link');
  if (footerWALink) footerWALink.href = `https://wa.me/${WHATSAPP_NUMBER}`;
}

function renderCategoryNavigation() {
  const nav = document.getElementById('category-nav');
  if (!nav) return;
  nav.innerHTML = state.categories.map(cat => {
    const image = state.catImages[cat];
    const circleContent = image
      ? `<img src="${image}" alt="${cat}">`
      : `<span class="cat-fallback">${cat === 'الكل' ? '✨' : '🛍️'}</span>`;

    return `<button class="cat-card${cat === state.currentCategory ? ' active' : ''}" data-cat="${cat}" onclick="renderProducts('${cat}')">
      <div class="cat-circle" data-cat="${cat}">${circleContent}</div>
      <span class="cat-label">${cat}</span>
    </button>`;
  }).join('');
}

function renderFooterCategoryLinks() {
  const container = document.getElementById('footer-cats-links');
  if (!container) return;
  container.innerHTML = state.categories.slice(1).map(cat =>
    `<a href="#" onclick="renderProducts('${cat}'); scrollToProducts(); return false;">${cat}</a>`
  ).join('');
}

function renderPaymentMethods() {
  const container = document.getElementById('payment-methods-container');
  if (!container) return;

  const methods = [
    {
      id: 'islamic',
      key: 'islamic',
      title: 'البنك الإسلامي الفلسطيني',
      styleClass: 'pay-islamic',
      logo: 'image/islamicBankLogo.png',
      logoAlt: 'شعار البنك الإسلامي الفلسطيني',
      detailLines: [
        { label: 'رقم الحساب:', value: BANK_INFO.islamic_account || '2065173' },
        { label: 'IBAN:', value: BANK_INFO.islamic_iban || 'PS53PIBC083120651730033132000' },
        { label: 'اسم الحساب:', value: BANK_INFO.islamic_name || 'يارا حاتم جواد مهدي' }
      ]
    },
    {
      id: 'palestine',
      key: 'palestine',
      title: 'محفظة بال بي',
      styleClass: 'pay-mahfaza',
      logo: 'image/mahfazaLogo.png',
      logoAlt: 'شعار محفظة فلسطين',
      detailLines: [
        { label: 'الرقم:', value: BANK_INFO.palestine_wallet || '0597479675' },
        { label: 'اسم المحفظة:', value: BANK_INFO.palestine_name || 'يارا حاتم جواد مهدي' }
      ]
    },
    {
      id: 'pal-bank',
      key: 'palBank',
      title: 'تحويل بنك فلسطين',
      styleClass: 'pay-pal-bank',
      logo: 'image/bankLogo.png',
      logoAlt: 'شعار بنك فلسطين',
      detailLines: [
        { label: 'رقم الحساب:', value: BANK_INFO.pal_bank_account || 'XXXX-XXXX-XXXX' },
        { label: 'IBAN:', value: BANK_INFO.pal_bank_iban || 'PS92XXXXXXXXXXXXXXXXXXXX' },
        { label: 'اسم الحساب:', value: BANK_INFO.pal_bank_name || 'يارا' }
      ]
    }
  ];

  const visible = methods.filter(method => state.paymentVisibility[method.key]);
  if (!visible.length) {
    container.innerHTML = '<div class="payment-empty">لا توجد طرق دفع مفعلة حالياً. يرجى اختيار طريقة دفع أخرى أو التواصل مع الإدارة.</div>';
    return;
  }

  container.innerHTML = visible.map(method => `
    <div class="pay-method ${method.styleClass}" id="pm-${method.id}" data-method="${method.id}" onclick="selectPayment('${method.id}')">
      <div class="pay-method-header">
        <div class="pay-header-main">
          ${method.logo ? `<img src="${method.logo}" class="pay-logo-img" alt="${method.logoAlt}">` : ''}
          <span class="pay-name">${method.title}</span>
        </div>
        <div class="pay-radio"><div class="pay-radio-dot"></div></div>
      </div>
      <div class="pay-details-wrap">
        ${method.detailLines.map((line, idx) => `
          <div class="pay-detail">
            <span class="pay-lbl">${line.label}</span>
            <span class="pay-val" id="${method.id}-${idx}">${line.value}</span>
            <button type="button" class="copy-btn" onclick="event.stopPropagation(); copyText('${method.id}-${idx}')">نسخ</button>
          </div>
        `).join('')}
      </div>
    </div>`).join('');

  if (state.selectedPayment && !state.paymentVisibility[state.selectedPayment]) {
    state.selectedPayment = null;
  }
  if (state.selectedPayment) selectPayment(state.selectedPayment);
}

// ===== RENDER PRODUCTS =====
function isProductVisible(p) {
  if (!p.publishAt) return true;
  const now = new Date();
  const publish = new Date(p.publishAt);
  return publish <= now;
}

function renderProducts(filter) {
  if (filter !== undefined) {
    state.currentCategory = filter;
    state.activeCollection = null;
  }
  const cat = state.currentCategory;
  renderCategoryNavigation();

  let filtered = (cat === "الكل"
    ? state.products
    : state.products.filter(p => p.category === cat)
  ).filter(isProductVisible)
   .sort((a, b) => b.id - a.id);

  if (state.activeCollection) {
    filtered = filtered.filter(p => p.collectionName === state.activeCollection);
  }

  const grid  = document.getElementById("products-grid");
  const label = document.getElementById("products-label");

  if (label) {
    const count = filtered.length;
    if (state.activeCollection) {
      label.innerHTML = `كولكشن: ${state.activeCollection} (${count}) <button class="collection-clear-btn" onclick="clearCollectionFilter()">✕ عرض الكل</button>`;
    } else {
      label.textContent = cat === "الكل" ? `جميع المنتجات (${count})` : `${cat} (${count})`;
    }
  }

  if (filtered.length === 0) {
    const msg = state.products.length === 0
      ? '<p>لا يوجد منتجات بعد — ترقّبي وصول المجموعة الجديدة قريباً </p>'
      : '<p>لا يوجد منتجات في هذه الفئة حالياً</p><small>جربي فئة أخرى أو عودي لاحقاً</small>';
    grid.innerHTML = `<div class="no-products"><div class="no-icon">🔍</div>${msg}</div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => productCardHTML(p, i)).join("");
}

// ===== COLLECTION BANNER =====
function renderCollectionBanner() {
  const banner = document.getElementById('collection-banner');
  if (!banner) return;

  const active = (state.collections || [])
    .filter(c => c.showBanner)
    .sort((a, b) => new Date(b.releaseAt) - new Date(a.releaseAt))[0];

  if (!active) { banner.style.display = 'none'; return; }
  banner.style.display = '';

  if (banner._interval) clearInterval(banner._interval);

  function tick() {
    const diff = new Date(active.releaseAt) - new Date();
    if (diff > 0) {
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const timeStr = [h > 0 ? `${h}س` : '', `${m}د`, `${s}ث`].filter(Boolean).join(' ');
      banner.innerHTML = `
        <div class="collection-banner-inner">
          <span class="banner-sparkle">✨</span>
          <span>كولكشن <strong>${active.name}</strong> تصل خلال:</span>
          <span class="banner-timer">${timeStr}</span>
        </div>`;
    } else {
      clearInterval(banner._interval);
      banner._interval = null;
      const safeName = active.name.replace(/'/g, "\\'");
      banner.innerHTML = `
        <div class="collection-banner-inner released">
          <span class="banner-sparkle">🎉</span>
          <span>وصلت كولكشن <strong>${active.name}</strong> الآن!</span>
          <button class="banner-view-btn" onclick="filterByCollection('${safeName}')">استعرضي الكولكشن ←</button>
        </div>`;
    }
  }

  tick();
  banner._interval = setInterval(tick, 1000);
}

function filterByCollection(name) {
  state.activeCollection = name;
  state.currentCategory  = 'الكل';
  renderProducts();
  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
}

function clearCollectionFilter() {
  state.activeCollection = null;
  renderProducts();
}

function productCardHTML(p, idx) {
  const wished   = state.wishlist.includes(p.id);
  const hasDis   = p.originalPrice > p.price && p.originalPrice > 0;
  const disc     = hasDis ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  const isOut    = p.inStock === false;
  const stars    = "★".repeat(Math.min(5, Math.round(p.rating || 5)));
  const id       = p.id;

  const allImgs    = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
  const hasMultiple = allImgs.length > 1;
  const manualLabel   = p.label ? String(p.label).trim() : '';
  const labelClass    = manualLabel === 'جديد'
    ? 'new'
    : (manualLabel === 'عرض خاص' ? 'special' : 'custom');
  const isLastPiece   = p.quantity === 1 && p.inStock !== false && !p.hideLastPiece;
  const collectionBadge = p.collectionLabel
    ? `<div class="product-collection-tag">${p.collectionLabel}</div>`
    : (p.collectionName ? `<div class="product-collection-tag">${p.collectionName}</div>` : '');

  let imgContent;
  if (allImgs.length === 0) {
    imgContent = `<div class="product-img-placeholder">👗</div>`;
  } else if (!hasMultiple) {
    imgContent = `<img src="${allImgs[0]}" alt="${p.name}" loading="lazy">`;
  } else {
    imgContent = `
      <div class="card-slider" id="slider-${id}">
        ${allImgs.map((img, i) =>
          `<div class="card-slide${i === 0 ? " active" : ""}">
             <img src="${img}" alt="${p.name}" loading="lazy">
           </div>`
        ).join("")}
        <button class="card-arr card-prev" onclick="event.stopPropagation(); slideCard(${JSON.stringify(id)},-1)" aria-label="السابق">&#8250;</button>
        <button class="card-arr card-next" onclick="event.stopPropagation(); slideCard(${JSON.stringify(id)}, 1)" aria-label="التالي">&#8249;</button>
        <div class="card-dots">
          ${allImgs.map((_, i) =>
            `<div class="card-dot${i === 0 ? " active" : ""}" onclick="event.stopPropagation(); goToSlide(${id},${i})"></div>`
          ).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="product-card" data-id="${id}" data-price="${p.price}" data-idx="${idx}"
         onclick="openProductModal(${JSON.stringify(id)})">
      <div class="product-img-wrap">
        ${imgContent}
        <div class="product-badges">
          ${manualLabel ? `<span class="product-badge ${labelClass}">${manualLabel}</span>` : ""}
        </div>
        ${isLastPiece ? `<div class="last-piece-ribbon">آخر قطعة</div>` : ""}
        ${hasDis ? `<div class="sale-badge${isLastPiece ? ' second' : ''}"></div>` : ""}
        ${isOut  ? `<div class="out-of-stock-overlay">نفد المخزون</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-cat-tag">${p.category || ""}</div>
        ${collectionBadge}
        <div class="product-name-row">
          <div class="product-name">${p.name}</div>
          <button class="wish-btn" onclick="event.stopPropagation(); toggleWishlist(${JSON.stringify(id)})"
                  aria-label="مفضلة">${wished ? "❤️" : "🤍"}</button>
        </div>
        <div class="product-rating">
          <span class="stars-sm">${stars}</span>
          <span class="rating-count">(${p.reviews || 0})</span>
        </div>
        <div class="product-price-row">
          <span class="price-now${hasDis ? " on-sale" : ""}">₪ ${p.price}</span>
          ${hasDis ? `<span class="price-was">₪ ${p.originalPrice}</span>` : ""}
          ${hasDis ? `<span class="price-save">وفري ${disc}٪</span>` : ""}
        </div>
      </div>
        <button class="product-add-btn"
          onclick="event.stopPropagation(); openProductModal(${JSON.stringify(id)})">
        🛒 أضف للسلة
      </button>
    </div>`;
}


// ===== CARD IMAGE SLIDER =====
function slideCard(productId, delta) {
  const slider = document.getElementById(`slider-${productId}`);
  if (!slider) return;
  const slides = slider.querySelectorAll(".card-slide");
  const dots   = slider.querySelectorAll(".card-dot");
  const total  = slides.length;
  let cur = Array.from(slides).findIndex(s => s.classList.contains("active"));
  slides[cur].classList.remove("active");
  if (dots[cur]) dots[cur].classList.remove("active");
  cur = (cur + delta + total) % total;
  slides[cur].classList.add("active");
  if (dots[cur]) dots[cur].classList.add("active");
}

function goToSlide(productId, idx) {
  const slider = document.getElementById(`slider-${productId}`);
  if (!slider) return;
  slider.querySelectorAll(".card-slide").forEach((s, i) => s.classList.toggle("active", i === idx));
  slider.querySelectorAll(".card-dot").forEach((d, i)  => d.classList.toggle("active", i === idx));
}

// ===== CATEGORY FILTER =====
function filterCategory(cat) {
  state.currentCategory = cat;
  document.querySelectorAll(".cat-card").forEach(card => {
    card.classList.toggle("active", card.dataset.cat === cat);
  });
  renderProducts(cat);
}

// ===== PRODUCT MODAL =====
function openProductModal(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;

  state.currentProduct = { ...p, selectedSize: null, qty: 1 };

  const wished  = state.wishlist.includes(p.id);
  const hasDis  = p.originalPrice > p.price && p.originalPrice > 0;
  const disc    = hasDis ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  document.getElementById("modal-breadcrumb").innerHTML =
    `الرئيسية › <span>${p.category}</span> › ${p.name}`;

  document.getElementById("modal-name").textContent    = p.name;
  document.getElementById("modal-rating").textContent  = p.rating || "4.9";
  document.getElementById("modal-reviews").textContent = p.reviews || "0";

  const priceEl = document.getElementById("modal-price-now");
  if (priceEl) {
    priceEl.textContent = `₪ ${p.price}`;
    priceEl.className   = hasDis ? "modal-price-now on-sale" : "modal-price-now";
  }

  const origEl = document.getElementById("modal-price-was");
  const discEl = document.getElementById("modal-disc-tag");
  if (hasDis) {
    if (origEl) { origEl.textContent = `₪ ${p.originalPrice}`; origEl.style.display = ""; }
    if (discEl) { discEl.textContent = `خصم ${disc}٪`;         discEl.style.display = ""; }
  } else {
    if (origEl) origEl.style.display = "none";
    if (discEl) discEl.style.display = "none";
  }

  const stockEl = document.getElementById("modal-stock");
  const addBtn  = document.querySelector(".add-cart-btn");
  if (p.inStock === false) {
    if (stockEl) { stockEl.textContent = "✗ نفذ المخزون"; stockEl.className = "stock-tag out"; }
    if (addBtn)  { addBtn.disabled = true; addBtn.classList.add("sold-out"); addBtn.textContent = "نفذت الكمية"; }
  } else {
    if (stockEl) { stockEl.textContent = "✓ متوفر";       stockEl.className = "stock-tag in"; }
    if (addBtn)  { addBtn.disabled = false; addBtn.classList.remove("sold-out"); addBtn.innerHTML = "🛒 إضافة إلى السلة"; }
  }

  document.getElementById("modal-desc").textContent = p.description || "";

  // ===== Linked colors + gallery =====
  const linked    = Array.isArray(p.linkedColors) ? p.linkedColors.filter(c => c && c.productId) : [];
  const colorSec  = document.getElementById("colors-section");
  const colorWrap = document.getElementById("modal-colors");
  const baseImgs  = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  renderModalGallery(baseImgs, p.name);

  if (linked.length && colorSec && colorWrap) {
    colorSec.style.display = "";
    const nameEl2 = document.getElementById("modal-color-name");
    if (nameEl2) nameEl2.textContent = p.colorName || "";
    const baseThumb = baseImgs[0] || "";
    colorWrap.innerHTML =
      `<button class="color-swatch active" title="${p.colorName || ''}">
        <img src="${baseThumb}" alt="${p.colorName || ''}">
      </button>` +
      linked.map(c => {
        const lp    = state.products.find(x => String(x.id) === String(c.productId));
        const thumb = lp ? ((lp.images && lp.images.length ? lp.images[0] : lp.image) || "") : "";
        return `<button class="color-swatch" onclick="switchToLinkedProduct('${c.productId}')" title="${c.name || ''}">
          <img src="${thumb}" alt="${c.name || ''}">
        </button>`;
      }).join("");
  } else {
    if (colorSec) colorSec.style.display = "none";
  }

  const sizeSec   = document.getElementById("sizes-section");
  const sizesEl   = document.getElementById("modal-sizes");
  const guideLink = document.querySelector(".size-guide-link");
  if (p.sizes && p.sizes.length) {
    sizeSec.style.display = "";
    sizesEl.innerHTML = p.sizes.map(s =>
      `<button class="size-chip" onclick="selectSize(this, '${s}')">${s}</button>`
    ).join("");
  } else {
    sizeSec.style.display = "none";
  }
  if (guideLink) {
    guideLink.style.display = (p.sizeChart && p.sizeChart.length) ? "" : "none";
  }

  state.currentProduct.qty = 1;

  const wishBtn = document.getElementById("modal-wish-btn");
  wishBtn.classList.toggle("active", wished);
  wishBtn.textContent = wished ? "❤️" : "🤍";

  document.getElementById("product-modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function switchImage(src, thumbEl) {
  document.getElementById("modal-main-img").innerHTML = `<img src="${src}" alt="">`;
  document.querySelectorAll("#modal-thumbs .thumb").forEach(t => t.classList.remove("active"));
  thumbEl.classList.add("active");
}

function renderModalGallery(imgs, name) {
  const mainImg  = document.getElementById("modal-main-img");
  const thumbsEl = document.getElementById("modal-thumbs");
  if (!imgs || imgs.length === 0) {
    mainImg.innerHTML  = `<div class="img-ph">👗</div>`;
    thumbsEl.innerHTML = "";
    return;
  }
  mainImg.innerHTML = `<img src="${imgs[0]}" alt="${name || ''}">`;
  if (imgs.length > 1) {
    thumbsEl.innerHTML = imgs.map((img, i) =>
      `<div class="thumb ${i === 0 ? "active" : ""}" onclick="switchImage('${img}', this)">
        <img src="${img}" alt="">
      </div>`
    ).join("");
  } else {
    thumbsEl.innerHTML = `<div class="thumb active"><img src="${imgs[0]}" alt=""></div>`;
  }
}

function switchToLinkedProduct(productId) {
  const p = state.products.find(x => String(x.id) === String(productId));
  if (p) openProductModal(p.id);
}

function closeProductModal() {
  document.getElementById("product-modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function selectSize(btn, size) {
  document.querySelectorAll("#modal-sizes .size-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  if (state.currentProduct) state.currentProduct.selectedSize = size;
}

// ===== SIZE CHART =====
function openSizeChart() {
  const chart = state.currentProduct && state.currentProduct.sizeChart;
  if (!chart || chart.length === 0) return;
  const content = document.getElementById('size-chart-content');
  if (!content) return;
  content.innerHTML = `
    <table class="size-table">
      <thead><tr><th>المقاس</th><th>المواصفات</th></tr></thead>
      <tbody>${chart.map(r=>`<tr><td>${r.size}</td><td>${r.details}</td></tr>`).join('')}</tbody>
    </table>`;
  document.getElementById('size-chart-overlay').classList.add('open');
}
function closeSizeChart() {
  const ov = document.getElementById('size-chart-overlay');
  if (ov) ov.classList.remove('open');
}

// ===== WISHLIST =====
function toggleWishlist(id) {
  const idx = state.wishlist.indexOf(id);
  if (idx === -1) {
    state.wishlist.push(id);
    showToast("تمت الإضافة للمفضلة ❤️");
  } else {
    state.wishlist.splice(idx, 1);
    showToast("تمت الإزالة من المفضلة");
  }
  saveWishlist();
  renderProducts();

  if (state.currentProduct && state.currentProduct.id === id) {
    const btn    = document.getElementById("modal-wish-btn");
    const wished = state.wishlist.includes(id);
    btn.classList.toggle("active", wished);
    btn.textContent = wished ? "❤️" : "🤍";
  }
}

function toggleWishlistFromModal() {
  if (state.currentProduct) toggleWishlist(state.currentProduct.id);
}

// ===== CART =====
function addToCart() {
  const p = state.currentProduct;
  if (!p) return;

  if (p.inStock === false) {
    showToast("⚠️ هذا المنتج نفذت كميته");
    return;
  }

  if (p.sizes && p.sizes.length > 0 && !p.selectedSize) {
    showToast("⚠️ الرجاء اختيار المقاس أولاً");
    document.getElementById("modal-sizes").style.animation = "none";
    setTimeout(() => { document.getElementById("modal-sizes").style.animation = "shake 0.4s"; }, 10);
    return;
  }

  const key      = `${p.id}-${p.selectedSize || "one"}`;
  const existing = state.cart.find(i => i.key === key);

  if (existing) {
    showToast("⚠️ هذا المنتج موجود بالفعل في السلة");
    return;
  }

  state.cart.push({
    key,
    id: p.id,
    name: p.name,
    price: p.price,
    image: (p.images && p.images.length ? p.images[0] : p.image) || "",
    size: p.selectedSize || "",
    color: p.colorName || "",
    qty: 1
  });

  saveCart();
  updateCartBadge();
  closeProductModal();
  openCart();
  showToast("✓ تمت الإضافة إلى السلة");
}

function openCart() {
  renderCart();
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-sidebar").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-sidebar").classList.remove("open");
  document.body.style.overflow = "";
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const footer    = document.getElementById("cart-footer");
  const countEl   = document.getElementById("cart-count");

  const total_items = state.cart.reduce((s, i) => s + i.qty, 0);
  if (countEl) countEl.textContent = total_items;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛍️</div>
        <p>سلتك فاضية</p>
        <button class="btn-primary" onclick="closeCart()" style="font-size:13px;padding:10px 22px;margin-top:8px">تسوقي الآن ›</button>
      </div>`;
    footer.style.display = "none";
    return;
  }

  footer.style.display = "";

  container.innerHTML = state.cart.map(item => {
    const imgTag = item.image
      ? `<img src="${item.image}" alt="${item.name}">`
      : "👗";
    return `
      <div class="cart-item">
        <div class="cart-item-img">${imgTag}</div>
        <div class="cart-item-body">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">${[item.size ? `المقاس: ${item.size}` : "", item.color ? `اللون: ${item.color}` : ""].filter(Boolean).join(" · ")}</div>
          <div class="cart-item-price">₪ ${(item.price * item.qty)}</div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-count">${item.qty} قطعة</div>
          <button class="remove-btn" onclick="removeItem('${item.key}')">حذف</button>
        </div>
      </div>`;
  }).join("");

  const subtotal = calcSubtotal();
  document.getElementById("cart-subtotal").textContent = `₪ ${subtotal}`;
  document.getElementById("cart-total").textContent    = `₪ ${subtotal}`;
}

function calcSubtotal() {
  return state.cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// removed: updateQty(key, delta)
// This helper was unused in the UI and could cause accidental quantity changes.
// Keep quantity changes via admin only; customers add a product once. If you
// later want to re-enable client-side qty controls, restore this function.

function removeItem(key) {
  state.cart = state.cart.filter(i => i.key !== key);
  saveCart();
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  badge.textContent    = count;
  badge.style.display  = count > 0 ? "flex" : "none";

  const mobBadge = document.getElementById("mob-cart-badge");
  if (mobBadge) {
    mobBadge.textContent   = count;
    mobBadge.style.display = count > 0 ? "flex" : "none";
  }
}

// ===== CHECKOUT =====
function openCheckout() {
  if (state.cart.length === 0) { showToast("⚠️ سلتك فاضية"); return; }
  closeCart();
  state.checkoutStep   = 1;
  state.selectedPayment = null;
  showStep(1);
  document.getElementById("checkout-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  document.getElementById("checkout-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function showStep(n) {
  state.checkoutStep = n;
  document.querySelectorAll(".checkout-step").forEach((el, i) => {
    el.classList.toggle("active", i + 1 === n);
  });
  document.querySelectorAll(".step-dot").forEach((dot, i) => {
    dot.classList.toggle("active",  i + 1 === n);
    dot.classList.toggle("done",    i + 1 <  n);
    dot.classList.toggle("pending", i + 1 >  n);
  });
}

function nextStep() {
  if (state.checkoutStep === 1) {
    const name    = document.getElementById("cust-name").value.trim();
    const phone   = document.getElementById("cust-phone").value.trim();
    const address = document.getElementById("cust-address").value.trim();

    if (!name || !phone || !address) {
      showToast("⚠️ الرجاء إدخال جميع البيانات المطلوبة");
      return;
    }

    if (phone.replace(/\D/g, "").length < 9) {
      showToast("⚠️ رقم الهاتف غير صحيح");
      return;
    }

    state.customerInfo = {
      name,
      phone,
      address,
      notes: document.getElementById("cust-notes").value.trim()
    };

    renderInvoice();
  }

  showStep(state.checkoutStep + 1);
  document.querySelector(".checkout-box").scrollTop = 0;
}

function prevStep() {
  if (state.checkoutStep > 1) showStep(state.checkoutStep - 1);
  document.querySelector(".checkout-box").scrollTop = 0;
}

function renderInvoice() {
  const total = calcSubtotal();
  const info  = state.customerInfo;
  const now   = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

  document.getElementById("invoice-date").textContent = dateStr;
  const invNum = document.getElementById("invoice-num");
  if (invNum) invNum.textContent = String(Date.now()).slice(-6);

  document.getElementById("invoice-customer").innerHTML = `
    <div class="inv-cust-grid">
      <div class="inv-cust-item">
        <span class="inv-cust-lbl">الاسم</span>
        <span class="inv-cust-val">${info.name}</span>
      </div>
      <div class="inv-cust-item">
        <span class="inv-cust-lbl">الهاتف</span>
        <span class="inv-cust-val" dir="ltr">${info.phone}</span>
      </div>
      <div class="inv-cust-item inv-cust-full">
        <span class="inv-cust-lbl">العنوان</span>
        <span class="inv-cust-val">${info.address}</span>
      </div>
      ${info.notes ? `<div class="inv-cust-item inv-cust-full"><span class="inv-cust-lbl">ملاحظات</span><span class="inv-cust-val">${info.notes}</span></div>` : ""}
    </div>
  `;

  document.getElementById("invoice-items-list").innerHTML = state.cart.map(item => `
    <tr>
      <td class="inv-td-name">${item.name}${item.color ? ` <span style="color:#999;font-size:11px">- ${item.color}</span>` : ""}</td>
      <td class="inv-td-qty">× ${item.qty}${item.size ? ` (${item.size})` : ""}</td>
      <td class="inv-td-price">₪ ${item.price * item.qty}</td>
    </tr>`).join("");

  document.getElementById("inv-total").textContent     = `₪ ${total}`;
  document.getElementById("payment-total").textContent = `₪ ${total}`;
}

// ===== PAYMENT =====
function selectPayment(method) {
  state.selectedPayment = method;
  document.querySelectorAll(".pay-method").forEach(el => {
    el.classList.toggle("selected", el.dataset.method === method);
  });
}

function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() => showToast("✓ تم النسخ"));
}

// ===== BOOK ORDER =====
async function bookOrder() {
  if (!state.selectedPayment) {
    showToast("⚠️ الرجاء اختيار طريقة الدفع");
    return;
  }
  const info = state.customerInfo;
  if (!info) return;

  // ✓ فحص الكميات من Firestore مباشرة قبل الطلب
  try {
    for (const cartItem of state.cart) {
      const prodDoc = await db.collection('products').doc(String(cartItem.id)).get();
      if (!prodDoc.exists) {
        showToast("⚠️ المنتج غير متاح");
        return;
      }
      const prodData = prodDoc.data();
      const available = prodData.quantity || 0;
      if (available < cartItem.qty) {
          showToast("⚠️ للاسف تم نفاذ المخزون، ربما قامت زبونة بحجزه للتو");
        return;
      }
    }
  } catch (e) {
    console.error('خطأ في التحقق من الكميات:', e);
    showToast("⚠️ خطأ في التحقق من الكميات");
    return;
  }

  const total = calcSubtotal();

  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    status: "pending",
    customer: { ...info },
    items: state.cart.map(i => ({ ...i })),
    total,
    paymentMethod: state.selectedPayment
  };

  try {
    await db.collection('orders').doc(String(order.id)).set(order);
    try { new BroadcastChannel('yara-orders').postMessage({ type: 'new-order', order }); } catch(e) {}

    for (const cartItem of state.cart) {
      const product = state.products.find(p => p.id === cartItem.id);
      if (product && product.quantity !== undefined && product.quantity !== null) {
        product.quantity = Math.max(0, product.quantity - cartItem.qty);
        if (product.quantity === 0) product.inStock = false;
        await db.collection('products').doc(String(product.id)).update({
          quantity: product.quantity,
          inStock:  product.inStock
        });
      }
    }
  } catch (e) {
    console.error('خطأ في حفظ الطلب:', e);
    showToast("⚠️ خطأ في إرسال الطلب، حاولي مجدداً");
    return;
  }

  state.cart = [];
  saveCart();
  updateCartBadge();
  closeCheckout();
  renderProducts();

  showToast("✓ تم حجز طلبك! سيتم تحويلك لواتساب...");
  setTimeout(() => sendToWhatsApp(order), 900);
}

// ===== WHATSAPP =====
function sendToWhatsApp(order) {
  if (!order) return;
  const info    = order.customer;
  const payMap  = { islamic: "البنك الإسلامي الفلسطيني", palestine: "محفظة بال بي", "pal-bank": "تحويل بنك فلسطين" };
  const payText = payMap[order.paymentMethod] || "غير محدد";

  const itemsList = order.items.map(i =>
    `• ${i.name}${i.size ? ` (${i.size})` : ""}${i.color ? ` - ${i.color}` : ""} × ${i.qty} ← ₪${i.price * i.qty}`
  ).join("\n");

  const bag   = String.fromCodePoint(0x1F6CD, 0xFE0F);
  const who   = String.fromCodePoint(0x1F464);
  const cart  = String.fromCodePoint(0x1F6D2);
  const check = String.fromCodePoint(0x2705);
  const card  = String.fromCodePoint(0x1F4B3);
  const heart = String.fromCodePoint(0x2764, 0xFE0F);

  const msg =
    `${bag} *طلب جديد - متجر يارا*\n` +
    `رقم الطلب: #${String(order.id).slice(-6)}\n\n` +
    `${who} *بيانات الزبونة*\n` +
    `الاسم: ${info.name}\n` +
    `الهاتف: ${info.phone}\n` +
    `العنوان: ${info.address}\n` +
    (info.notes ? `ملاحظات: ${info.notes}\n` : "") +
    `\n${cart} *المنتجات*\n` +
    `${itemsList}\n\n` +
    `${check} *الاجمالي: ${order.total} شيقل*\n` +
    `${card} طريقة الدفع: ${payText}\n\n` +
    `شكرا لطلبك ${heart}`;

  window.location.href = `https://api.whatsapp.com/send/?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}&type=phone_number&app_absent=0`;
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2800);
}

// ===== HELPERS =====
function scrollToProducts() {
  document.getElementById("products-section").scrollIntoView({ behavior: "smooth" });
}

function toggleWishlistView() {
  if (state.wishlist.length === 0) {
    showToast("مفضلتك فاضية — اضغطي ❤️ على أي منتج");
    return;
  }
  filterCategory("الكل");
  const grid  = document.getElementById("products-grid");
  const cards = grid.querySelectorAll(".product-card");
  cards.forEach(card => {
    const id = parseInt(card.dataset.id);
    card.style.display = state.wishlist.includes(id) ? "" : "none";
  });
  document.getElementById("products-label").textContent = `المفضلة (${state.wishlist.length})`;
  scrollToProducts();
  showToast(`❤️ ${state.wishlist.length} منتج في مفضلتك`);
}

// ===== EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  init();

  document.getElementById("product-modal-overlay").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeProductModal();
  });

  document.getElementById("checkout-overlay").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeCheckout();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeProductModal();
      closeCart();
      closeCheckout();
    }
  });
});
