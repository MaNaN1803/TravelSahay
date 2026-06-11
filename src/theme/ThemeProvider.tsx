import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { palette, type ColorScheme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
type Scheme = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: Scheme;
  colors: ColorScheme;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.get<ThemeMode>(STORAGE_KEYS.themeMode).then((saved) => {
      if (saved) setModeState(saved);
      setReady(true);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    storage.set(STORAGE_KEYS.themeMode, next);
  };

  const scheme: Scheme =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors: palette[scheme], setMode, ready }),
    [mode, scheme, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
