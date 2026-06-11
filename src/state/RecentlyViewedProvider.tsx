import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storage } from '@/lib/storage';
import type { Place, PlaceType } from '@/types/place';

const KEY = 'ts.recentlyViewed';
const MAX = 20;

export type ViewedPlace = { id: string; type: PlaceType; place: Place; viewedAt: number };

type RecentlyViewedContextValue = {
  recent: ViewedPlace[];
  track: (place: Place, type: PlaceType) => void;
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<ViewedPlace[]>([]);

  useEffect(() => {
    storage.get<ViewedPlace[]>(KEY).then((r) => r && setRecent(r));
  }, []);

  const track = useCallback((place: Place, type: PlaceType) => {
    setRecent((prev) => {
      const next = [
        { id: place.location_id, type, place, viewedAt: Date.now() },
        ...prev.filter((r) => r.id !== place.location_id),
      ].slice(0, MAX);
      storage.set(KEY, next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    storage.set(KEY, []);
  }, []);

  const value = useMemo(() => ({ recent, track, clear }), [recent, track, clear]);
  return (
    <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
