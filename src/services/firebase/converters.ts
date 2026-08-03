import { Timestamp } from 'firebase/firestore';
import type { ISODateString } from '@/types';

/**
 * The PWA writes timestamps as ISO **strings**, not Firestore `Timestamp`s.
 * This normalises whichever form a document happens to carry, so app code only
 * ever deals with ISO strings.
 */
export function toIso(value: unknown, fallback = ''): ISODateString {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.length > 0) return value;
  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = (value as { seconds: number }).seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  }
  return fallback;
}

export function nowIso(): ISODateString {
  return new Date().toISOString();
}

/** Plain objects are safe to rebuild; `Date`, `Timestamp` and `FieldValue` are not. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Firestore rejects `undefined`; strip those keys before any write.
 *
 * This walks nested objects and arrays: mappers deliberately return `undefined`
 * for absent optional fields (see `mapPackingItem`), so a document round-tripped
 * through a mapper carries `undefined` deep inside arrays like
 * `defaultPackingList` — a top-level strip alone leaves those in place and the
 * write throws.
 */
export function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return stripUndefinedDeep(input) as Partial<T>;
}

function stripUndefinedDeep(value: unknown): unknown {
  // Firestore rejects `undefined` array elements too, and a hole is never intentional.
  if (Array.isArray(value)) {
    return value.filter((entry) => entry !== undefined).map(stripUndefinedDeep);
  }
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefinedDeep(entry)]),
  );
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asRecord<T>(value: unknown): Record<string, T> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, T>)
    : {};
}

/** Narrow an arbitrary value to one of a known union, falling back if it is not. */
export function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}
