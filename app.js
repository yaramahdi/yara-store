// ===== CONFIG =====
let WHATSAPP_NUMBER = "970566707278";

let BANK_INFO = {
  islamic_account:  "XXXX-XXXX-XXXX-XXXX",
  islamic_iban:     "PS10PIBC083120568270033132000",
  islamic_name:     "يارا",
  palestine_wallet: "05X-XXX-XXXX",
  palestine_name:   "يارا",
  pal_bank_account: "XXXX-XXXX-XXXX-XXXX",
  pal_bank_iban:    "PS92XXXXXXXXXXXXXXXXXXXX",
  pal_bank_name:    "يارا"
};


// ===== DEFAULT PRODUCTS =====
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "بلوزة ساتان حريرية",
    category: "بلايز قصيرة",
    price: 140,
    originalPrice: 175,
    discount: 20,
    sizes: ["XS","S","M","L","XL"],
    description: "ملمس حريري فاخر مع لمعة هادئة. مثالية تحت بليز أو منفردة. تشكيلة محدودة ضمن مجموعة ربيع ٢٠٢٦.",
    image: "",
    images: [],
    rating: 4.9,
    reviews: 21,
    inStock: true
  },
  {
    id: 2,
    name: "عباية وردية بأنامة للسفرات",
    category: "عبايات",
    price: 310,
    originalPrice: 390,
    discount: 21,
    sizes: ["S","M","L","XL"],
    description: "عباية أنيقة بخامة أنامة خفيفة مناسبة للسفر والرحلات. تصميم عصري بلمسة فلسطينية.",
    image: "",
    images: [],
    rating: 4.8,
    reviews: 14,
    inStock: true
  },
  {
    id: 3,
    name: "عباية سوداء مطرزة بالأمثل",
    category: "عبايات",
    price: 370,
    originalPrice: 460,
    discount: 20,
    sizes: ["S","M","L","XL","XXL"],
    description: "عباية سوداء فاخرة بتطريز يدوي دقيق. قطعة مميزة لكل مناسبة.",
    image: "",
    images: [],
    rating: 4.9,
    reviews: 32,
    inStock: true
  },
  {
    id: 4,
    name: "عباية كريم بخوف ذهبية",
    category: "عبايات",
    price: 380,
    originalPrice: 0,
    discount: 0,
    sizes: ["S","M","L","XL"],
    description: "عباية بلون الكريم الهادئ مع تطريز ذهبي راقٍ. مثالية للسهرات والمناسبات الخاصة.",
    image: "",
    images: [],
    rating: 5.0,
    reviews: 8,
    inStock: true
  },
  {
    id: 5,
    name: "عباية نجع فطرية",
    category: "عبايات",
    price: 420,
    originalPrice: 520,
    discount: 19,
    sizes: ["M","L","XL"],
    description: "عباية تراثية بتطريز فلسطيني أصيل. كل قطعة صُنعت بيد فنانة محلية.",
    image: "",
    images: [],
    rating: 4.7,
    reviews: 19,
    inStock: true
  },
  {
    id: 6,
    name: "فستان ربيعي زهري",
    category: "فساتين قصيرة",
    price: 220,
    originalPrice: 275,
    discount: 20,
    sizes: ["XS","S","M","L"],
    description: "فستان خفيف بطبعات زهرية جميلة. مثالي للنزهات والمناسبات الربيعية.",
    image: "",
    images: [],
    rating: 4.8,
    reviews: 27,
    inStock: true
  },
  {
    id: 7,
    name: "فستان محجب بيج أنيق",
    category: "فساتين محجب",
    price: 265,
    originalPrice: 0,
    discount: 0,
    sizes: ["S","M","L","XL"],
    description: "فستان محتشم بقصة واسعة وقماش عالي الجودة. يناسب الدوام والمناسبات.",
    image: "",
    images: [],
    rating: 4.9,
    reviews: 41,
    inStock: true
  },
  {
    id: 8,
    name: "بلوزة قطنية مطبوعة",
    category: "بلايز قصيرة",
    price: 95,
    originalPrice: 120,
    discount: 21,
    sizes: ["XS","S","M","L","XL"],
    description: "بلوزة قطن ١٠٠٪ بطبعة عصرية. مريحة يومياً ويمكن تنسيقها بأي شيء.",
    image: "",
    images: [],
    rating: 4.6,
    reviews: 55,
    inStock: true
  }
];

// ===== STATE =====
let state = {
  products: [],
  cart: [],
  wishlist: [],
  currentProduct: null,
  currentCategory: "الكل",
  checkoutStep: 1,
  customerInfo: null,
  selectedPayment: null
};

// ===== INIT =====
async function init() {
  loadCart();
  loadWishlist();
  updateCartBadge();

  const grid = document.getElementById("products-grid");
  if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:#bbb;font-size:15px">جاري تحميل المنتجات...</div>';

  await Promise.all([loadProducts(), loadBankInfo()]);
  renderProducts();
}

async function loadProducts() {
  try {
    const snap = await db.collection('products').get();
    
    if (snap.empty) {
      state.products = [...DEFAULT_PRODUCTS];
    } else {
      state.products = snap.docs.map(doc => doc.data());
    }
  } catch (e) {
    console.error('خطأ في تحميل المنتجات من Firebase:', e);
    // في حالة خطأ الاتصال بـ Firebase، استخدمي البيانات الافتراضية
    state.products = [...DEFAULT_PRODUCTS];
  }
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

      if (data.catImages) {
        document.querySelectorAll(".cat-circle[data-cat]").forEach(circle => {
          const cat = circle.dataset.cat;
          if (data.catImages[cat]) {
            circle.innerHTML = `<img src="${data.catImages[cat]}" alt="${cat}">`;
          }
        });
      }

      if (data.announce) {
        const bar = document.querySelector(".announce-bar");
        if (bar) bar.innerHTML = data.announce;
      }
    }
  } catch (e) {
    console.error('خطأ في تحميل الإعدادات:', e);
  }

  const ia      = document.getElementById("islamic-account");
  const iiban   = document.getElementById("islamic-iban");
  const iname   = document.getElementById("islamic-name");
  const pw      = document.getElementById("palestine-wallet");
  const pname   = document.getElementById("palestine-name");
  const pa      = document.getElementById("palestine-account");
  const piban   = document.getElementById("palestine-iban");
  const pbname  = document.getElementById("pal-bank-name");
  if (ia)     ia.textContent     = BANK_INFO.islamic_account;
  if (iiban)  iiban.textContent  = BANK_INFO.islamic_iban    || "PS92XXXXXXXXXXXXXXXXXXXX";
  if (iname)  iname.textContent  = BANK_INFO.islamic_name    || "يارا";
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

// ===== RENDER PRODUCTS =====
function renderProducts(filter) {
  if (filter !== undefined) state.currentCategory = filter;
  const cat = state.currentCategory;

  let filtered = cat === "الكل"
    ? state.products
    : state.products.filter(p => p.category === cat);

  const grid  = document.getElementById("products-grid");
  const label = document.getElementById("products-label");

  if (label) {
    const count = filtered.length;
    label.textContent = cat === "الكل" ? `جميع المنتجات (${count})` : `${cat} (${count})`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <div class="no-icon">🔍</div>
        <p>لا يوجد منتجات في هذه الفئة حالياً</p>
        <small>جربي فئة أخرى أو عودي لاحقاً</small>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map((p, i) => productCardHTML(p, i)).join("");
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
        <button class="card-arr card-prev" onclick="event.stopPropagation(); slideCard(${id},-1)" aria-label="السابق">&#8250;</button>
        <button class="card-arr card-next" onclick="event.stopPropagation(); slideCard(${id}, 1)" aria-label="التالي">&#8249;</button>
        <div class="card-dots">
          ${allImgs.map((_, i) =>
            `<div class="card-dot${i === 0 ? " active" : ""}" onclick="event.stopPropagation(); goToSlide(${id},${i})"></div>`
          ).join("")}
        </div>
      </div>`;
  }

  return `
    <div class="product-card" data-id="${id}" data-price="${p.price}" data-idx="${idx}"
         onclick="openProductModal(${id})">
      <div class="product-img-wrap">
        ${imgContent}
        ${hasDis ? `<div class="sale-badge">خصم ${disc}٪</div>` : ""}
        ${isOut  ? `<div class="out-of-stock-overlay">نفذ المخزون</div>` : ""}
        <button class="wish-btn" onclick="event.stopPropagation(); toggleWishlist(${id})"
                aria-label="مفضلة">${wished ? "❤️" : "🤍"}</button>
      </div>
      <div class="product-info">
        <div class="product-cat-tag">${p.category || ""}</div>
        <div class="product-name">${p.name}</div>
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
              onclick="event.stopPropagation(); openProductModal(${id})">
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

  const mainImg = document.getElementById("modal-main-img");
  if (p.image) {
    mainImg.innerHTML = `<img src="${p.image}" alt="${p.name}">`;
  } else {
    mainImg.innerHTML = `<div class="img-ph">👗</div>`;
  }

  const thumbsEl = document.getElementById("modal-thumbs");
  const allImgs  = (p.images && p.images.length) ? p.images : (p.image ? [p.image] : []);
  if (allImgs.length > 1) {
    thumbsEl.innerHTML = allImgs.map((img, i) =>
      `<div class="thumb ${i === 0 ? "active" : ""}" onclick="switchImage('${img}', this)">
        <img src="${img}" alt="">
      </div>`
    ).join("");
  } else if (allImgs.length === 1) {
    thumbsEl.innerHTML = `<div class="thumb active"><img src="${allImgs[0]}" alt=""></div>`;
  } else {
    thumbsEl.innerHTML = "";
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
  document.getElementById("modal-qty").textContent = "1";

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

function closeProductModal() {
  document.getElementById("product-modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function selectSize(btn, size) {
  document.querySelectorAll("#modal-sizes .size-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  if (state.currentProduct) state.currentProduct.selectedSize = size;
}

function changeQty(delta) {
  if (!state.currentProduct) return;
  state.currentProduct.qty = Math.max(1, state.currentProduct.qty + delta);
  document.getElementById("modal-qty").textContent = state.currentProduct.qty;
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
    existing.qty += p.qty;
  } else {
    state.cart.push({
      key,
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image || "",
      size: p.selectedSize || "",
      qty: p.qty
    });
  }

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
          <div class="cart-item-meta">${item.size ? `المقاس: ${item.size}` : ""}</div>
          <div class="cart-item-price">₪ ${(item.price * item.qty)}</div>
        </div>
        <div class="cart-item-right">
          <div class="cart-qty">
            <button onclick="updateQty('${item.key}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${item.key}', 1)">+</button>
          </div>
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

function updateQty(key, delta) {
  const item = state.cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter(i => i.key !== key);
  saveCart();
  updateCartBadge();
  renderCart();
}

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
      <td class="inv-td-name">${item.name}</td>
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

  showToast("✓ تم حجز طلبك! سيتم تحويلك لواتساب...");
  setTimeout(() => sendToWhatsApp(order), 900);
}

// ===== WHATSAPP =====
function sendToWhatsApp(order) {
  if (!order) return;
  const info    = order.customer;
  const payMap  = { islamic: "البنك الإسلامي الفلسطيني", palestine: "محفظة بنك فلسطين", "pal-bank": "تحويل بنك فلسطين" };
  const payText = payMap[order.paymentMethod] || "غير محدد";

  const itemsList = order.items.map(i =>
    `• ${i.name}${i.size ? ` (${i.size})` : ""} × ${i.qty} ← ₪${i.price * i.qty}`
  ).join("\n");

  const msg =
    `🛍️ *طلب جديد - متجر يارا*\n` +
    `رقم الطلب: #${String(order.id).slice(-6)}\n` +
    `━━━━━━━━━━━━━━━\n\n` +
    `👤 *بيانات الزبونة*\n` +
    `الاسم: ${info.name}\n` +
    `الهاتف: ${info.phone}\n` +
    `العنوان: ${info.address}\n` +
    (info.notes ? `ملاحظات: ${info.notes}\n` : "") +
    `\n🛒 *المنتجات*\n` +
    `${itemsList}\n\n` +
    `✅ *الإجمالي: ₪${order.total}*\n\n` +
    `💳 طريقة الدفع: ${payText}\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `شكراً لطلبك! سيتم التواصل معك قريباً ❤️`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
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
