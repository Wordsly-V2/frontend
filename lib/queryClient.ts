import { QueryClient } from '@tanstack/react-query';

/** A day: long enough that stepping away and losing signal still leaves data. */
const DEFAULT_GC_TIME = 24 * 60 * 60 * 1000;

/** A week, for the handful of queries a practice session cannot start without. */
export const SESSION_CRITICAL_GC_TIME = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 1 min so remounts/focus don't refetch on every
      // navigation; the refetchOn* flags below only fire once data is stale.
      staleTime: 60_000,
      // Anything garbage-collected is also dropped from the next persist, so a
      // short gcTime would leave a learner who idles for a few minutes and then
      // loses signal with nothing cached. Freshness is staleTime's job; this is
      // about availability.
      gcTime: DEFAULT_GC_TIME,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: false,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnReconnect: true,
      // `navigator.onLine` lies (captive portals, dead uplinks) and the API is on
      // another origin, so the default "online" mode would park queries in
      // fetchStatus: "paused" while perfectly good cached data sat unused.
      // "offlineFirst" always attempts once, fails fast, and leaves restored
      // data in place.
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
      // Same reasoning, plus: React Query's own mutation pause/resume is
      // in-memory and dies with the tab. Durable retries are the sync queue's
      // job (lib/offline/sync-queue.ts); here "offlineFirst" just means attempt,
      // fail fast, and let the caller enqueue.
      networkMode: 'offlineFirst',
    },
  },
});
