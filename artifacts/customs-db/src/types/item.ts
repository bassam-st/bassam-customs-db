/** نوع بيانات البند الجمركي */
export type ItemStatus = 'active' | 'archived' | 'blocked';

export type CategoryLabel = '5%' | '10%' | '25%';

export interface Item {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  hsCode: string;
  usdPrice: number;
  priceUnit: string;
  categoryLabel: CategoryLabel;
  categoryFactor: number;
  countryOfOrigin: string;
  shortDescription: string;
  longDescription: string;
  notes: string;
  status: ItemStatus;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt: Date | null;
  lastPrice: number | null;
  lastPriceUpdatedAt: Date | null;
  searchTokens: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export type NewItem = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'normalizedName' | 'searchTokens' | 'usageCount'>;
