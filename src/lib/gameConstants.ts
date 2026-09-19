export const MAX_GUESSES = 15
export const MAX_HINTS = 8
// Per-player stats are kept in localStorage under this shape, so widening it would have to reshape
// every saved distribution. Seven buckets stay the local contract.
export const STATS_BUCKET_COUNT = 7
// Global stats are derived on the server from the raw guess counts in D1, so they can show the full
// range a game can take without any migration. The last bucket still absorbs the legacy 20-guess
// results, hence the "15+" label.
export const GLOBAL_STATS_BUCKET_COUNT = MAX_GUESSES
