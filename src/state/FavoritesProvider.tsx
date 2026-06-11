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

export type Favorite = {
  id: string;
  type: PlaceType;
  place: Place;
  savedAt: number;
};

type FavoritesContextValue = {
  favorites: Favorite[];
  isFavorite: (id: string) => boolean;
  toggle: (place: Place, type: PlaceType) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.get<Favorite[]>(STORAGE_KEYS.favorites).then((saved) => {
      if (saved) setFavorites(saved);
      setReady(true);
    });
  }, []);

  const persist = useCallback((next: Favorite[]) => {
    setFavorites(next);
    storage.set(STORAGE_KEYS.favorites, next);
  }, []);

  // keep favorites synced with the backend for the signed-in user
  useBackendSync<Favorite[]>('favorites', favorites, persist);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites],
  );

  const toggle = useCallback(
    (place: Place, type: PlaceType) => {
      const id = place.location_id;
      const exists = favorites.some((f) => f.id === id);
      persist(
        exists
          ? favorites.filter((f) => f.id !== id)
          : [{ id, type, place, savedAt: Date.now() }, ...favorites],
      );
    },
    [favorites, persist],
  );

  const remove = useCallback(
    (id: string) => persist(favorites.filter((f) => f.id !== id)),
    [favorites, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, isFavorite, toggle, remove, clear, ready }),
    [favorites, isFavorite, toggle, remove, clear, ready],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
