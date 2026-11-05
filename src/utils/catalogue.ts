import { matchesSearch, paginate, sortRows } from './table';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import type {
  CatalogueFilters,
  CatalogueSortField,
  ListQuery,
  Paginated,
  StationCatalogue,
} from '@/types';

/**
 * Search / filter / sort / paginate an already-loaded station list.
 *
 * The catalogue is read once and every list view is derived from that copy in
 * memory. Each station document carries its whole default packing list, so the
 * collection is large (~570 KB for 150 stations): re-reading it for every page,
 * sort or keystroke is what made the Catalogue screen sit on skeletons.
 */
export function queryStations(
  stations: StationCatalogue[],
  request: ListQuery<CatalogueFilters, CatalogueSortField>,
): Paginated<StationCatalogue> {
  const { search = '', filters, sort, page = 1, pageSize = DEFAULT_PAGE_SIZE } = request;

  const rows = stations
    .map((station) => ({ ...station, itemsCount: station.defaultPackingList.length }))
    .filter((station) => {
      if (filters?.category && filters.category !== 'all' && station.category !== filters.category) {
        return false;
      }
      return matchesSearch(station, search, ['name', 'category', 'description']);
    });

  const sorted = sort
    ? sortRows(rows, sort.field as keyof (typeof rows)[number], sort.direction)
    : rows;

  return paginate(sorted, page, pageSize);
}
