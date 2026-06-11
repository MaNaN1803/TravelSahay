// Client for the TravelSahay backend API.
export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AuthUser = { id: string; email: string; username: string };
export type AuthResult = { token: string; user: AuthUser };

export type DiaryPhoto = { data: string; width?: number; height?: number };
export type DiaryEntry = {
  _id: string;
  title: string;
  note?: string;
  placeName?: string;
  mood?: string;
  date: string;
  location?: { latitude?: number; longitude?: number };
  photos?: DiaryPhoto[];
  createdAt?: string;
};

export type NewDiaryEntry = Omit<DiaryEntry, '_id' | 'createdAt'>;

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error ?? `Request failed (${res.status})`);
  return json as T;
}

export const backend = {
  health: () => req<{ ok: boolean }>('/health'),

  signup: (email: string, username: string, password: string) =>
    req<AuthResult>('/auth/signup', { method: 'POST', body: { email, username, password } }),

  login: (identifier: string, password: string) =>
    req<AuthResult>('/auth/login', { method: 'POST', body: { identifier, password } }),

  getStore: <T>(key: string, token: string) =>
    req<{ key: string; data: T | null }>(`/store/${key}`, { token }),

  putStore: <T>(key: string, data: T, token: string) =>
    req<{ key: string; data: T }>(`/store/${key}`, { method: 'PUT', body: { data }, token }),

  getDiary: (token: string) => req<{ entries: DiaryEntry[] }>('/diary', { token }),

  addDiary: (entry: NewDiaryEntry, token: string) =>
    req<{ entry: DiaryEntry }>('/diary', { method: 'POST', body: entry, token }),

  deleteDiary: (id: string, token: string) =>
    req<{ ok: boolean }>(`/diary/${id}`, { method: 'DELETE', token }),
};
