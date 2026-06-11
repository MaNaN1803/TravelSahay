import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { listPlaces, DEFAULT_VIEWPORT } from '@/api/travelAdvisor';
import { resolveViewport } from '@/api/search';
import { isOpen, priceText, coords as placeCoords, distanceKm } from '@/lib/place';
import { storage } from '@/lib/storage';
import { currencyForCountry } from '@/lib/currency';
import { useSettings } from '@/state/SettingsProvider';
import { useLocation } from '@/state/LocationProvider';
import type { Place, PlaceType, Viewport } from '@/types/place';
import type { LocationSuggestion } from '@/types/place';

export type SortKey = 'recommended' | 'rating' | 'reviews' | 'name' | 'distance';

export type Filters = {
  minRating: number; // 0 = any
  price: number[]; // selected $ levels 1..4 ; empty = any
  openNow: boolean;
  sort: SortKey;
};

const DEFAULT_FILTERS: Filters = {
  minRating: 0,
  price: [],
  openNow: false,
  sort: 'recommended',
};

type PlacesContextValue = {
  type: PlaceType;
  setType: (t: PlaceType) => void;
  viewport: Viewport;
  locationLabel: string;
  /** ISO currency actually used for prices (resolved from location when 'auto'). */
  currency: string;
  setLocation: (s: LocationSuggestion) => Promise<void>;
  applyViewport: (vp: Viewport, label: string, countryCode?: string) => void;
  data: Place[];
  results: Place[]; // filtered + sorted
  loading: boolean;
  error: string | null;
  refresh: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  activeFilterCount: number;
};

const PlacesContext = createContext<PlacesContextValue | undefined>(undefined);

function priceLevelCount(p: Place): number {
  const t = priceText(p) ?? '';
  const dollars = (t.match(/\$/g) ?? []).length;
  return dollars; // 0 when unknown
}

function applyFilters(
  data: Place[],
  f: Filters,
  origin: { latitude: number; longitude: number } | null,
): Place[] {
  let out = data.filter((p) => {
    if (f.minRating > 0) {
      const r = p.rating ? parseFloat(p.rating) : 0;
      if (r < f.minRating) return false;
    }
    if (f.openNow && isOpen(p) === false) return false;
    if (f.price.length > 0) {
      const lvl = priceLevelCount(p);
      if (lvl === 0 || !f.price.includes(lvl)) return false;
    }
    return true;
  });

  const dist = (p: Place) => {
    const c = placeCoords(p);
    return origin && c ? distanceKm(origin, c) : Number.POSITIVE_INFINITY;
  };

  out = [...out].sort((a, b) => {
    switch (f.sort) {
      case 'rating':
        return (parseFloat(b.rating ?? '0') || 0) - (parseFloat(a.rating ?? '0') || 0);
      case 'reviews':
        return (parseInt(b.num_reviews ?? '0') || 0) - (parseInt(a.num_reviews ?? '0') || 0);
      case 'name':
        return (a.name ?? '').localeCompare(b.name ?? '');
      case 'distance':
        return dist(a) - dist(b);
      default:
        return 0;
    }
  });
  return out;
}

export function PlacesProvider({ children }: { children: ReactNode }) {
  const { currency: currencyPref, units } = useSettings();
  const { coords: myCoords } = useLocation();
  const [type, setTypeState] = useState<PlaceType>('restaurants');
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT);
  const [locationLabel, setLocationLabel] = useState('Indore, India');
  const [countryCode, setCountryCode] = useState<string | undefined>('IN');

  // 'auto' follows the searched destination's country; otherwise use the chosen currency.
  const currency = currencyPref === 'auto' ? currencyForCountry(countryCode) : currencyPref;
  const [data, setData] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    // Show cached results for this category immediately while the network loads.
    storage.get<Place[]>(`ts.cache.${type}`).then((cached) => {
      if (active && cached && data.length === 0) setData(cached);
    });
    listPlaces({ type, viewport, currency, unit: units })
      .then((list) => {
        if (active) {
          setData(list);
          if (list.length > 0) storage.set(`ts.cache.${type}`, list.slice(0, 30));
        }
      })
      .catch((e) => {
        if (active) {
          setError(e?.message ?? 'Something went wrong');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, viewport, reloadKey, currency, units]);

  const setType = useCallback((t: PlaceType) => setTypeState(t), []);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const setLocation = useCallback(async (s: LocationSuggestion) => {
    const resolved = await resolveViewport(s);
    if (resolved) {
      setViewport(resolved.viewport);
      setLocationLabel(s.subtitle ? `${s.title}, ${s.subtitle}` : s.title);
      setCountryCode(resolved.countryCode ?? s.countryCode);
    }
  }, []);

  const applyViewport = useCallback((vp: Viewport, label: string, country?: string) => {
    setViewport(vp);
    setLocationLabel(label);
    setCountryCode(country);
  }, []);

  const results = useMemo(
    () => applyFilters(data, filters, myCoords),
    [data, filters, myCoords],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.minRating > 0) n++;
    if (filters.price.length > 0) n++;
    if (filters.openNow) n++;
    if (filters.sort !== 'recommended') n++;
    return n;
  }, [filters]);

  const value = useMemo<PlacesContextValue>(
    () => ({
      type,
      setType,
      viewport,
      locationLabel,
      currency,
      setLocation,
      applyViewport,
      data,
      results,
      loading,
      error,
      refresh,
      filters,
      setFilters,
      activeFilterCount,
    }),
    [type, setType, viewport, locationLabel, currency, setLocation, applyViewport, data, results, loading, error, refresh, filters, activeFilterCount],
  );

  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): PlacesContextValue {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider');
  return ctx;
}

export { DEFAULT_FILTERS };
