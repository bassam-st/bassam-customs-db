/**
 * تصدير واستيراد البيانات
 */
import type { Item } from '../types/item';
import type { Operation } from '../types/operation';
import type { AppSettings } from '../types/settings';

export interface BackupData {
  version: string;
  exportedAt: string;
  items: Item[];
  operations: Operation[];
  settings?: Partial<AppSettings>;
}

/** تصدير البيانات إلى ملف JSON */
export function exportToJson(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `customs-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** قراءة ملف JSON مرفوع */
export function readJsonFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        resolve(data);
      } catch {
        reject(new Error('ملف JSON غير صالح'));
      }
    };
    reader.onerror = () => reject(new Error('خطأ في قراءة الملف'));
    reader.readAsText(file);
  });
}

/** نص ملخص العملية */
export function buildOperationSummary(operation: Operation): string {
  const lines = [
    `═══ ملخص عملية جمركية ═══`,
    `رقم العملية: ${operation.operationNumber}`,
    `العميل: ${operation.customerName}`,
    `التاريخ: ${new Date(operation.createdAt).toLocaleDateString('ar-YE')}`,
    `سعر الصرف: ${operation.exchangeRateUsed}`,
    ``,
    ...(operation.lines?.map((l, i) =>
      `${i + 1}. ${l.itemNameSnapshot}\n   ${l.qty} ${l.unit} × ${l.usdPriceUsed}$ | ${l.categoryLabelUsed}\n   جمارك: ${l.lineCustomsYER.toLocaleString('ar')} ريال`
    ) ?? []),
    ``,
    `══════════════════`,
    `إجمالي USD: ${operation.totalUsd.toFixed(2)} $`,
    `إجمالي الجمارك: ${operation.totalCustomsYER.toLocaleString('ar')} ريال`,
  ];
  return lines.join('\n');
}
