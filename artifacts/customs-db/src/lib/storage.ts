/**
 * التخزين المحلي - IndexedDB / localStorage
 */

const KEYS = {
  DRAFT: 'customs_draft',
  SETTINGS_CACHE: 'customs_settings_cache',
  USER_CACHE: 'customs_user_cache',
  EXCHANGE_RATE: 'customs_exchange_rate',
} as const;

/** حفظ مسودة العملية في التخزين المحلي */
export function saveDraft(draft: unknown): void {
  try {
    localStorage.setItem(KEYS.DRAFT, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

/** قراءة مسودة العملية من التخزين المحلي */
export function loadDraft<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEYS.DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** مسح المسودة */
export function clearDraft(): void {
  localStorage.removeItem(KEYS.DRAFT);
}

/** حفظ إعدادات مؤقتة في الكاش */
export function cacheSettings(settings: unknown): void {
  try {
    localStorage.setItem(KEYS.SETTINGS_CACHE, JSON.stringify({
      data: settings,
      cachedAt: Date.now(),
    }));
  } catch {
    // ignore
  }
}

/** قراءة الإعدادات المؤقتة (مع انتهاء الصلاحية بعد ساعة) */
export function getCachedSettings<T>(maxAgeMs = 60 * 60 * 1000): T | null {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS_CACHE);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

/** حفظ سعر الصرف الأخير */
export function cacheExchangeRate(rate: number): void {
  localStorage.setItem(KEYS.EXCHANGE_RATE, String(rate));
}

/** قراءة آخر سعر صرف محفوظ */
export function getCachedExchangeRate(): number | null {
  const v = localStorage.getItem(KEYS.EXCHANGE_RATE);
  if (!v) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
