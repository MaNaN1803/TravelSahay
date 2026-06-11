import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { backend, type DiaryEntry, type NewDiaryEntry } from '@/api/backend';
import { useAuth } from '@/state/AuthProvider';

type DiaryContextValue = {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  add: (entry: NewDiaryEntry) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const DiaryContext = createContext<DiaryContextValue | undefined>(undefined);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setEntries([]);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    backend
      .getDiary(token)
      .then((r) => active && setEntries(r.entries))
      .catch((e) => active && setError(e?.message ?? 'Could not load diary'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, reloadKey]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  const add = useCallback(
    async (entry: NewDiaryEntry) => {
      if (!token) throw new Error('Not signed in');
      const { entry: created } = await backend.addDiary(entry, token);
      setEntries((prev) => [created, ...prev]);
    },
    [token],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      setEntries((prev) => prev.filter((e) => e._id !== id));
      await backend.deleteDiary(id, token).catch(() => setReloadKey((k) => k + 1));
    },
    [token],
  );

  const value = useMemo<DiaryContextValue>(
    () => ({ entries, loading, error, refresh, add, remove }),
    [entries, loading, error, refresh, add, remove],
  );

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider');
  return ctx;
}
