import type { Place, PlaceType } from '@/types/place';

// In-memory cache so navigating to details doesn't re-pass large objects
// through route params or force a refetch before first paint.
const cache = new Map<string, { place: Place; type: PlaceType }>();

export const placeCache = {
  set(place: Place, type: PlaceType) {
    cache.set(place.location_id, { place, type });
  },
  get(id: string) {
    return cache.get(id) ?? null;
  },
};
