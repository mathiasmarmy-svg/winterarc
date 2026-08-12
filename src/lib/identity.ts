import type { Identity } from '../types';

const KEY = 'winterarc:me';

export function loadIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: Identity | null): void {
  try {
    if (identity) localStorage.setItem(KEY, JSON.stringify(identity));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable (private mode, quota) — identity just won't persist
  }
}
