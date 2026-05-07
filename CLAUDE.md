# Yara Store — CLAUDE.md

## المشروع
متجر إلكتروني عربي (RTL) — vanilla HTML/CSS/JS + Firebase Firestore.  
لا يوجد build tool أو npm. كل شيء يعمل عبر CDN مباشرة.

## الملفات الرئيسية
| الملف | الوصف |
|-------|-------|
| `index.html` | واجهة المتجر للزبائن |
| `admin.html` | لوحة الإدارة (محمية بكلمة سر من Firestore) |
| `app.js` | كل منطق المتجر (async) |
| `firebase.js` | تهيئة Firebase وتصدير `db` كـ global |
| `style.css` | كل التصاميم |

## Firebase
- **Project ID:** `yara-store-59286`
- **SDK:** compat v10.11.0 عبر CDN (لا module imports)
- **Pattern:** `firebase.initializeApp(config)` ثم `const db = firebase.firestore()`
- **Collections:** `products/{id}` · `orders/{id}` · `settings/main`

## البنية المعمارية

### app.js
- `init()` async — يحمّل products + settings من Firestore ثم يرندر
- `loadProducts()` — إذا Firestore فارغ يستخدم `DEFAULT_PRODUCTS` محلياً (لا auto-seed)
- `loadBankInfo()` — يقرأ `settings/main`: WHATSAPP_NUMBER، BANK_INFO، catImages، announce
- `bookOrder()` async — يحفظ الطلب في `orders/{id}` ويخصم الكميات من `products`
- Cart + Wishlist → localStorage فقط (بيانات per-user)

### admin.html
- `adminProducts[]` و `adminOrders[]` — cache arrays تُبقي دوال الرندر synchronous
- `_mergeSettings(patch)` — يقرأ `settings/main` ويدمج الحقول دون حذف الباقي
- `doLogin()` async — يجلب `adminPass` من `settings/main` للمقارنة
- عند فتح تبويب Orders → يعيد التحميل من Firestore

## الإعدادات المهمة
- **WhatsApp:** `970566707278` (مخزّن في `settings/main.whatsappNumber`)
- **كلمة سر الإدارة:** مخزّنة في `settings/main.adminPass`
- **صور الفئات:** base64 داخل `settings/main.catImages` (مضغوطة إلى 400px)

## CSS — فقاعة واتساب
- مخفية افتراضياً (`opacity:0`, `pointer-events:none`)
- تظهر عند إضافة class `.visible` (يُضاف بـ scroll > 200px في index.html)
- أيقونة SVG بيضاء، لا نص، شكل دائري

## قواعد العمل
- لا تُعدّل `firebase.js` إلا إذا طُلب صراحةً
- لا تُضف comments إلا لـ WHY غير الواضح
- للتعديلات الكبيرة: اعرض الخطوات أولاً قبل التنفيذ
- الردود بالعربية دائماً
