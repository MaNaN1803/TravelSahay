import { useEffect, useRef } from 'react';
import { backend } from '@/api/backend';
import { useAuth } from '@/state/AuthProvider';

/**
 * Two-way sync of a local collection with the backend store for the signed-in user.
 * - On login: pull remote; if remote is empty, seed it from local.
 * - On change: push to remote.
 * Works offline (failures are ignored; local storage remains the source of truth).
 */
export function useBackendSync<T>(key: string, data: T, setData: (value: T) => void) {
  const { token } = useAuth();
  const dataRef = useRef(data);
  dataRef.current = data;

  // pull / seed when a token becomes available
  useEffect(() => {
    if (!token) return;
    let active = true;
    backend
      .getStore<T>(key, token)
      .then((r) => {
        if (!active) return;
        if (r.data != null) {
          setData(r.data);
        } else if (Array.isArray(dataRef.current) && dataRef.current.length > 0) {
          backend.putStore(key, dataRef.current, token).catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key]);

  // push on change
  useEffect(() => {
    if (!token) return;
    backend.putStore(key, data, token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, token, key]);
}
