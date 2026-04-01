/**
 * شارة الفئة الجمركية بألوان مميزة
 */
import React from 'react';
import type { CategoryLabel } from '../types/item';

const COLORS: Record<CategoryLabel, string> = {
  '5%': 'bg-green-100 text-green-800 border-green-200',
  '10%': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '25%': 'bg-red-100 text-red-800 border-red-200',
};

export function CategoryBadge({ label }: { label: CategoryLabel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${COLORS[label]}`}>
      {label}
    </span>
  );
}
