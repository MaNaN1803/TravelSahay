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

const KEY = 'ts.settings';

export type Units = 'km' | 'mi';
export type ManualCurrency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED';
/** 'auto' follows the searched destination's country. */
export type Currency = 'auto' | ManualCurrency;

export type Settings = {
  units: Units;
  currency: Currency;
};

const DEFAULTS: Settings = { units: 'km', currency: 'auto' };

export const CURRENCY_SYMBOL: Record<ManualCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'AED ',
};

type SettingsContextValue = Settings & {
  setUnits: (u: Units) => void;
  setCurrency: (c: Currency) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    storage.get<Settings>(KEY).then((s) => s && setSettings({ ...DEFAULTS, ...s }));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.set(KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setUnits: (units) => update({ units }),
      setCurrency: (currency) => update({ currency }),
    }),
    [settings, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
