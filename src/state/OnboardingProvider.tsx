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

type OnboardingContextValue = {
  /** null until loaded from storage */
  done: boolean | null;
  ready: boolean;
  complete: () => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    storage.get<boolean>(STORAGE_KEYS.onboardingDone).then((v) => setDone(!!v));
  }, []);

  const complete = useCallback(() => {
    setDone(true);
    storage.set(STORAGE_KEYS.onboardingDone, true);
  }, []);

  const reset = useCallback(() => {
    setDone(false);
    storage.set(STORAGE_KEYS.onboardingDone, false);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({ done, ready: done !== null, complete, reset }),
    [done, complete, reset],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
