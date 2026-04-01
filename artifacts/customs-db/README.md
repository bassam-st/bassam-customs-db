# مخزن البنود الجمركية

نظام إدارة البنود الجمركية وحاسبة الرسوم الجمركية - تطبيق PWA متكامل باللغة العربية

---

## الغرض من المشروع

هذا التطبيق يتيح لموظفي الجمارك والتجار:
- **البحث عن البنود الجمركية** بالاسم، كود HS، المنشأ، الفئة
- **حساب الجمارك** بالريال اليمني حسب المعادلة: `جمارك = السعر × الكمية × سعر الصرف × عامل الفئة`
- **بناء عمليات جمركية متعددة البنود** وحفظها
- **إدارة مخزن البنود** مع دعم التصنيف والأسماء البديلة
- **النسخ الاحتياطي والاستعادة** بصيغة JSON

---

## الحزمة التقنية

| التقنية | الاستخدام |
|---------|-----------|
| Vite + React + TypeScript | واجهة المستخدم |
| Firebase Auth | المصادقة |
| Cloud Firestore | قاعدة البيانات |
| Cloud Functions (اختياري) | إدارة المستخدمين |
| PWA (manifest + service worker) | التثبيت والعمل بدون إنترنت |
| Tailwind CSS | التنسيق |
| Wouter | التوجيه |
| GitHub Pages | الاستضافة |

---

## التشغيل المحلي

### المتطلبات
- Node.js 18+
- pnpm (أو npm)

### الخطوات

```bash
# 1. استنساخ المستودع
git clone https://github.com/username/bassam-customs-db.git
cd bassam-customs-db

# 2. نسخ ملف البيئة
cp .env.example .env.local

# 3. تعبئة متغيرات Firebase في .env.local

# 4. تثبيت التبعيات
pnpm install

# 5. تشغيل بيئة التطوير
PORT=5173 BASE_PATH=/ pnpm run dev
```

---

## إعداد Firebase

### 1. إنشاء مشروع Firebase
1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل **Authentication → Email/Password**
4. أنشئ **Cloud Firestore** في الوضع التجريبي

### 2. الحصول على مفاتيح Firebase
```
Project Settings → Your apps → Web app → Firebase SDK snippet
```
انسخ القيم إلى `.env.local`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. نشر قواعد Firestore
```bash
npm install -g firebase-tools
firebase login
firebase use --add  # اختر مشروعك
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## تهيئة المالك الأول

### 1. إنشاء حساب المالك
في Firebase Console → Authentication → Add user:
- البريد الإلكتروني: owner@yourdomain.com
- كلمة المرور: كلمة مرور قوية

### 2. إضافة بيانات المالك في Firestore
في Firestore → users → أضف وثيقة باسم UID المستخدم:
```json
{
  "fullName": "المالك",
  "email": "owner@yourdomain.com",
  "phone": "",
  "role": "owner",
  "status": "active",
  "licenseActive": true,
  "allowedDevices": [],
  "lastSeenAt": null,
  "createdAt": "timestamp",
  "createdBy": "system",
  "notes": ""
}
```

### 3. تهيئة إعدادات التطبيق (app_settings/main)
أنشئ وثيقة `app_settings/main` في Firestore:
```json
{
  "appName": "مخزن البنود الجمركية",
  "exchangeRate": 250,
  "factor5": 0.211,
  "factor10": 0.265,
  "factor25": 0.41,
  "ownerPinHash": "<hash-sha256-for-your-pin>",
  "currencyCode": "YER",
  "defaultCountry": "اليمن",
  "licenseCheckHours": 24,
  "allowOfflineMode": true,
  "lastUpdatedAt": null,
  "lastUpdatedBy": ""
}
```

لتوليد hash لـ PIN:
```javascript
// في console المتصفح بعد فتح التطبيق:
const pin = 'bassam1234';
const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join(''));
```

---

## النشر على GitHub Pages

### 1. إنشاء مستودع GitHub
```bash
git init
git remote add origin https://github.com/username/bassam-customs-db.git
```

### 2. إضافة أسرار GitHub
في Repository → Settings → Secrets and variables → Actions:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 3. تفعيل GitHub Pages
Repository → Settings → Pages → Source: **GitHub Actions**

### 4. تعديل BASE_PATH في ملف CI
في `.github/workflows/deploy-pages.yml`:
```yaml
BASE_PATH: /bassam-customs-db/
```
غيّر `bassam-customs-db` إلى اسم مستودعك

### 5. الدفع والنشر
```bash
git add .
git commit -m "first commit"
git push -u origin main
```

سيبدأ النشر تلقائياً ويمكن متابعته في تبويب Actions

---

## تغيير اسم التطبيق والأيقونات

### الاسم
- في التطبيق: ادخل إعدادات المالك وغيّر "اسم التطبيق"
- في `index.html`: غيّر `<title>`
- في `public/manifest.json`: غيّر `name` و `short_name`

### الأيقونات
ضع ملفات PNG في `public/icons/`:
- `icon-192.png` (192×192 بكسل)
- `icon-512.png` (512×512 بكسل)

---

## تصدير واستيراد البيانات

### التصدير
1. ادخل كمالك → صفحة النسخ الاحتياطية
2. اضغط "تصدير النسخة"
3. سيتم تحميل ملف JSON

### الاستيراد
1. ادخل كمالك → صفحة النسخ الاحتياطية
2. اضغط "اختيار ملف JSON"
3. تأكد من صحة البيانات قبل الاستيراد

---

## بيانات مبدئية
يمكن استخدام `src/data/defaultCatalog.json` كبيانات بذرة للبنود الجمركية

---

## الاستمرار في التطوير خارج Replit

هذا المشروع مستقل تماماً عن Replit:
```bash
# استنساخ المشروع
git clone https://github.com/username/bassam-customs-db.git
cd bassam-customs-db

# تثبيت التبعيات
pnpm install

# تشغيل في أي بيئة
PORT=5173 BASE_PATH=/ pnpm run dev

# بناء للنشر
BASE_PATH=/bassam-customs-db/ PORT=4173 pnpm run build
```

لا يوجد أي اعتماد على Replit. يعمل على macOS/Linux/Windows مع Node.js 18+

---

## هيكل المشروع

```
├── src/
│   ├── app/           # Context providers
│   ├── components/    # مكونات مشتركة
│   ├── data/          # بيانات مبدئية
│   ├── lib/           # خدمات Firebase والحسابات
│   ├── pages/         # الصفحات
│   └── types/         # TypeScript types
├── public/
│   ├── manifest.json  # PWA manifest
│   └── sw.js          # Service Worker
├── functions/         # Cloud Functions (اختياري)
├── .github/workflows/ # CI/CD
├── firestore.rules    # قواعد Firestore
├── firebase.json      # إعداد Firebase
└── .env.example       # مثال متغيرات البيئة
```
