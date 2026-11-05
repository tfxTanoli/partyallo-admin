import {
  STATION_STATUSES,
  type EventStationSummary,
  type PackingProgress,
  type PartyEvent,
  type StationStatus,
} from '@/types';

/** Items marked `isToPack: false` are excluded from every total — the PWA hides them. */
function packable(event: PartyEvent) {
  return event.packingList.filter((item) => item.isToPack);
}

/**
 * Rolls an event's packing list up into the numbers the detail page shows.
 * Everything here is derived — none of it is persisted.
 */
export function computePackingProgress(event: PartyEvent): PackingProgress {
  const items = packable(event);
  const itemsTotal = items.length;
  const itemsPacked = items.filter((item) => item.isPacked).length;
  const itemsLoaded = items.filter((item) => item.isLoaded).length;

  const stations = summariseStations(event);

  return {
    itemsTotal,
    itemsPacked,
    itemsLoaded,
    percentPacked: itemsTotal === 0 ? 0 : Math.round((itemsPacked / itemsTotal) * 100),
    percentLoaded: itemsTotal === 0 ? 0 : Math.round((itemsLoaded / itemsTotal) * 100),
    stationsTotal: stations.length,
    stationsComplete: stations.filter(
      (station) => station.itemsTotal > 0 && station.itemsPacked >= station.itemsTotal,
    ).length,
  };
}

/**
 * Groups the flat `packingList` into per-station rows.
 *
 * Grouping key is `stationInstanceId` so the same station assigned twice stays
 * two independent rows; older documents predate that field, so they fall back to
 * `stationName` exactly as the PWA does.
 */
export function summariseStations(event: PartyEvent): EventStationSummary[] {
  const groups = new Map<string, EventStationSummary>();

  for (const item of packable(event)) {
    const key = item.stationInstanceId ?? item.stationName ?? 'Unassigned';

    let group = groups.get(key);
    if (!group) {
      // The crew apps key per-station pax and status by catalogue station id
      // (shared by every slot of that station), not by instance key.
      const statusKey = item.stationId ?? key;
      // Stored values are not validated by the mapper; an unknown one must not
      // crash the status badge, so it falls back like a missing one.
      const storedStatus = event.stationStatuses[statusKey] ?? event.stationStatuses[key];
      group = {
        instanceId: key,
        stationId: item.stationId,
        name: item.stationName ?? 'Unassigned items',
        itemsTotal: 0,
        itemsPacked: 0,
        status:
          storedStatus && STATION_STATUSES.includes(storedStatus) ? storedStatus : 'Packing',
        servings: event.stationServings[statusKey] ?? event.stationServings[key],
      };
      groups.set(key, group);
    }

    group.itemsTotal += 1;
    if (item.isPacked) group.itemsPacked += 1;
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function stationPercent(itemsPacked: number, itemsTotal: number): number {
  return itemsTotal === 0 ? 0 : Math.round((itemsPacked / itemsTotal) * 100);
}

/** `Packing` → `Complete` progression, used to colour the timeline. */
export const STATUS_ORDER: StationStatus[] = ['Packing', 'Loading', 'Loaded', 'Complete'];

export function statusIndex(status: StationStatus): number {
  return Math.max(0, STATUS_ORDER.indexOf(status));
}
