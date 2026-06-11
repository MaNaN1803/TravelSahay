import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '@/api/backend';
import { useTheme, spacing } from '@/theme';
import { AppText } from '@/components/ui';

type OfflineContextValue = { online: boolean };
const OfflineContext = createContext<OfflineContextValue>({ online: true });

// Lightweight connectivity sensing via periodic health ping (no extra native deps).
// Enables "Offline Travel Mode" — screens that cache data locally keep working.
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const failures = useRef(0);

  useEffect(() => {
    let active = true;
    const ping = async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(`${API_BASE}/api/health`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!active) return;
        if (res.ok) { failures.current = 0; setOnline(true); }
        else throw new Error('bad status');
      } catch {
        if (!active) return;
        failures.current += 1;
        if (failures.current >= 2) setOnline(false); // require 2 misses to avoid flicker
      }
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <OfflineContext.Provider value={{ online }}>
      {children}
      {!online && <OfflineBanner />}
    </OfflineContext.Provider>
  );
}

function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', top: insets.top + 4, left: spacing.lg, right: spacing.lg, backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' }}>
      <AppText style={{ color: colors.textInverse, fontWeight: '700' }} variant="caption">
        Offline — showing saved trips & cached data
      </AppText>
    </View>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
