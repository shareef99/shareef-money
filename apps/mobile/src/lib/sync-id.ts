// The server uses a single autoincrement id space shared by all users, while
// each device only sees its own user's rows. Letting local SQLite autoincrement
// pick the next id can therefore collide with another user's row on sync push.
// Generate a timestamp-based id instead: unique across devices, and well within
// Number.MAX_SAFE_INTEGER (~9.0e15) — Date.now() * 1000 is ~1.8e15.
export function generateSyncId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}
