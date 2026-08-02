import type { ISODateString } from './common';
import type { PackingItem } from './event';

/**
 * `stations` — the live station catalogue shared with the PWA. Categories are
 * free text there (the PWA lets users add their own via
 * `settings.customStationCategories`), so this is a `string`, not a union.
 */
export interface StationCatalogue {
  id: string;
  name: string;
  category: string;
  description?: string;
  /** The template packing list cloned onto an event when this station is assigned. */
  defaultPackingList: PackingItem[];
  powerRequired?: string;
  helperCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type CatalogueSortField = 'name' | 'category' | 'itemsCount' | 'createdAt' | 'helperCount';

/** Declared as a type alias (not an interface) so it satisfies `Record<string, unknown>`. */
export type CatalogueFilters = {
  category?: string;
};

export interface CatalogueFormValues {
  name: string;
  category: string;
  description?: string;
  powerRequired?: string;
  helperCount: number;
}

export type CatalogueViewMode = 'grid' | 'table';
