// Curated, verified Unsplash photo IDs. Build sized CDN URLs on demand.
const BASE = 'https://images.unsplash.com/photo-';

export function unsplash(id: string, width = 800, quality = 70): string {
  return `${BASE}${id}?w=${width}&q=${quality}&auto=format&fit=crop`;
}

export const IMG = {
  // onboarding
  onboardExplore: '1469854523086-cc02fe5d8800', // open road / travel
  onboardMap: '1488646953014-85cb44e25828', // adventure map vibe
  onboardSave: '1530789253388-582c481c54b0', // mountains / wanderlust
  // generic
  hero: '1502602898657-3e91760cbb34',
  restaurant: '1517248135467-4c7edcad34c4',
  hotel: '1566073771259-6a8506099945',
  attraction: '1530789253388-582c481c54b0',
  empty: '1488646953014-85cb44e25828',
} as const;

/** Fallback image for a place when the API gives none. */
export function placeholderFor(type: 'hotels' | 'attractions' | 'restaurants'): string {
  const id = type === 'hotels' ? IMG.hotel : type === 'restaurants' ? IMG.restaurant : IMG.attraction;
  return unsplash(id, 600);
}
