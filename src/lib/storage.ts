import AsyncStorage from '@react-native-async-storage/async-storage';

/** Thin typed JSON wrapper around AsyncStorage. */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write failures (storage full / unavailable)
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const STORAGE_KEYS = {
  themeMode: 'ts.themeMode',
  onboardingDone: 'ts.onboardingDone',
  favorites: 'ts.favorites',
  recentSearches: 'ts.recentSearches',
  trips: 'ts.trips',
} as const;
