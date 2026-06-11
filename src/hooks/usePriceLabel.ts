import { useCallback } from 'react';
import { usePlaces } from '@/state/PlacesProvider';
import { useFx } from '@/state/FxProvider';
import { currencySymbol } from '@/lib/currency';
import { convertPriceString } from '@/lib/fx';
import type { Place } from '@/types/place';

/**
 * Returns a formatter that renders a place's price in the active currency.
 * - `price` range → converted via live FX rates (works for saved items too).
 * - `price_level` tier → re-symbolled to the active currency.
 */
export function usePriceLabel() {
  const { currency } = usePlaces();
  const { rates } = useFx();

  return useCallback(
    (place: Place | null | undefined): string | null => {
      if (place?.price) return convertPriceString(place.price, currency, rates);
      const lvl = place?.price_level;
      if (lvl) {
        const sym = currencySymbol(currency);
        return lvl.replace(/\$/g, sym.length === 1 ? sym : '$');
      }
      return null;
    },
    [currency, rates],
  );
}
