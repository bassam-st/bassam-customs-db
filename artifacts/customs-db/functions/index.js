/**
 * Cloud Functions للإدارة - مخزن البنود الجمركية
 *
 * هذا الملف اختياري ويُستخدم لعمليات الإدارة المتقدمة
 * مثل: حظر مستخدم وإلغاء جلساته
 *
 * للتفعيل:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions
 * 4. firebase deploy --only functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

/**
 * حظر مستخدم وإلغاء جلساته
 * يجب أن يكون المستدعي مالكاً
 */
exports.blockUser = onCall(async (request) => {
  const { uid: callerUid } = request.auth;
  if (!callerUid) throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
    throw new HttpsError('permission-denied', 'صلاحية المالك فقط');
  }

  const { targetUid } = request.data;
  if (!targetUid) throw new HttpsError('invalid-argument', 'uid الهدف مطلوب');

  const auth = getAuth();

  // تعطيل المستخدم في Firebase Auth
  await auth.updateUser(targetUid, { disabled: true });

  // إلغاء جلسات المستخدم
  await auth.revokeRefreshTokens(targetUid);

  // تحديث الحالة في Firestore
  await db.collection('users').doc(targetUid).update({
    status: 'blocked',
    updatedBy: callerUid,
    updatedAt: new Date(),
  });

  // تسجيل في سجل المراجعة
  await db.collection('audit_logs').add({
    actorUid: callerUid,
    actorName: callerDoc.data().fullName,
    action: 'block_user',
    targetType: 'user',
    targetId: targetUid,
    oldValue: 'active',
    newValue: 'blocked',
    createdAt: new Date(),
  });

  return { success: true };
});

/**
 * إلغاء تعطيل مستخدم
 */
exports.unblockUser = onCall(async (request) => {
  const { uid: callerUid } = request.auth;
  if (!callerUid) throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');

  const db = getFirestore();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
    throw new HttpsError('permission-denied', 'صلاحية المالك فقط');
  }

  const { targetUid } = request.data;
  const auth = getAuth();

  await auth.updateUser(targetUid, { disabled: false });
  await db.collection('users').doc(targetUid).update({
    status: 'active',
    updatedBy: callerUid,
    updatedAt: new Date(),
  });

  return { success: true };
});

/**
 * تهيئة إعدادات التطبيق الأولية مع hash للـ PIN
 * تُستدعى مرة واحدة فقط
 */
exports.initAppSettings = onCall(async (request) => {
  const { uid } = request.auth;
  if (!uid) throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول');

  const db = getFirestore();
  const settingsRef = db.collection('app_settings').doc('main');
  const snap = await settingsRef.get();

  if (snap.exists) {
    throw new HttpsError('already-exists', 'الإعدادات موجودة بالفعل');
  }

  const { pinHash } = request.data;
  await settingsRef.set({
    appName: 'مخزن البنود الجمركية',
    exchangeRate: 250,
    factor5: 0.211,
    factor10: 0.265,
    factor25: 0.41,
    ownerPinHash: pinHash,
    currencyCode: 'YER',
    defaultCountry: 'اليمن',
    licenseCheckHours: 24,
    allowOfflineMode: true,
    lastUpdatedAt: new Date(),
    lastUpdatedBy: uid,
  });

  return { success: true };
});
