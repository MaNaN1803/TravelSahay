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
import { backend, type AuthUser } from '@/api/backend';

const KEY = 'ts.auth';

type Stored = { token: string; user: AuthUser };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthed: boolean;
  ready: boolean;
  /** Creates the account but does NOT sign in (user logs in afterwards). */
  register: (email: string, username: string, password: string) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  /** Updates the signed-in user's profile (username) on the backend + locally. */
  updateUser: (username: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.get<Stored>(KEY).then((s) => {
      if (s?.token) {
        setToken(s.token);
        setUser(s.user);
      }
      setReady(true);
    });
  }, []);

  const persist = useCallback((s: Stored) => {
    setToken(s.token);
    setUser(s.user);
    storage.set(KEY, s);
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      // create the account only — do not store the token / sign in
      await backend.signup(email, username, password);
    },
    [],
  );

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await backend.login(identifier, password);
      persist(res);
    },
    [persist],
  );

  const updateUser = useCallback(
    async (username: string) => {
      if (!token) throw new Error('Not signed in');
      const { user: updated } = await backend.updateProfile(username, token);
      setUser(updated);
      storage.set(KEY, { token, user: updated });
    },
    [token],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    storage.remove(KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthed: !!token, ready, register, login, updateUser, logout }),
    [token, user, ready, register, login, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
