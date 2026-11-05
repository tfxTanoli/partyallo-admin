import type { PackingItem, PackingLog, StationCatalogue } from '@/types';

/**
 * Builders for the documents the crew apps read. These mirror the PWA's
 * `utils/helpers.ts` (`generateId`, `expandStationPackingItems`) exactly — the
 * PWA and mobile app key per-station packing state off these ids, so an item
 * written here must be indistinguishable from one written there.
 */

/** Same shape as the PWA's `generateId`: `<epoch ms>-<7 base36 chars>`. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** A fresh per-slot id, so the same station assigned twice stays independent. */
export function newStationInstanceId(stationId: string): string {
  return `inst-${stationId}-${generateId()}`;
}

/** Drop the optional keys that only make sense once an item has been packed. */
function withoutPackingMarks(item: PackingItem): PackingItem {
  const { packedBy: _packedBy, packedAt: _packedAt, ...rest } = item;
  return rest;
}

/**
 * Clone a catalogue station's default packing list onto an event slot.
 *
 * A station with no default items still gets one "self" item, as in the PWA —
 * otherwise it would have nothing to group by and would vanish from the
 * event's packing list.
 */
export function expandStationPackingItems(
  station: StationCatalogue,
  stationInstanceId: string,
): PackingItem[] {
  const source: PackingItem[] =
    station.defaultPackingList.length > 0
      ? station.defaultPackingList
      : [
          {
            id: 'self',
            name: station.name,
            qty: 1,
            baseQty: 1,
            unit: 'pcs',
            category: 'default',
            isPacked: false,
            isLoaded: false,
            isFixed: true,
            isToPack: true,
          },
        ];

  return source.map((item) => ({
    ...withoutPackingMarks(item),
    id: `${station.id}-${item.id}-${generateId()}`,
    stationId: station.id,
    stationInstanceId,
    stationName: station.name,
    isPacked: false,
    isLoaded: false,
    isToPack: true,
  }));
}

/** The key the crew apps group a packing item under (instance id, else legacy name). */
export function stationInstanceKey(item: PackingItem): string {
  return item.stationInstanceId ?? item.stationName ?? 'Unassigned';
}

/**
 * Copy an event's packing list for a duplicated event.
 *
 * Keeps the setup — which items, quantities, notes and "to pack" choices — and
 * resets everything that records what happened at the original event: packed /
 * loaded flags and who packed them. Item ids and station slot ids are re-minted
 * so the copy can never share packing state with the original.
 */
export function duplicatePackingList(items: PackingItem[]): PackingItem[] {
  const instanceMap = new Map<string, string>();

  return items.map((item) => {
    let stationInstanceId = item.stationInstanceId;
    if (stationInstanceId) {
      let next = instanceMap.get(stationInstanceId);
      if (!next) {
        next = newStationInstanceId(item.stationId ?? 'station');
        instanceMap.set(stationInstanceId, next);
      }
      stationInstanceId = next;
    }

    return {
      ...withoutPackingMarks(item),
      id: `${item.stationId ?? 'custom'}-${generateId()}`,
      ...(stationInstanceId ? { stationInstanceId } : {}),
      isPacked: false,
      isLoaded: false,
    };
  });
}

export function buildLog(packerName: string, action: string): PackingLog {
  return { id: generateId(), timestamp: new Date().toISOString(), packerName, action };
}
