import type { ISODateString } from './common';

/**
 * `purchases` — the shared purchase registry the crew app maintains.
 * `category` and `supplier` are free text there (driven by
 * `settings.customPurchaseCategories` / `customSuppliers`), so they stay
 * `string` rather than a union.
 */
export interface PurchaseItem {
  id: string;
  name: string;
  qtyNeeded: number;
  unit: string;
  notes?: string;
  /** `yyyy-MM-dd`, matching how the crew app's date input stores it. */
  requiredDate?: string;
  category: string;
  supplier: string;
  purchased: boolean;
  createdAt: ISODateString;
}

export type PurchaseSortField =
  | 'name'
  | 'category'
  | 'supplier'
  | 'qtyNeeded'
  | 'requiredDate'
  | 'createdAt';

/** Declared as a type alias (not an interface) so it satisfies `Record<string, unknown>`. */
export type PurchaseFilters = {
  /** `outstanding` and `purchased` map onto the `purchased` boolean. */
  state?: 'all' | 'outstanding' | 'purchased' | 'overdue';
  category?: string;
  supplier?: string;
};

export interface PurchaseFormValues {
  name: string;
  qtyNeeded: number;
  unit: string;
  category: string;
  supplier: string;
  requiredDate?: string;
  notes?: string;
  purchased: boolean;
}

/** Headline numbers for the purchases screen. */
export interface PurchaseSummary {
  total: number;
  outstanding: number;
  purchased: number;
  overdue: number;
}
