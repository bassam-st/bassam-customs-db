/** نوع بيانات إعدادات التطبيق */
export interface AppSettings {
  appName: string;
  exchangeRate: number;
  factor5: number;
  factor10: number;
  factor25: number;
  ownerPinHash: string;
  currencyCode: string;
  defaultCountry: string;
  licenseCheckHours: number;
  allowOfflineMode: boolean;
  lastUpdatedAt: Date | null;
  lastUpdatedBy: string;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
}

export interface BackupMeta {
  id: string;
  fileName: string;
  createdAt: Date;
  createdBy: string;
  itemsCount: number;
  operationsCount: number;
  notes: string;
}
