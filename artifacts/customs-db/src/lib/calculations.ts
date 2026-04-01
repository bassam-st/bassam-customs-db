/**
 * حسابات الجمارك
 * المعادلة: customsYER = usdPrice * qty * exchangeRate * categoryFactor
 */
import type { CategoryLabel } from '../types/item';

/** العوامل الافتراضية لكل فئة */
export const DEFAULT_FACTORS: Record<CategoryLabel, number> = {
  '5%': 0.211,
  '10%': 0.265,
  '25%': 0.41,
};

/**
 * حساب الجمارك بالريال اليمني
 */
export function calculateCustoms(params: {
  usdPrice: number;
  qty: number;
  exchangeRate: number;
  categoryFactor: number;
}): { totalUsd: number; customsYER: number } {
  const { usdPrice, qty, exchangeRate, categoryFactor } = params;
  const totalUsd = usdPrice * qty;
  const customsYER = totalUsd * exchangeRate * categoryFactor;
  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    customsYER: Math.round(customsYER),
  };
}

/**
 * تنسيق العملة للعرض
 */
export function formatYER(amount: number): string {
  return new Intl.NumberFormat('ar-YE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ريال';
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('ar', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' $';
}

/**
 * نص ملخص الحساب للنسخ
 */
export function buildCalculationText(params: {
  itemName: string;
  hsCode: string;
  usdPrice: number;
  qty: number;
  unit: string;
  categoryLabel: CategoryLabel;
  exchangeRate: number;
  totalUsd: number;
  customsYER: number;
}): string {
  const { itemName, hsCode, usdPrice, qty, unit, categoryLabel, exchangeRate, totalUsd, customsYER } = params;
  return [
    `📦 البند: ${itemName}`,
    `🔢 HS Code: ${hsCode}`,
    `💵 السعر: ${usdPrice} دولار / ${unit}`,
    `📊 الكمية: ${qty} ${unit}`,
    `🏷️ الفئة: ${categoryLabel}`,
    `💱 سعر الصرف: ${exchangeRate}`,
    `═══════════════════`,
    `💰 إجمالي USD: ${formatUSD(totalUsd)}`,
    `🧮 الجمارك YER: ${formatYER(customsYER)}`,
  ].join('\n');
}
