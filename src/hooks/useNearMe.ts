import { useCallback, useState } from 'react';
import * as Location from 'expo-location';
import { useLocation } from '@/state/LocationProvider';
import { usePlaces } from '@/state/PlacesProvider';
import { viewportAround } from '@/api/search';

/** Resolves the device location and points the Places feed at it. */
export function useNearMe() {
  const { request } = useLocation();
  const { applyViewport } = usePlaces();
  const [loading, setLoading] = useState(false);

  const goNearMe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const coords = await request();
      if (!coords) return false;
      let country: string | undefined;
      try {
        const geo = await Location.reverseGeocodeAsync(coords);
        country = geo[0]?.isoCountryCode ?? undefined;
      } catch {
        // reverse geocode unavailable; fall back to default currency
      }
      applyViewport(viewportAround(coords.latitude, coords.longitude, 0.06), 'Near you', country);
      return true;
    } finally {
      setLoading(false);
    }
  }, [request, applyViewport]);

  return { goNearMe, loading };
}
