import { useCallback, useEffect, useState } from 'react';
import { listPlaces } from '@/api/travelAdvisor';
import { usePlaces } from '@/state/PlacesProvider';
import { ALL_TYPES } from '@/lib/place';
import type { Place, PlaceType } from '@/types/place';

export type DiscoverItem = { place: Place; type: PlaceType };
export type DiscoverSection = { key: string; title: string; subtitle?: string; items: DiscoverItem[] };

type State = {
  loading: boolean;
  error: string | null;
  featured: DiscoverItem | null;
  sections: DiscoverSection[];
};

const TITLES: Record<PlaceType, { title: string; subtitle: string }> = {
  hotels: { title: 'Where to stay', subtitle: 'Top-rated hotels' },
  attractions: { title: 'Things to do', subtitle: 'Must-see attractions' },
  restaurants: { title: 'Where to eat', subtitle: 'Best places to dine' },
};

const rated = (p: Place) => parseFloat(p.rating ?? '0') || 0;
const reviewed = (p: Place) => parseInt(p.num_reviews ?? '0', 10) || 0;

export function useDiscover() {
  const { viewport, locationLabel, currency } = usePlaces();
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    featured: null,
    sections: [],
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all(
      ALL_TYPES.map((type) =>
        listPlaces({ type, viewport, limit: 30, currency })
          .then((places) => ({ type, places }))
          .catch(() => ({ type, places: [] as Place[] })),
      ),
    ).then((groups) => {
      if (!active) return;
      const all: DiscoverItem[] = groups.flatMap((g) =>
        g.places.map((place) => ({ place, type: g.type })),
      );

      if (all.length === 0) {
        setState({ loading: false, error: 'No places found here', featured: null, sections: [] });
        return;
      }

      const byRating = [...all].sort((a, b) => rated(b.place) - rated(a.place));
      const featured = byRating[0] ?? null;

      const trending = [...all]
        .sort((a, b) => reviewed(b.place) - reviewed(a.place))
        .slice(0, 12);

      const topRated = byRating.filter((i) => rated(i.place) >= 4).slice(0, 12);

      const perType: DiscoverSection[] = groups
        .filter((g) => g.places.length > 0)
        .map((g) => ({
          key: g.type,
          title: TITLES[g.type].title,
          subtitle: TITLES[g.type].subtitle,
          items: [...g.places].sort((a, b) => rated(b) - rated(a)).slice(0, 12).map((place) => ({ place, type: g.type })),
        }));

      const sections: DiscoverSection[] = [
        { key: 'trending', title: 'Trending now', subtitle: 'Most reviewed nearby', items: trending },
        { key: 'top', title: 'Top rated', subtitle: 'Loved by travelers', items: topRated },
        ...perType,
      ].filter((s) => s.items.length > 0);

      setState({ loading: false, error: null, featured, sections });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, reloadKey, currency]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, locationLabel, refresh };
}
