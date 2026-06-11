import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { storage } from '@/lib/storage';
import { RATES_API } from '@/lib/fx';

const KEY = 'ts.fxRates';
const TTL = 12 * 60 * 60 * 1000; // 12h

type Cached = { rates: Record<string, number>; fetchedAt: number };

type FxContextValue = {
  rates: Record<string, number> | null;
  ready: boolean;
};

const FxContext = createContext<FxContextValue>({ rates: null, ready: false });

export function FxProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await storage.get<Cached>(KEY);
      if (cached?.rates) {
        if (active) setRates(cached.rates);
      }
      const fresh = !cached || Date.now() - cached.fetchedAt > TTL;
      if (fresh) {
        try {
          const res = await fetch(RATES_API);
          const json = await res.json();
          if (json?.result === 'success' && json.rates) {
            if (active) setRates(json.rates);
            storage.set(KEY, { rates: json.rates, fetchedAt: Date.now() });
          }
        } catch {
          // keep cached / null
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ rates, ready }), [rates, ready]);
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export function useFx(): FxContextValue {
  return useContext(FxContext);
}
