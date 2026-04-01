/**
 * سياق المسودة - العملية الجارية (السلة)
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Item, CategoryLabel } from '../types/item';
import { saveDraft, loadDraft, clearDraft } from '../lib/storage';
import { calculateCustoms } from '../lib/calculations';

export interface DraftLine {
  id: string;
  itemId: string;
  itemName: string;
  hsCode: string;
  qty: number;
  unit: string;
  usdPrice: number;
  categoryLabel: CategoryLabel;
  categoryFactor: number;
  lineTotalUsd: number;
  lineCustomsYER: number;
  notes: string;
}

interface Draft {
  customerName: string;
  customerPhone: string;
  notes: string;
  exchangeRate: number;
  lines: DraftLine[];
}

interface DraftContextType {
  draft: Draft;
  addLine: (item: Item, qty: number, exchangeRate: number, priceOverride?: number) => void;
  updateLine: (id: string, updates: Partial<DraftLine>, exchangeRate: number) => void;
  removeLine: (id: string) => void;
  clearLines: () => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setDraftNotes: (notes: string) => void;
  setExchangeRate: (rate: number) => void;
  totalUsd: number;
  totalCustomsYER: number;
}

const defaultDraft: Draft = {
  customerName: '',
  customerPhone: '',
  notes: '',
  exchangeRate: 250,
  lines: [],
};

const DraftContext = createContext<DraftContextType>({
  draft: defaultDraft,
  addLine: () => {},
  updateLine: () => {},
  removeLine: () => {},
  clearLines: () => {},
  setCustomerName: () => {},
  setCustomerPhone: () => {},
  setDraftNotes: () => {},
  setExchangeRate: () => {},
  totalUsd: 0,
  totalCustomsYER: 0,
});

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => {
    const saved = loadDraft<Draft>();
    return saved ?? defaultDraft;
  });

  // حفظ تلقائي عند كل تغيير
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const recalcLine = (line: DraftLine, exchangeRate: number): DraftLine => {
    const { totalUsd, customsYER } = calculateCustoms({
      usdPrice: line.usdPrice,
      qty: line.qty,
      exchangeRate,
      categoryFactor: line.categoryFactor,
    });
    return { ...line, lineTotalUsd: totalUsd, lineCustomsYER: customsYER };
  };

  const addLine = useCallback((item: Item, qty: number, exchangeRate: number, priceOverride?: number) => {
    const price = priceOverride ?? item.usdPrice;
    const { totalUsd, customsYER } = calculateCustoms({
      usdPrice: price, qty, exchangeRate, categoryFactor: item.categoryFactor,
    });
    const newLine: DraftLine = {
      id: `${item.id}-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      hsCode: item.hsCode,
      qty,
      unit: item.priceUnit,
      usdPrice: price,
      categoryLabel: item.categoryLabel,
      categoryFactor: item.categoryFactor,
      lineTotalUsd: totalUsd,
      lineCustomsYER: customsYER,
      notes: '',
    };
    setDraft(d => ({ ...d, lines: [...d.lines, newLine] }));
  }, []);

  const updateLine = useCallback((id: string, updates: Partial<DraftLine>, exchangeRate: number) => {
    setDraft(d => ({
      ...d,
      lines: d.lines.map(l => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        return recalcLine(updated, exchangeRate);
      }),
    }));
  }, []);

  const removeLine = useCallback((id: string) => {
    setDraft(d => ({ ...d, lines: d.lines.filter(l => l.id !== id) }));
  }, []);

  const clearLines = useCallback(() => {
    setDraft(defaultDraft);
    clearDraft();
  }, []);

  const totalUsd = draft.lines.reduce((s, l) => s + l.lineTotalUsd, 0);
  const totalCustomsYER = draft.lines.reduce((s, l) => s + l.lineCustomsYER, 0);

  return (
    <DraftContext.Provider value={{
      draft,
      addLine,
      updateLine,
      removeLine,
      clearLines,
      setCustomerName: (name) => setDraft(d => ({ ...d, customerName: name })),
      setCustomerPhone: (phone) => setDraft(d => ({ ...d, customerPhone: phone })),
      setDraftNotes: (notes) => setDraft(d => ({ ...d, notes })),
      setExchangeRate: (rate) => setDraft(d => ({
        ...d,
        exchangeRate: rate,
        lines: d.lines.map(l => recalcLine(l, rate)),
      })),
      totalUsd,
      totalCustomsYER,
    }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDraft() {
  return useContext(DraftContext);
}
