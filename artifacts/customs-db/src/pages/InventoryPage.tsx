/**
 * صفحة المخزن - قائمة البنود الجمركية
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Plus, Package, Filter } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { EmptyState } from '../components/LoadingScreen';
import { CategoryBadge } from '../components/CategoryBadge';
import { getAllItems } from '../lib/firestore';
import { useAuth } from '../app/AuthContext';
import { isEmployee } from '../lib/permissions';
import type { Item, CategoryLabel, ItemStatus } from '../types/item';

type FilterType = 'all' | CategoryLabel | ItemStatus;

export default function InventoryPage() {
  const [, navigate] = useLocation();
  const { appUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const canEdit = appUser ? isEmployee({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  useEffect(() => {
    getAllItems().then(data => {
      setItems(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    if (filter === 'all') return item.status !== 'blocked';
    if (filter === '5%' || filter === '10%' || filter === '25%') {
      return item.categoryLabel === filter && item.status === 'active';
    }
    return item.status === filter;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: '5%', label: 'فئة 5%' },
    { key: '10%', label: 'فئة 10%' },
    { key: '25%', label: 'فئة 25%' },
    { key: 'archived', label: 'مؤرشف' },
  ];

  return (
    <>
      <PageHeader
        title="المخزن"
        subtitle={`${items.filter(i => i.status === 'active').length} بند نشط`}
        actions={
          canEdit ? (
            <Link href="/inventory/add">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                <Plus size={16} /> جديد
              </button>
            </Link>
          ) : undefined
        }
      />

      <div className="p-4 flex flex-col gap-3">
        {/* الفلاتر */}
        <div className="flex gap-2 overflow-x-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<Package size={48} />}
            title="لا توجد بنود"
            subtitle={canEdit ? 'أضف أول بند جمركي' : 'لا توجد بنود في هذه الفئة'}
            action={canEdit ? (
              <Link href="/inventory/add">
                <button className="mt-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                  إضافة بند
                </button>
              </Link>
            ) : undefined}
          />
        )}

        <div className="flex flex-col gap-2">
          {filtered.map(item => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <CategoryBadge label={item.categoryLabel} />
                    {item.hsCode && (
                      <span className="text-xs text-muted-foreground" dir="ltr">HS: {item.hsCode}</span>
                    )}
                    {item.status !== 'active' && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {item.status === 'archived' ? 'مؤرشف' : 'محظور'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-primary text-sm">{item.usdPrice}$</p>
                  <p className="text-xs text-muted-foreground">{item.priceUnit}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
