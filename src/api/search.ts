import axios from 'axios';
import { ENV, hasGoogleMaps } from '@/lib/env';
import { rapidClient } from './client';
import type { LocationSuggestion, Viewport, ResolvedLocation } from '@/types/place';

/** Best-effort: last word of a Tripadvisor location_string is usually the country. */
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  india: 'IN', 'united states': 'US', usa: 'US', 'united kingdom': 'GB', uk: 'GB',
  'united arab emirates': 'AE', uae: 'AE', france: 'FR', germany: 'DE', spain: 'ES',
  italy: 'IT', japan: 'JP', china: 'CN', singapore: 'SG', thailand: 'TH', australia: 'AU',
  canada: 'CA', 'saudi arabia': 'SA', qatar: 'QA', netherlands: 'NL', switzerland: 'CH',
};

function guessCountryCode(text?: string): string | undefined {
  if (!text) return undefined;
  const last = text.split(',').pop()?.trim().toLowerCase();
  return last ? COUNTRY_NAME_TO_CODE[last] : undefined;
}

const GOOGLE_BASE = 'https://maps.googleapis.com/maps/api/place';

/**
 * Autocomplete a place query. Uses Google Places when a key is configured
 * (best typeahead); otherwise falls back to Travel Advisor's location search.
 */
export async function searchLocations(
  query: string,
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return hasGoogleMaps ? googleAutocomplete(q) : travelAdvisorSearch(q);
}

async function googleAutocomplete(q: string): Promise<LocationSuggestion[]> {
  try {
    const { data } = await axios.get(`${GOOGLE_BASE}/autocomplete/json`, {
      params: { input: q, types: '(cities)', key: ENV.googleMapsApiKey },
      timeout: 15000,
    });
    if (data?.status !== 'OK' && data?.status !== 'ZERO_RESULTS') return [];
    return (data?.predictions ?? []).map((p: any) => ({
      id: p.place_id,
      title: p.structured_formatting?.main_text ?? p.description,
      subtitle: p.structured_formatting?.secondary_text,
      googlePlaceId: p.place_id,
      countryCode: guessCountryCode(p.structured_formatting?.secondary_text ?? p.description),
    }));
  } catch {
    return [];
  }
}

async function travelAdvisorSearch(q: string): Promise<LocationSuggestion[]> {
  try {
    const { data } = await rapidClient.get('/locations/search', {
      params: { query: q, limit: '10', lang: 'en_US', units: 'km' },
    });
    return (data?.data ?? [])
      .filter((r: any) => r.result_object?.name && r.result_object?.latitude)
      .map((r: any) => {
        const o = r.result_object;
        return {
          id: String(o.location_id),
          title: o.name,
          subtitle: o.location_string,
          latitude: Number(o.latitude),
          longitude: Number(o.longitude),
          countryCode: guessCountryCode(o.location_string),
        } as LocationSuggestion;
      });
  } catch {
    return [];
  }
}

/** Resolve a suggestion to a bounding-box viewport (+ country) for list-in-boundary. */
export async function resolveViewport(
  s: LocationSuggestion,
): Promise<ResolvedLocation | null> {
  if (s.googlePlaceId && hasGoogleMaps) {
    const resolved = await googleViewport(s.googlePlaceId);
    if (resolved) return { ...resolved, countryCode: resolved.countryCode ?? s.countryCode };
  }
  if (s.latitude != null && s.longitude != null) {
    return { viewport: viewportAround(s.latitude, s.longitude), countryCode: s.countryCode };
  }
  return null;
}

async function googleViewport(placeId: string): Promise<ResolvedLocation | null> {
  try {
    const { data } = await axios.get(`${GOOGLE_BASE}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'geometry,address_component',
        key: ENV.googleMapsApiKey,
      },
      timeout: 15000,
    });
    const result = data?.result;
    const country = (result?.address_components ?? []).find((c: any) =>
      (c.types ?? []).includes('country'),
    )?.short_name as string | undefined;

    const vp = result?.geometry?.viewport;
    if (!vp) {
      const loc = result?.geometry?.location;
      return loc ? { viewport: viewportAround(loc.lat, loc.lng), countryCode: country } : null;
    }
    return {
      viewport: {
        bl_latitude: vp.southwest.lat,
        bl_longitude: vp.southwest.lng,
        tr_latitude: vp.northeast.lat,
        tr_longitude: vp.northeast.lng,
      },
      countryCode: country,
    };
  } catch {
    return null;
  }
}

/** ~12km box around a point, for providers that only give a center. */
export function viewportAround(lat: number, lng: number, deltaDeg = 0.11): Viewport {
  return {
    bl_latitude: lat - deltaDeg,
    bl_longitude: lng - deltaDeg,
    tr_latitude: lat + deltaDeg,
    tr_longitude: lng + deltaDeg,
  };
}

export function viewportCenter(v: Viewport) {
  return {
    latitude: (v.bl_latitude + v.tr_latitude) / 2,
    longitude: (v.bl_longitude + v.tr_longitude) / 2,
    latitudeDelta: Math.abs(v.tr_latitude - v.bl_latitude) * 1.4 || 0.2,
    longitudeDelta: Math.abs(v.tr_longitude - v.bl_longitude) * 1.4 || 0.2,
  };
}
