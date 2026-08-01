import type { Paginated, SortDirection } from '@/types';

/** Case-insensitive "does any of these fields contain the term" matcher. */
export function matchesSearch<T>(row: T, term: string, fields: (keyof T)[]): boolean {
  if (!term.trim()) return true;
  const needle = term.trim().toLowerCase();
  return fields.some((field) => {
    const value = row[field];
    return typeof value === 'string' || typeof value === 'number'
      ? String(value).toLowerCase().includes(needle)
      : false;
  });
}

export function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const factor = direction === 'asc' ? 1 : -1;

  if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (Number(a) - Number(b)) * factor;
  }

  const aStr = a == null ? '' : String(a);
  const bStr = b == null ? '' : String(b);

  const aTime = Date.parse(aStr);
  const bTime = Date.parse(bStr);
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && /\d{4}-\d{2}-\d{2}/.test(aStr)) {
    return (aTime - bTime) * factor;
  }

  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' }) * factor;
}

export function sortRows<T>(rows: T[], field: keyof T, direction: SortDirection): T[] {
  return [...rows].sort((a, b) => compareValues(a[field], b[field], direction));
}

export function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

/** Build the `1 … 4 5 6 … 12` page button model. */
export function buildPageRange(current: number, pageCount: number, siblings = 1): (number | '…')[] {
  const totalSlots = siblings * 2 + 5;
  if (pageCount <= totalSlots) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, pageCount);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < pageCount - 1;

  const range: (number | '…')[] = [1];
  if (showLeftEllipsis) range.push('…');

  for (let page = Math.max(2, left); page <= Math.min(pageCount - 1, right); page += 1) {
    range.push(page);
  }

  if (showRightEllipsis) range.push('…');
  range.push(pageCount);

  return range;
}
