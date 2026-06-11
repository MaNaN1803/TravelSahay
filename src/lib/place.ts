import type { Place, PlaceType } from '@/types/place';
import { unsplash, IMG } from './images';

const FALLBACK_IMG = unsplash(IMG.hero, 800);

export function photoUrl(place?: Place | null, size: 'medium' | 'large' = 'medium') {
  const imgs = place?.photo?.images;
  return (
    imgs?.[size]?.url ?? imgs?.medium?.url ?? imgs?.large?.url ?? imgs?.original?.url ?? FALLBACK_IMG
  );
}

export function priceText(place?: Place | null) {
  return place?.price ?? place?.price_level ?? null;
}

/**
 * Display price using the active currency symbol.
 * - `price` is an API-localized range string (e.g. "₹95,365 - ₹157,353") → shown as-is.
 * - `price_level` is a tier of `$` signs (cheap→pricey) → re-symbolled to the active currency.
 */
export function priceLabel(place: Place | null | undefined, symbol: string): string | null {
  if (place?.price) return place.price;
  const lvl = place?.price_level;
  if (lvl) return lvl.replace(/\$/g, symbol.length === 1 ? symbol : '$');
  return null;
}

export function isOpen(place?: Place | null): boolean | null {
  if (place?.is_closed === true) return false;
  if (place?.open_now_text) return !/clos/i.test(place.open_now_text);
  return null;
}

export function coords(place?: Place | null) {
  const lat = place?.latitude ? Number(place.latitude) : NaN;
  const lng = place?.longitude ? Number(place.longitude) : NaN;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

export const TYPE_META: Record<
  PlaceType,
  { label: string; singular: string; icon: 'bed' | 'camera' | 'restaurant' }
> = {
  hotels: { label: 'Hotels', singular: 'Hotel', icon: 'bed' },
  attractions: { label: 'Attractions', singular: 'Attraction', icon: 'camera' },
  restaurants: { label: 'Restaurants', singular: 'Restaurant', icon: 'restaurant' },
};

export const ALL_TYPES: PlaceType[] = ['restaurants', 'hotels', 'attractions'];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Travel Advisor encodes time as minutes-from-midnight (e.g. 1110 = 18:30). */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatHours(place?: Place | null): { day: string; ranges: string }[] {
  const weeks = place?.hours?.week_ranges;
  if (!weeks || weeks.length === 0) return [];
  return weeks.slice(0, 7).map((ranges, i) => ({
    day: DAYS[i] ?? `Day ${i + 1}`,
    ranges:
      !ranges || ranges.length === 0
        ? 'Closed'
        : ranges.map((r) => `${minutesToTime(r.open_time)} – ${minutesToTime(r.close_time)}`).join(', '),
  }));
}

export function reviewText(r: { summary?: string; text?: string }): string {
  return r.text ?? r.summary ?? '';
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function formatDistance(km: number, unit: 'km' | 'mi' = 'km'): string {
  if (unit === 'mi') {
    const mi = km * 0.621371;
    return mi < 1 ? `${Math.round(mi * 5280)} ft` : `${mi.toFixed(1)} mi`;
  }
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
