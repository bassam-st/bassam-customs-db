/**
 * خدمات المصادقة والمستخدمين
 */
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { AppUser, UserRole } from '../types/user';

/** تسجيل الدخول */
export async function signIn(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** تسجيل الخروج */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** إنشاء مستخدم جديد (من قِبل المالك لإضافة موظف) */
export async function createUser(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdBy: string;
}): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  const uid = cred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    fullName: params.fullName,
    email: params.email,
    phone: '',
    role: params.role,
    status: 'active',
    licenseActive: true,
    allowedDevices: [],
    lastSeenAt: null,
    createdAt: serverTimestamp(),
    createdBy: params.createdBy,
    notes: '',
  });
  return uid;
}

/**
 * تسجيل مستخدم جديد بنفسه
 * - المستخدم الأول يحصل تلقائياً على دور "مالك"
 * - إذا لم تكن app_settings/main موجودة تُنشأ تلقائياً
 *
 * منطق التحقق من "أول مستخدم":
 * نستخدم وثيقة app_meta/status التي يمكن قراءتها بدون تسجيل دخول
 * (تعريف Firestore rules يسمح بالقراءة العامة لهذه المجموعة)
 */
export async function registerUser(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<User> {
  // قراءة حالة التهيئة (لا تحتاج مصادقة)
  const metaRef = doc(db, 'app_meta', 'status');
  const metaSnap = await getDoc(metaRef);
  const isFirstUser = !metaSnap.exists() || metaSnap.data()?.initialized !== true;
  const role: UserRole = isFirstUser ? 'owner' : 'employee';

  // إنشاء حساب Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  const uid = cred.user.uid;

  // حفظ بيانات المستخدم في Firestore
  await setDoc(doc(db, 'users', uid), {
    fullName: params.fullName,
    email: params.email,
    phone: '',
    role,
    status: 'active',
    licenseActive: true,
    allowedDevices: [],
    lastSeenAt: null,
    createdAt: serverTimestamp(),
    createdBy: isFirstUser ? 'system' : uid,
    notes: '',
  });

  // إذا كان أول مستخدم → أنشئ الإعدادات وحدّث حالة التهيئة
  if (isFirstUser) {
    // إنشاء app_settings/main
    const settingsRef = doc(db, 'app_settings', 'main');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        appName: 'مخزن البنود الجمركية',
        exchangeRate: 750,
        factor5: 0.211,
        factor10: 0.265,
        factor25: 0.41,
        ownerPinHash: '',
        currencyCode: 'YER',
        defaultCountry: 'اليمن',
        licenseCheckHours: 24,
        allowOfflineMode: true,
        lastUpdatedAt: serverTimestamp(),
        lastUpdatedBy: uid,
      });
    }

    // تحديث علامة التهيئة (مرة واحدة فقط، لا تُحذف أبداً)
    await setDoc(metaRef, {
      initialized: true,
      initializedAt: serverTimestamp(),
      ownerUid: uid,
    });
  }

  return cred.user;
}

/** جلب بيانات المستخدم من Firestore */
export async function fetchUserData(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    ...data,
    lastSeenAt: data.lastSeenAt?.toDate() ?? null,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as AppUser;
}

/** تحديث آخر ظهور */
export async function updateLastSeen(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    lastSeenAt: serverTimestamp(),
  });
}

/** مراقب حالة المصادقة */
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    // Firebase غير مُهيأ، استدعاء الـ callback مباشرةً بـ null
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
