import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { useBackendSync } from '@/hooks/useBackendSync';
import type { Place, PlaceType } from '@/types/place';

export type TripStop = {
  id: string;
  type: PlaceType;
  place: Place;
  day: number; // 1-based
  addedAt: number;
};

export type Trip = {
  id: string;
  title: string;
  note?: string;
  days: number;
  stops: TripStop[];
  createdAt: number;
};

type TripsContextValue = {
  trips: Trip[];
  ready: boolean;
  createTrip: (title: string, days?: number) => Trip;
  renameTrip: (id: string, title: string) => void;
  deleteTrip: (id: string) => void;
  addDay: (id: string) => void;
  addStop: (tripId: string, place: Place, type: PlaceType, day?: number) => void;
  removeStop: (tripId: string, stopId: string) => void;
  moveStop: (tripId: string, stopId: string, day: number) => void;
  isInTrip: (tripId: string, placeId: string) => boolean;
};

const TripsContext = createContext<TripsContextValue | undefined>(undefined);

let counter = 0;
function uid() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.get<Trip[]>(STORAGE_KEYS.trips).then((t) => {
      if (t) setTrips(t);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: Trip[]) => {
    setTrips(next);
    storage.set(STORAGE_KEYS.trips, next);
  }, []);

  // keep trips synced with the backend for the signed-in user
  useBackendSync<Trip[]>('trips', trips, persist);

  const update = useCallback(
    (id: string, fn: (t: Trip) => Trip) => {
      setTrips((prev) => {
        const next = prev.map((t) => (t.id === id ? fn(t) : t));
        storage.set(STORAGE_KEYS.trips, next);
        return next;
      });
    },
    [],
  );

  const createTrip = useCallback(
    (title: string, days = 1) => {
      const trip: Trip = {
        id: uid(),
        title: title.trim() || 'My trip',
        days: Math.max(1, days),
        stops: [],
        createdAt: Date.now(),
      };
      setTrips((prev) => {
        const next = [trip, ...prev];
        storage.set(STORAGE_KEYS.trips, next);
        return next;
      });
      return trip;
    },
    [],
  );

  const renameTrip = useCallback(
    (id: string, title: string) => update(id, (t) => ({ ...t, title: title.trim() || t.title })),
    [update],
  );

  const deleteTrip = useCallback(
    (id: string) => setTrips((prev) => {
      const next = prev.filter((t) => t.id !== id);
      storage.set(STORAGE_KEYS.trips, next);
      return next;
    }),
    [],
  );

  const addDay = useCallback((id: string) => update(id, (t) => ({ ...t, days: t.days + 1 })), [update]);

  const addStop = useCallback(
    (tripId: string, place: Place, type: PlaceType, day = 1) =>
      update(tripId, (t) =>
        t.stops.some((s) => s.id === place.location_id)
          ? t
          : {
              ...t,
              stops: [
                ...t.stops,
                { id: place.location_id, type, place, day, addedAt: Date.now() },
              ],
            },
      ),
    [update],
  );

  const removeStop = useCallback(
    (tripId: string, stopId: string) =>
      update(tripId, (t) => ({ ...t, stops: t.stops.filter((s) => s.id !== stopId) })),
    [update],
  );

  const moveStop = useCallback(
    (tripId: string, stopId: string, day: number) =>
      update(tripId, (t) => ({
        ...t,
        stops: t.stops.map((s) => (s.id === stopId ? { ...s, day } : s)),
      })),
    [update],
  );

  const isInTrip = useCallback(
    (tripId: string, placeId: string) =>
      trips.find((t) => t.id === tripId)?.stops.some((s) => s.id === placeId) ?? false,
    [trips],
  );

  const value = useMemo<TripsContextValue>(
    () => ({
      trips,
      ready,
      createTrip,
      renameTrip,
      deleteTrip,
      addDay,
      addStop,
      removeStop,
      moveStop,
      isInTrip,
    }),
    [trips, ready, createTrip, renameTrip, deleteTrip, addDay, addStop, removeStop, moveStop, isInTrip],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips must be used within TripsProvider');
  return ctx;
}
