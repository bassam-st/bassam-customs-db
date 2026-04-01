/**
 * إعداد Firebase - تهيئة التطبيق
 * يمكن نقل هذا الملف إلى أي مستضيف خارج Replit
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// اقرأ الإعدادات من متغيرات البيئة
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** هل تم ضبط إعدادات Firebase */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'undefined' &&
    firebaseConfig.apiKey !== 'your-api-key-here'
  );
};

// تهيئة Firebase - تعمل فقط إذا توفرت الإعدادات الصحيحة
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    _app = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApps()[0];
    _db = getFirestore(_app);
    _auth = getAuth(_app);
  } catch (e) {
    console.error('Firebase initialization error:', e);
    _app = null;
    _db = null;
    _auth = null;
  }
}

export const app = _app;
export const db = _db as Firestore;
export const auth = _auth as Auth;
