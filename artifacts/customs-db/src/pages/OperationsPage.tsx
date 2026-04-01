/**
 * صفحة سجل العمليات الجمركية
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ClipboardList, Archive, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { EmptyState } from '../components/LoadingScreen';
import { getOperations } from '../lib/firestore';
import { formatYER } from '../lib/calculations';
import type { Operation } from '../types/operation';

type StatusFilter = 'all' | 'saved' | 'draft' | 'archived';

export default function OperationsPage() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('saved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const status = filter === 'all' ? undefined : filter;
    getOperations(status).then(data => {
      setOperations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  return (
    <>
      <PageHeader title="سجل العمليات" />
      <div className="p-4 flex flex-col gap-3">
        {/* الفلاتر */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'saved', label: 'المحفوظة', icon: <CheckCircle size={14} /> },
            { key: 'draft', label: 'المسودات', icon: <Clock size={14} /> },
            { key: 'archived', label: 'المؤرشفة', icon: <Archive size={14} /> },
            { key: 'all', label: 'الكل', icon: <ClipboardList size={14} /> },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as StatusFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {f.icon}{f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && operations.length === 0 && (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title="لا توجد عمليات"
            subtitle="العمليات المحفوظة ستظهر هنا"
          />
        )}

        <div className="flex flex-col gap-3">
          {operations.map(op => (
            <Link key={op.id} href={`/operations/${op.id}`}>
              <div className="bg-card rounded-2xl border border-border p-4 flex items-start justify-between cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm" dir="ltr">{op.operationNumber}</p>
                    <StatusBadge status={op.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{op.customerName || 'بدون اسم عميل'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(op.createdAt).toLocaleDateString('ar-YE')} · {op.itemCount} بند
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-primary text-sm">{formatYER(op.totalCustomsYER)}</p>
                  <p className="text-xs text-muted-foreground">{op.totalUsd.toFixed(2)} $</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: Operation['status'] }) {
  const styles = {
    saved: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-600',
  };
  const labels = { saved: 'محفوظة', draft: 'مسودة', archived: 'مؤرشفة' };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
