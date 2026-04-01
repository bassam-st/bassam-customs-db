/**
 * خدمات Firestore - CRUD للبيانات
 */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch,
  onSnapshot, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Item, NewItem, ItemStatus } from '../types/item';
import type { Operation, OperationLine } from '../types/operation';
import type { AppUser } from '../types/user';
import type { AppSettings, AuditLog } from '../types/settings';

// ─── إعدادات التطبيق ────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | null> {
  const snap = await getDoc(doc(db, 'app_settings', 'main'));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    ...d,
    lastUpdatedAt: d.lastUpdatedAt?.toDate() ?? null,
  } as AppSettings;
}

export async function saveSettings(settings: Partial<AppSettings>, uid: string): Promise<void> {
  await updateDoc(doc(db, 'app_settings', 'main'), {
    ...settings,
    lastUpdatedAt: serverTimestamp(),
    lastUpdatedBy: uid,
  });
}

export async function initSettings(settings: AppSettings): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'app_settings', 'main'), {
    ...settings,
    lastUpdatedAt: serverTimestamp(),
  });
}

// ─── البنود الجمركية ────────────────────────────────────────

function mapItem(id: string, data: Record<string, unknown>): Item {
  return {
    id,
    name: (data.name as string) ?? '',
    normalizedName: (data.normalizedName as string) ?? '',
    aliases: (data.aliases as string[]) ?? [],
    hsCode: (data.hsCode as string) ?? '',
    usdPrice: (data.usdPrice as number) ?? 0,
    priceUnit: (data.priceUnit as string) ?? 'قطعة',
    categoryLabel: (data.categoryLabel as Item['categoryLabel']) ?? '5%',
    categoryFactor: (data.categoryFactor as number) ?? 0.211,
    countryOfOrigin: (data.countryOfOrigin as string) ?? '',
    shortDescription: (data.shortDescription as string) ?? '',
    longDescription: (data.longDescription as string) ?? '',
    notes: (data.notes as string) ?? '',
    status: (data.status as ItemStatus) ?? 'active',
    isFavorite: (data.isFavorite as boolean) ?? false,
    usageCount: (data.usageCount as number) ?? 0,
    lastUsedAt: (data.lastUsedAt as { toDate: () => Date } | null)?.toDate() ?? null,
    lastPrice: (data.lastPrice as number | null) ?? null,
    lastPriceUpdatedAt: (data.lastPriceUpdatedAt as { toDate: () => Date } | null)?.toDate() ?? null,
    searchTokens: (data.searchTokens as string[]) ?? [],
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
    createdBy: (data.createdBy as string) ?? '',
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() ?? new Date(),
    updatedBy: (data.updatedBy as string) ?? '',
  };
}

/** بناء رموز البحث */
function buildSearchTokens(name: string, aliases: string[], hsCode: string): string[] {
  const tokens = new Set<string>();
  const addTokens = (str: string) => {
    const normalized = str.toLowerCase().trim();
    tokens.add(normalized);
    for (let i = 1; i <= normalized.length; i++) {
      tokens.add(normalized.slice(0, i));
    }
  };
  addTokens(name);
  aliases.forEach(a => addTokens(a));
  if (hsCode) addTokens(hsCode);
  return Array.from(tokens);
}

export async function getAllItems(): Promise<Item[]> {
  const snap = await getDocs(
    query(collection(db, 'items'), where('status', '!=', 'blocked'), orderBy('status'), orderBy('name'))
  );
  return snap.docs.map(d => mapItem(d.id, d.data() as Record<string, unknown>));
}

export async function getItem(id: string): Promise<Item | null> {
  const snap = await getDoc(doc(db, 'items', id));
  if (!snap.exists()) return null;
  return mapItem(snap.id, snap.data() as Record<string, unknown>);
}

export async function addItem(item: NewItem, uid: string): Promise<string> {
  const searchTokens = buildSearchTokens(item.name, item.aliases, item.hsCode);
  const normalizedName = item.name.toLowerCase().trim();
  const ref = await addDoc(collection(db, 'items'), {
    ...item,
    normalizedName,
    searchTokens,
    usageCount: 0,
    lastUsedAt: null,
    lastPrice: null,
    lastPriceUpdatedAt: null,
    createdAt: serverTimestamp(),
    createdBy: uid,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
  return ref.id;
}

export async function updateItem(id: string, updates: Partial<Item>, uid: string): Promise<void> {
  const extra: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  };
  if (updates.name || updates.aliases || updates.hsCode) {
    const current = await getItem(id);
    if (current) {
      extra.searchTokens = buildSearchTokens(
        updates.name ?? current.name,
        updates.aliases ?? current.aliases,
        updates.hsCode ?? current.hsCode
      );
      extra.normalizedName = (updates.name ?? current.name).toLowerCase().trim();
    }
  }
  await updateDoc(doc(db, 'items', id), { ...updates, ...extra });
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'items', id));
}

export async function searchItems(searchQuery: string): Promise<Item[]> {
  const q = searchQuery.toLowerCase().trim();
  if (!q) return getAllItems();
  const snap = await getDocs(
    query(
      collection(db, 'items'),
      where('searchTokens', 'array-contains', q),
      where('status', '==', 'active'),
      limit(50)
    )
  );
  return snap.docs.map(d => mapItem(d.id, d.data() as Record<string, unknown>));
}

export async function getFavoriteItems(): Promise<Item[]> {
  const snap = await getDocs(
    query(collection(db, 'items'), where('isFavorite', '==', true), where('status', '==', 'active'))
  );
  return snap.docs.map(d => mapItem(d.id, d.data() as Record<string, unknown>));
}

export async function getMostUsedItems(n = 10): Promise<Item[]> {
  const snap = await getDocs(
    query(collection(db, 'items'), where('status', '==', 'active'), orderBy('usageCount', 'desc'), limit(n))
  );
  return snap.docs.map(d => mapItem(d.id, d.data() as Record<string, unknown>));
}

export async function incrementUsage(id: string): Promise<void> {
  const { increment } = await import('firebase/firestore');
  await updateDoc(doc(db, 'items', id), {
    usageCount: increment(1),
    lastUsedAt: serverTimestamp(),
  });
}

// ─── العمليات ────────────────────────────────────────

function mapOperation(id: string, data: Record<string, unknown>): Operation {
  return {
    id,
    operationNumber: (data.operationNumber as string) ?? '',
    customerName: (data.customerName as string) ?? '',
    customerPhone: (data.customerPhone as string) ?? '',
    notes: (data.notes as string) ?? '',
    exchangeRateUsed: (data.exchangeRateUsed as number) ?? 0,
    totalUsd: (data.totalUsd as number) ?? 0,
    totalCustomsYER: (data.totalCustomsYER as number) ?? 0,
    itemCount: (data.itemCount as number) ?? 0,
    status: (data.status as Operation['status']) ?? 'draft',
    createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
    createdBy: (data.createdBy as string) ?? '',
    updatedAt: (data.updatedAt as { toDate: () => Date })?.toDate() ?? new Date(),
    updatedBy: (data.updatedBy as string) ?? '',
  };
}

export async function getOperations(status?: Operation['status']): Promise<Operation[]> {
  let q = status
    ? query(collection(db, 'operations'), where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(collection(db, 'operations'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapOperation(d.id, d.data() as Record<string, unknown>));
}

export async function getOperation(id: string): Promise<Operation | null> {
  const snap = await getDoc(doc(db, 'operations', id));
  if (!snap.exists()) return null;
  const op = mapOperation(snap.id, snap.data() as Record<string, unknown>);
  const linesSnap = await getDocs(collection(db, 'operations', id, 'lines'));
  op.lines = linesSnap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<OperationLine, 'id'>),
    createdAt: (d.data().createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
  }));
  return op;
}

export async function saveOperation(
  operation: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>,
  lines: Omit<OperationLine, 'id'>[],
  uid: string,
  existingId?: string
): Promise<string> {
  const batch = writeBatch(db);
  let opRef;
  if (existingId) {
    opRef = doc(db, 'operations', existingId);
    batch.update(opRef, { ...operation, updatedAt: serverTimestamp(), updatedBy: uid });
  } else {
    opRef = doc(collection(db, 'operations'));
    batch.set(opRef, {
      ...operation,
      createdAt: serverTimestamp(),
      createdBy: uid,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  }
  // حذف السطور القديمة
  if (existingId) {
    const oldLines = await getDocs(collection(db, 'operations', existingId, 'lines'));
    oldLines.docs.forEach(d => batch.delete(d.ref));
  }
  lines.forEach(line => {
    const lineRef = doc(collection(db, 'operations', opRef.id, 'lines'));
    batch.set(lineRef, { ...line, createdAt: serverTimestamp() });
  });
  await batch.commit();
  return opRef.id;
}

export async function updateOperationStatus(
  id: string,
  status: Operation['status'],
  uid: string
): Promise<void> {
  await updateDoc(doc(db, 'operations', id), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
}

// ─── المستخدمون ────────────────────────────────────────

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => {
    const data = d.data() as Record<string, unknown>;
    return {
      uid: d.id,
      ...data,
      lastSeenAt: (data.lastSeenAt as { toDate: () => Date } | null)?.toDate() ?? null,
      createdAt: (data.createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
    } as AppUser;
  });
}

export async function updateUserStatus(
  uid: string,
  status: AppUser['status'],
  byUid: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status, updatedBy: byUid });
}

export async function updateUserRole(
  uid: string,
  role: AppUser['role'],
  byUid: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role, updatedBy: byUid });
}

// ─── سجلات المراجعة ────────────────────────────────────────

export async function addAuditLog(
  log: Omit<AuditLog, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, 'audit_logs'), {
    ...log,
    createdAt: serverTimestamp(),
  });
}

export async function getAuditLogs(n = 100): Promise<AuditLog[]> {
  const snap = await getDocs(
    query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(n))
  );
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as Omit<AuditLog, 'id'>),
    createdAt: (d.data().createdAt as { toDate: () => Date })?.toDate() ?? new Date(),
  }));
}

// ─── مراقبة فورية ────────────────────────────────────────

export function watchItems(callback: (items: Item[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'items'), where('status', '!=', 'blocked'), orderBy('status'), orderBy('name')),
    snap => callback(snap.docs.map(d => mapItem(d.id, d.data() as Record<string, unknown>)))
  );
}
