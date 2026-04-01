/**
 * الصفحة الرئيسية - لوحة القيادة
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Package, Search, Calculator, ShoppingCart, ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { useAuth } from '../app/AuthContext';
import { useSettings } from '../app/SettingsContext';
import { useDraft } from '../app/DraftContext';
import { getAllItems, getOperations } from '../lib/firestore';
import type { Item } from '../types/item';
import type { Operation } from '../types/operation';
import { isEmployee } from '../lib/permissions';

interface Stats {
  total: number;
  cat5: number;
  cat10: number;
  cat25: number;
}

export default function HomePage() {
  const { appUser } = useAuth();
  const { settings } = useSettings();
  const { draft } = useDraft();
  const [stats, setStats] = useState<Stats>({ total: 0, cat5: 0, cat10: 0, cat25: 0 });
  const [latestOp, setLatestOp] = useState<Operation | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = appUser ? isEmployee({ uid: appUser.uid, role: appUser.role, status: appUser.status }) : false;

  useEffect(() => {
    const load = async () => {
      try {
        const [items, ops] = await Promise.all([
          getAllItems(),
          getOperations('saved'),
        ]);
        const active = items.filter((i: Item) => i.status === 'active');
        setStats({
          total: active.length,
          cat5: active.filter((i: Item) => i.categoryLabel === '5%').length,
          cat10: active.filter((i: Item) => i.categoryLabel === '10%').length,
          cat25: active.filter((i: Item) => i.categoryLabel === '25%').length,
        });
        if (ops.length > 0) setLatestOp(ops[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <PageHeader
        title={settings.appName}
        subtitle={`مرحباً ${appUser?.fullName ?? ''}`}
        actions={
          <button onClick={() => window.location.reload()} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <RefreshCw size={18} />
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        {/* إحصائيات البنود */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="إجمالي البنود"
            value={loading ? '...' : stats.total.toString()}
            icon={<Package size={20} />}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            title="سعر الصرف"
            value={`${settings.exchangeRate.toLocaleString('ar')} ر`}
            icon={<span className="text-base font-bold">💱</span>}
            color="bg-purple-50 text-purple-700"
          />
          <StatCard
            title="بنود 5%"
            value={loading ? '...' : stats.cat5.toString()}
            icon={<span className="text-sm font-bold">5%</span>}
            color="bg-green-50 text-green-700"
          />
          <StatCard
            title="بنود 10%"
            value={loading ? '...' : stats.cat10.toString()}
            icon={<span className="text-sm font-bold">10%</span>}
            color="bg-yellow-50 text-yellow-700"
          />
          <StatCard
            title="بنود 25%"
            value={loading ? '...' : stats.cat25.toString()}
            icon={<span className="text-sm font-bold">25%</span>}
            color="bg-red-50 text-red-700"
          />
          {draft.lines.length > 0 && (
            <StatCard
              title="المسودة الحالية"
              value={`${draft.lines.length} بند`}
              icon={<ShoppingCart size={20} />}
              color="bg-orange-50 text-orange-700"
              href="/draft"
            />
          )}
        </div>

        {/* آخر عملية */}
        {latestOp && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">آخر عملية محفوظة</h3>
            <Link href={`/operations/${latestOp.id}`}>
              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-xl p-2 -m-2 transition-colors">
                <div>
                  <p className="font-medium text-sm">{latestOp.operationNumber}</p>
                  <p className="text-xs text-muted-foreground">{latestOp.customerName || 'بدون اسم عميل'}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-primary">{latestOp.totalCustomsYER.toLocaleString('ar')} ر</p>
                  <p className="text-xs text-muted-foreground">{latestOp.itemCount} بند</p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* أزرار سريعة */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction href="/search" icon={<Search size={22} />} label="البحث عن بند" color="bg-blue-500" />
          <QuickAction href="/calculator" icon={<Calculator size={22} />} label="حاسبة الجمارك" color="bg-purple-500" />
          <QuickAction href="/draft" icon={<ShoppingCart size={22} />} label="المسودة الحالية" color="bg-orange-500" />
          <QuickAction href="/operations" icon={<ClipboardList size={22} />} label="سجل العمليات" color="bg-teal-500" />
          {canEdit && (
            <QuickAction href="/inventory/add" icon={<Plus size={22} />} label="إضافة بند جديد" color="bg-green-500" />
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({
  title, value, icon, color, href
}: {
  title: string; value: string; icon: React.ReactNode; color: string; href?: string;
}) {
  const content = (
    <div className={`bg-card rounded-2xl border border-border p-4 flex items-center gap-3 ${href ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{title}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function QuickAction({ href, icon, label, color }: {
  href: string; icon: React.ReactNode; label: string; color: string;
}) {
  return (
    <Link href={href}>
      <div className={`${color} text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity`}>
        {icon}
        <span className="text-sm font-semibold">{label}</span>
      </div>
    </Link>
  );
}
