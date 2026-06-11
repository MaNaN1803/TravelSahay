import { router } from 'expo-router';
import { placeCache } from './placeCache';
import type { Place, PlaceType } from '@/types/place';

/** Cache the place then navigate to its details route. */
export function openPlace(place: Place, type: PlaceType) {
  placeCache.set(place, type);
  router.push(`/place/${type}/${place.location_id}`);
}
