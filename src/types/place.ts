export type PlaceType = 'hotels' | 'attractions' | 'restaurants';

export type Viewport = {
  bl_latitude: number;
  bl_longitude: number;
  tr_latitude: number;
  tr_longitude: number;
};

export type PlacePhoto = {
  images?: {
    small?: { url?: string };
    thumbnail?: { url?: string };
    medium?: { url?: string };
    large?: { url?: string };
    original?: { url?: string };
  };
};

export type Cuisine = { key?: string; name?: string };

export type Review = {
  title?: string;
  rating?: string;
  summary?: string;
  text?: string;
  published_date?: string;
  author?: string;
  url?: string;
};

export type DayRange = { open_time: number; close_time: number };

export type Hours = {
  week_ranges?: DayRange[][];
  timezone?: string;
};

export type RatingHistogram = {
  count_1?: string;
  count_2?: string;
  count_3?: string;
  count_4?: string;
  count_5?: string;
};

/** Normalized place model used across the app (subset of Travel Advisor fields). */
export type Place = {
  location_id: string;
  name?: string;
  latitude?: string;
  longitude?: string;
  num_reviews?: string;
  location_string?: string;
  photo?: PlacePhoto;
  rating?: string;
  price_level?: string;
  price?: string;
  ranking?: string;
  is_closed?: boolean;
  open_now_text?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cuisine?: Cuisine[];
  sub_cuisine?: Cuisine[];
  dishes?: Cuisine[];
  dietary_restrictions?: Cuisine[];
  bearing?: string;
  category?: { key?: string; name?: string };
  subcategory?: { key?: string; name?: string }[];
  // enriched (get-details)
  reviews?: Review[];
  hours?: Hours;
  rating_histogram?: RatingHistogram;
  awards?: { display_name?: string; year?: string; images?: { large?: string } }[];
  web_url?: string;
  distance?: string;
  distance_string?: string;
  photo_count?: string;
  nearest_metro_station?: { name?: string }[];
};

/** A search suggestion returned by the location search provider. */
export type LocationSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  /** present when provider returns coordinates directly */
  latitude?: number;
  longitude?: number;
  /** Google place_id, resolved to a viewport on selection */
  googlePlaceId?: string;
  /** ISO-3166 alpha-2 country code, used to localise currency */
  countryCode?: string;
};

export type ResolvedLocation = {
  viewport: Viewport;
  countryCode?: string;
};
