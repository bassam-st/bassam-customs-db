/** نوع بيانات العمليات الجمركية */
import type { CategoryLabel } from './item';

export type OperationStatus = 'draft' | 'saved' | 'archived';

export interface OperationLine {
  id: string;
  itemId: string;
  itemNameSnapshot: string;
  hsCodeSnapshot: string;
  qty: number;
  unit: string;
  usdPriceUsed: number;
  categoryLabelUsed: CategoryLabel;
  categoryFactorUsed: number;
  lineTotalUsd: number;
  lineCustomsYER: number;
  notes: string;
  createdAt: Date;
}

export interface Operation {
  id: string;
  operationNumber: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  exchangeRateUsed: number;
  totalUsd: number;
  totalCustomsYER: number;
  itemCount: number;
  status: OperationStatus;
  lines?: OperationLine[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export type NewOperation = Omit<Operation, 'id' | 'createdAt' | 'updatedAt' | 'operationNumber'>;
