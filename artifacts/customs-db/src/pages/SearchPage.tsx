/**
 * صفحة البحث عن البنود الجمركية
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, Star, Clock, BarChart2, Package } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { CategoryBadge } from '../components/CategoryBadge';
import { EmptyState } from '../components/LoadingScreen';
import { searchItems, getFavoriteItems, getMostUsedItems } from '../lib/firestore';
import type { Item } from '../types/item';

type Tab = 'search' | 'favorites' | 'recent';

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('search');
  const [results, setResults] = useState<Item[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [mostUsed, setMostUsed] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // تحميل المفضلة والأكثر استخداماً
  useEffect(() => {
    getFavoriteItems().then(setFavorites).catch(() => {});
    getMostUsedItems(10).then(setMostUsed).catch(() => {});
  }, []);

  // بحث مع تأخير
  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const items = await searchItems(q);
      setResults(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const displayItems = tab === 'search'
    ? (query.trim() ? results : mostUsed)
    : tab === 'favorites' ? favorites : mostUsed;

  return (
    <>
      <PageHeader title="بحث البنود الجمركية" />

      <div className="p-4 flex flex-col gap-3">
        {/* مربع البحث */}
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="ابحث بالاسم، HS Code، المنشأ..."
            value={query}
            onChange={e => { setQuery(e.target.value); setTab('search'); }}
            className="w-full pr-10 pl-4 py-3 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* تبويبات */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'search', label: 'نتائج البحث', icon: <Search size={14} /> },
            { key: 'favorites', label: 'المفضلة', icon: <Star size={14} /> },
            { key: 'recent', label: 'الأكثر استخداماً', icon: <BarChart2 size={14} /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as Tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* النتائج */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && displayItems.length === 0 && (
          <EmptyState
            icon={<Package size={48} />}
            title={query.trim() ? 'لا توجد نتائج' : 'ابدأ البحث'}
            subtitle={query.trim() ? `لا يوجد ما يطابق "${query}"` : 'اكتب للبحث عن بند جمركي'}
          />
        )}

        <div className="flex flex-col gap-2">
          {displayItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}

function ItemCard({ item }: { item: Item }) {
  return (
    <Link href={`/items/${item.id}`}>
      <div className="bg-card rounded-2xl border border-border p-4 flex items-start gap-3 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <p className="font-semibold text-sm text-foreground truncate flex-1">{item.name}</p>
            {item.isFavorite && <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge label={item.categoryLabel} />
            {item.hsCode && (
              <span className="text-xs text-muted-foreground" dir="ltr">HS: {item.hsCode}</span>
            )}
            {item.countryOfOrigin && (
              <span className="text-xs text-muted-foreground">🌍 {item.countryOfOrigin}</span>
            )}
          </div>
          {item.shortDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.shortDescription}</p>
          )}
        </div>
        <div className="text-left shrink-0">
          <p className="font-bold text-primary text-sm">{item.usdPrice} $</p>
          <p className="text-xs text-muted-foreground">{item.priceUnit}</p>
        </div>
      </div>
    </Link>
  );
}
