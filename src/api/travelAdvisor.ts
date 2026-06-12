import { rapidClient, ApiError } from './client';
import { API_BASE } from './backend';
import type { Place, PlaceType, Viewport } from '@/types/place';

// Indore, India — sensible default region so the app shows data on first load.
export const DEFAULT_VIEWPORT: Viewport = {
  bl_latitude: 22.6130718985061,
  bl_longitude: 75.76570593509332,
  tr_latitude: 22.83487362107337,
  tr_longitude: 75.96199394895491,
};

export type ListParams = {
  type: PlaceType;
  viewport?: Viewport;
  limit?: number;
  currency?: string;
  unit?: 'km' | 'mi';
};

// Travel Advisor's hotel endpoints return 0 results on the free tier (they need a
// paid booking partner). Hotels are sourced from Google Places (lodging) via our
// backend proxy instead. Restaurants & attractions keep using Travel Advisor.
async function listHotels(viewport: Viewport, limit: number): Promise<Place[]> {
  const lat = (viewport.bl_latitude + viewport.tr_latitude) / 2;
  const lng = (viewport.bl_longitude + viewport.tr_longitude) / 2;
  const radius = Math.min(
    Math.max(((viewport.tr_latitude - viewport.bl_latitude) / 2) * 111000, 2000),
    40000,
  );
  try {
    const res = await fetch(
      `${API_BASE}/api/places/nearby?lat=${lat}&lng=${lng}&radius=${Math.round(radius)}&type=lodging`,
    );
    const json = await res.json();
    const list: Place[] = json?.data ?? [];
    return list.filter((p) => p?.location_id && p?.name).slice(0, limit);
  } catch (err) {
    throw new ApiError('Failed to load hotels', err);
  }
}

/** Fetch hotels / attractions / restaurants within a bounding box. */
export async function listPlaces({
  type,
  viewport = DEFAULT_VIEWPORT,
  limit = 30,
  currency = 'USD',
  unit = 'km',
}: ListParams): Promise<Place[]> {
  if (type === 'hotels') return listHotels(viewport, limit);
  try {
    const { data } = await rapidClient.get(`/${type}/list-in-boundary`, {
      params: {
        bl_latitude: String(viewport.bl_latitude),
        tr_latitude: String(viewport.tr_latitude),
        bl_longitude: String(viewport.bl_longitude),
        tr_longitude: String(viewport.tr_longitude),
        restaurant_tagcategory_standalone: '10591',
        restaurant_tagcategory: '10591',
        limit: String(limit),
        currency,
        open_now: 'false',
        lunit: unit,
        lang: 'en_US',
      },
    });
    const list: Place[] = data?.data ?? [];
    // API mixes in ad/sponsored rows without a location_id or name — drop them,
    // and de-duplicate (the same location_id can appear more than once).
    const seen = new Set<string>();
    return list.filter((p) => {
      if (!p || !p.location_id || !p.name || seen.has(p.location_id)) return false;
      seen.add(p.location_id);
      return true;
    });
  } catch (err) {
    throw new ApiError(`Failed to load ${type}`, err);
  }
}

// Hotels come from Google (place_id), so their details come from the same proxy.
async function getHotelDetails(placeId: string): Promise<Place | null> {
  try {
    const res = await fetch(`${API_BASE}/api/places/place-details?place_id=${encodeURIComponent(placeId)}`);
    const json = await res.json();
    return (json?.place as Place) ?? null;
  } catch {
    return null;
  }
}

/** Fetch rich details for a single place. */
export async function getPlaceDetails(
  type: PlaceType,
  locationId: string,
  currency = 'USD',
): Promise<Place | null> {
  if (type === 'hotels') return getHotelDetails(locationId);
  try {
    const { data } = await rapidClient.get(`/${type}/get-details`, {
      params: {
        location_id: locationId,
        currency,
        lang: 'en_US',
        lunit: 'km',
      },
    });
    // get-details returns the place object at the top level (not under `data`).
    if (!data || data.errors || !data.location_id) return null;
    return data as Place;
  } catch (err) {
    throw new ApiError('Failed to load place details', err);
  }
}

/** Fetch a gallery of photo URLs for a place. */
export async function getPlacePhotos(locationId: string, limit = 8): Promise<string[]> {
  // Google-sourced places (hotels) have non-numeric ids — use the Google proxy.
  if (!/^\d+$/.test(locationId)) {
    try {
      const res = await fetch(`${API_BASE}/api/places/place-details?place_id=${encodeURIComponent(locationId)}`);
      const json = await res.json();
      return (json?.photos ?? []).slice(0, limit);
    } catch {
      return [];
    }
  }
  try {
    const { data } = await rapidClient.get('/photos/list', {
      params: { location_id: locationId, limit: String(limit), currency: 'USD', lang: 'en_US' },
    });
    const items: any[] = data?.data ?? [];
    return items
      .map((p) => p?.images?.original?.url ?? p?.images?.large?.url ?? p?.images?.medium?.url)
      .filter((u): u is string => typeof u === 'string');
  } catch {
    return [];
  }
}
