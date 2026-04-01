/**
 * الهيكل الرئيسي للتطبيق - شريط التنقل السفلي
 */
import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home, Search, Package, Calculator, ShoppingCart,
  ClipboardList, Settings, Users, Database, Shield,
} from 'lucide-react';
import { useAuth } from '../app/AuthContext';
import { useDraft } from '../app/DraftContext';
import { isOwner, isEmployee } from '../lib/permissions';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  ownerOnly?: boolean;
  employeeOnly?: boolean;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { appUser } = useAuth();
  const { draft } = useDraft();

  const navItems: NavItem[] = [
    { href: '/', label: 'الرئيسية', icon: <Home size={22} /> },
    { href: '/search', label: 'بحث', icon: <Search size={22} /> },
    { href: '/calculator', label: 'حاسبة', icon: <Calculator size={22} /> },
    { href: '/draft', label: 'مسودة', icon: <ShoppingCart size={22} /> },
    { href: '/operations', label: 'العمليات', icon: <ClipboardList size={22} /> },
    { href: '/inventory', label: 'المخزن', icon: <Package size={22} />, employeeOnly: true },
    { href: '/settings', label: 'الإعدادات', icon: <Settings size={22} />, ownerOnly: true },
    { href: '/users', label: 'المستخدمون', icon: <Users size={22} />, ownerOnly: true },
    { href: '/backups', label: 'النسخ', icon: <Database size={22} />, ownerOnly: true },
  ];

  const visibleNav = navItems.filter(item => {
    if (!appUser) return false;
    if (item.ownerOnly && !isOwner({ uid: appUser.uid, role: appUser.role, status: appUser.status })) return false;
    if (item.employeeOnly && !isEmployee({ uid: appUser.uid, role: appUser.role, status: appUser.status })) return false;
    return true;
  });

  const draftCount = draft.lines.length;

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col">
      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* شريط التنقل السفلي */}
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-50">
        <div className="flex items-center overflow-x-auto scrollbar-none">
          {visibleNav.map(item => {
            const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] flex-1 relative transition-colors
                  ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="relative">
                  {item.icon}
                  {item.href === '/draft' && draftCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {draftCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** رأس الصفحة */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
