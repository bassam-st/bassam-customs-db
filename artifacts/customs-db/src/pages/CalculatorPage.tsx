/**
 * صفحة حاسبة الجمارك
 */
import React, { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Calculator, Search, Copy, ShoppingCart, Check } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { CategoryBadge } from '../components/CategoryBadge';
import { useSettings } from '../app/SettingsContext';
import { useDraft } from '../app/DraftContext';
import { getItem, searchItems } from '../lib/firestore';
import { calculateCustoms, buildCalculationText, formatYER, formatUSD } from '../lib/calculations';
import type { Item, CategoryLabel } from '../types/item';

export default function CalculatorPage() {
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);
  const preItemId = params.get('itemId');

  const { settings } = useSettings();
  const { addLine } = useDraft();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [addedToDraft, setAddedToDraft] = useState(false);

  // تحميل بند مسبق من URL
  useEffect(() => {
    if (preItemId) {
      getItem(preItemId).then(item => {
        if (item) {
          setSelectedItem(item);
          setPriceOverride('');
        }
      });
    }
  }, [preItemId]);

  // بحث مع تأخير
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const items = await searchItems(searchQuery);
      setSearchResults(items.slice(0, 8));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const price = priceOverride ? parseFloat(priceOverride) || 0 : (selectedItem?.usdPrice ?? 0);
  const result = selectedItem
    ? calculateCustoms({
        usdPrice: price,
        qty,
        exchangeRate: settings.exchangeRate,
        categoryFactor: selectedItem.categoryFactor,
      })
    : null;

  const handleCopy = () => {
    if (!result || !selectedItem) return;
    const text = buildCalculationText({
      itemName: selectedItem.name,
      hsCode: selectedItem.hsCode,
      usdPrice: price,
      qty,
      unit: selectedItem.priceUnit,
      categoryLabel: selectedItem.categoryLabel,
      exchangeRate: settings.exchangeRate,
      totalUsd: result.totalUsd,
      customsYER: result.customsYER,
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleAddToDraft = () => {
    if (!selectedItem) return;
    addLine(selectedItem, qty, settings.exchangeRate, priceOverride ? parseFloat(priceOverride) : undefined);
    setAddedToDraft(true);
    setTimeout(() => setAddedToDraft(false), 2000);
  };

  return (
    <>
      <PageHeader title="حاسبة الجمارك" />
      <div className="p-4 flex flex-col gap-4">

        {/* اختيار البند */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold">اختر البند</h3>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="ابحث عن بند..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSelectedItem(null); }}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* نتائج البحث */}
          {searchResults.length > 0 && !selectedItem && (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setSearchQuery(item.name); setSearchResults([]); setPriceOverride(''); }}
                  className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted transition-colors text-right"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CategoryBadge label={item.categoryLabel} />
                      <span className="text-xs text-muted-foreground" dir="ltr">HS: {item.hsCode}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.usdPrice}$</span>
                </button>
              ))}
            </div>
          )}

          {/* البند المختار */}
          {selectedItem && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{selectedItem.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge label={selectedItem.categoryLabel} />
                    <span className="text-xs text-muted-foreground" dir="ltr">HS: {selectedItem.hsCode}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedItem(null); setSearchQuery(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                >
                  تغيير
                </button>
              </div>
            </div>
          )}
        </div>

        {/* المدخلات */}
        {selectedItem && (
          <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold">تفاصيل الحساب</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">الكمية</label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">الوحدة</label>
                <div className="rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                  {selectedItem.priceUnit}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">
                السعر (USD) - السعر الأساسي: {selectedItem.usdPrice}$
              </label>
              <input
                type="number"
                value={priceOverride}
                onChange={e => setPriceOverride(e.target.value)}
                placeholder={selectedItem.usdPrice.toString()}
                min="0"
                step="0.01"
                className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                dir="ltr"
              />
              {priceOverride && (
                <p className="text-xs text-yellow-600">⚠️ سعر مؤقت للعملية الحالية فقط</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">سعر الصرف (الريال مقابل الدولار)</label>
              <div className="rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground" dir="ltr">
                {settings.exchangeRate.toLocaleString('ar')}
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>الفئة</span>
                <CategoryBadge label={selectedItem.categoryLabel} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>العامل</span>
                <span dir="ltr">{selectedItem.categoryFactor}</span>
              </div>
            </div>
          </div>
        )}

        {/* النتيجة */}
        {result && selectedItem && (
          <div className="bg-primary rounded-2xl p-5 text-primary-foreground flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <Calculator size={20} />
              <span className="font-bold text-base">نتيجة الحساب</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">إجمالي USD</span>
              <span className="font-bold text-lg" dir="ltr">{formatUSD(result.totalUsd)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-80">الجمارك بالريال</span>
              <span className="font-bold text-2xl">{formatYER(result.customsYER)}</span>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl bg-white/20 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'تم النسخ' : 'نسخ النتيجة'}
              </button>
              <button
                onClick={handleAddToDraft}
                className="flex-1 py-2.5 rounded-xl bg-white/20 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
              >
                {addedToDraft ? <Check size={16} /> : <ShoppingCart size={16} />}
                {addedToDraft ? 'تمت الإضافة' : 'أضف للمسودة'}
              </button>
            </div>
          </div>
        )}

        {!selectedItem && (
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground gap-3">
            <Calculator size={48} className="opacity-30" />
            <p className="text-sm">اختر بنداً للبدء في الحساب</p>
          </div>
        )}
      </div>
    </>
  );
}
