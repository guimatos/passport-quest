/**
 * Player preferences that outlive a restart: mute and best score.
 * localStorage can be missing or throw (private mode, sandboxed playable
 * iframes, blocked site data), so every call is guarded and failures are silent.
 * Nothing leaves the device; no network is involved.
 */
const PREFIX = 'passport-quest:';

export const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(PREFIX + key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(PREFIX + key, value); } catch { /* unavailable: ignore */ }
  },
};
