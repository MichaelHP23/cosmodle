export const MAX_GUESSES = 15
export const MAX_HINTS = 8
// Per-player stats are kept in localStorage under this shape, so widening it would have to reshape
// every saved distribution. Seven buckets stay the local contract.
export const STATS_BUCKET_COUNT = 7
// Global stats are derived on the server from the raw guess counts in D1, so they can show the full
// range a game can take without any migration. It ends at the guess limit, so the last bucket is an
// exact count rather than an overflow bar; the rare 20-guess results from old builds fold into it.
export const GLOBAL_STATS_BUCKET_COUNT = MAX_GUESSES
