/**
 * صفحة تفاصيل عملية جمركية
 */
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { FileText, Archive, Printer, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { LoadingScreen } from '../components/LoadingScreen';
import { CategoryBadge } from '../components/CategoryBadge';
import { getOperation, updateOperationStatus } from '../lib/firestore';
import { formatYER, formatUSD } from '../lib/calculations';
import { buildOperationSummary } from '../lib/export';
import { useAuth } from '../app/AuthContext';
import type { Operation } from '../types/operation';

export default function OperationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { appUser } = useAuth();
  const [operation, setOperation] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getOperation(id).then(op => { setOperation(op); setLoading(false); });
  }, [id]);

  const handleArchive = async () => {
    if (!operation || !appUser) return;
    if (!confirm('هل تريد أرشفة هذه العملية؟')) return;
    await updateOperationStatus(operation.id, 'archived', appUser.uid);
    setOperation(prev => prev ? { ...prev, status: 'archived' } : null);
  };

  const handleCopySummary = () => {
    if (!operation) return;
    navigator.clipboard.writeText(buildOperationSummary(operation)).catch(() => {});
    alert('تم نسخ الملخص');
  };

  if (loading) return <LoadingScreen />;
  if (!operation) return <div className="p-6 text-center text-muted-foreground">العملية غير موجودة</div>;

  return (
    <>
      <PageHeader
        title={operation.operationNumber}
        actions={
          <div className="flex gap-2">
            <button onClick={handleCopySummary} className="p-2 rounded-xl hover:bg-muted"><FileText size={18} /></button>
            {operation.status !== 'archived' && (
              <button onClick={handleArchive} className="p-2 rounded-xl hover:bg-muted"><Archive size={18} /></button>
            )}
          </div>
        }
      />

      <div className="p-4 flex flex-col gap-4 pb-8">
        {/* المعلومات الرئيسية */}
        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="العميل" value={operation.customerName || 'غير محدد'} />
            <InfoField label="الهاتف" value={operation.customerPhone || '-'} />
            <InfoField label="التاريخ" value={new Date(operation.createdAt).toLocaleDateString('ar-YE')} />
            <InfoField label="سعر الصرف" value={operation.exchangeRateUsed.toLocaleString('ar')} />
          </div>
          {operation.notes && (
            <div>
              <p className="text-xs text-muted-foreground">ملاحظات</p>
              <p className="text-sm">{operation.notes}</p>
            </div>
          )}
        </div>

        {/* البنود */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold px-1">البنود ({operation.lines?.length ?? 0})</h3>
          {operation.lines?.map((line, i) => (
            <div key={line.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{line.itemNameSnapshot}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CategoryBadge label={line.categoryLabelUsed} />
                    <span className="text-xs text-muted-foreground" dir="ltr">HS: {line.hsCodeSnapshot}</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">#{i + 1}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{line.qty} {line.unit} × {line.usdPriceUsed}$</span>
                <span className="font-semibold text-foreground">{formatYER(line.lineCustomsYER)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* الإجمالي */}
        <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm opacity-80">إجمالي USD</span>
            <span className="font-bold">{formatUSD(operation.totalUsd)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80">إجمالي الجمارك</span>
            <span className="font-bold text-xl">{formatYER(operation.totalCustomsYER)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
