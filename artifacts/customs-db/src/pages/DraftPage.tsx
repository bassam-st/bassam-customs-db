/**
 * صفحة المسودة (السلة / عملية قيد الإنشاء)
 */
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Trash2, ShoppingCart, Save, FileText, Plus, Minus } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { EmptyState } from '../components/LoadingScreen';
import { CategoryBadge } from '../components/CategoryBadge';
import { useDraft } from '../app/DraftContext';
import { useAuth } from '../app/AuthContext';
import { useSettings } from '../app/SettingsContext';
import { saveOperation } from '../lib/firestore';
import { buildOperationSummary } from '../lib/export';
import { formatYER, formatUSD } from '../lib/calculations';
import type { Operation, OperationLine } from '../types/operation';

export default function DraftPage() {
  const [, navigate] = useLocation();
  const { draft, updateLine, removeLine, clearLines, setCustomerName, setCustomerPhone, setDraftNotes, totalUsd, totalCustomsYER } = useDraft();
  const { appUser } = useAuth();
  const { settings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!appUser) return;
    if (draft.lines.length === 0) { setError('أضف بنداً على الأقل'); return; }
    setSaving(true);
    setError('');
    try {
      const opNumber = `OP-${Date.now()}`;
      const lines: Omit<OperationLine, 'id'>[] = draft.lines.map(l => ({
        itemId: l.itemId,
        itemNameSnapshot: l.itemName,
        hsCodeSnapshot: l.hsCode,
        qty: l.qty,
        unit: l.unit,
        usdPriceUsed: l.usdPrice,
        categoryLabelUsed: l.categoryLabel,
        categoryFactorUsed: l.categoryFactor,
        lineTotalUsd: l.lineTotalUsd,
        lineCustomsYER: l.lineCustomsYER,
        notes: l.notes,
        createdAt: new Date(),
      }));
      const opId = await saveOperation(
        {
          operationNumber: opNumber,
          customerName: draft.customerName,
          customerPhone: draft.customerPhone,
          notes: draft.notes,
          exchangeRateUsed: settings.exchangeRate,
          totalUsd,
          totalCustomsYER,
          itemCount: draft.lines.length,
          status: 'saved',
          createdBy: appUser.uid,
          updatedBy: appUser.uid,
        },
        lines,
        appUser.uid
      );
      clearLines();
      navigate(`/operations/${opId}`);
    } catch (err) {
      setError('فشل حفظ العملية');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportText = () => {
    const mockOp: Operation = {
      id: 'draft',
      operationNumber: 'مسودة',
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      notes: draft.notes,
      exchangeRateUsed: settings.exchangeRate,
      totalUsd,
      totalCustomsYER,
      itemCount: draft.lines.length,
      status: 'draft',
      lines: draft.lines.map((l, i) => ({
        id: String(i),
        itemId: l.itemId,
        itemNameSnapshot: l.itemName,
        hsCodeSnapshot: l.hsCode,
        qty: l.qty,
        unit: l.unit,
        usdPriceUsed: l.usdPrice,
        categoryLabelUsed: l.categoryLabel,
        categoryFactorUsed: l.categoryFactor,
        lineTotalUsd: l.lineTotalUsd,
        lineCustomsYER: l.lineCustomsYER,
        notes: l.notes,
        createdAt: new Date(),
      })),
      createdAt: new Date(),
      createdBy: appUser?.uid ?? '',
      updatedAt: new Date(),
      updatedBy: appUser?.uid ?? '',
    };
    const text = buildOperationSummary(mockOp);
    navigator.clipboard.writeText(text).catch(() => {});
    alert('تم نسخ الملخص');
  };

  return (
    <>
      <PageHeader
        title="المسودة الحالية"
        subtitle={draft.lines.length > 0 ? `${draft.lines.length} بند` : undefined}
        actions={
          draft.lines.length > 0 ? (
            <button onClick={() => { if (confirm('مسح كل البنود؟')) clearLines(); }} className="p-2 rounded-xl hover:bg-muted">
              <Trash2 size={18} className="text-destructive" />
            </button>
          ) : undefined
        }
      />

      <div className="p-4 flex flex-col gap-4 pb-8">
        {draft.lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={48} />}
            title="المسودة فارغة"
            subtitle="ابحث عن بند وأضفه للمسودة"
            action={
              <button
                onClick={() => navigate('/search')}
                className="mt-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 mx-auto"
              >
                <Plus size={16} /> إضافة بند
              </button>
            }
          />
        ) : (
          <>
            {/* معلومات العميل */}
            <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold">معلومات العميل</h3>
              <input
                type="text"
                placeholder="اسم العميل"
                value={draft.customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="tel"
                placeholder="رقم الهاتف"
                value={draft.customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="ملاحظات..."
                value={draft.notes}
                onChange={e => setDraftNotes(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
              />
            </div>

            {/* البنود */}
            <div className="flex flex-col gap-3">
              {draft.lines.map(line => (
                <div key={line.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{line.itemName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge label={line.categoryLabel} />
                        <span className="text-xs text-muted-foreground" dir="ltr">HS: {line.hsCode}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLine(line.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* التحكم في الكمية */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateLine(line.id, { qty: Math.max(1, line.qty - 1) }, settings.exchangeRate)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={line.qty}
                        onChange={e => updateLine(line.id, { qty: Math.max(1, parseInt(e.target.value) || 1) }, settings.exchangeRate)}
                        className="w-16 text-center rounded-lg border border-input bg-background py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        min="1"
                      />
                      <button
                        onClick={() => updateLine(line.id, { qty: line.qty + 1 }, settings.exchangeRate)}
                        className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="text-xs text-muted-foreground">{line.unit}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs text-muted-foreground">{line.usdPrice}$ × {line.qty}</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">الجمارك</span>
                    <span className="text-sm font-bold text-primary">{formatYER(line.lineCustomsYER)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* الإجمالي */}
            <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-80">إجمالي USD</span>
                <span className="font-bold">{formatUSD(totalUsd)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-80">إجمالي الجمارك</span>
                <span className="font-bold text-xl">{formatYER(totalCustomsYER)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            {/* أزرار الإجراءات */}
            <div className="flex gap-3">
              <button
                onClick={handleExportText}
                className="flex-1 py-3.5 rounded-2xl border border-border font-medium text-sm flex items-center justify-center gap-2"
              >
                <FileText size={18} /> نسخ الملخص
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'جاري الحفظ...' : 'حفظ العملية'}
              </button>
            </div>

            <button
              onClick={() => navigate('/search')}
              className="w-full py-3 rounded-2xl border border-dashed border-primary/50 text-primary text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} /> إضافة بند آخر
            </button>
          </>
        )}
      </div>
    </>
  );
}
