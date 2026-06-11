import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

type LocationContextValue = {
  coords: Coords | null;
  loading: boolean;
  /** Requests permission + current position. Returns coords or null. */
  request: () => Promise<Coords | null>;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(async (): Promise<Coords | null> => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      return c;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ coords, loading, request }), [coords, loading, request]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
