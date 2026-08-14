/**
 * Shared constants for word media (audio + images) caching. Imported by both the
 * service worker and the client, so the two can never drift onto different cache
 * names or message types.
 */

export const WORD_MEDIA_CACHE = "wordsly-word-media-v1";

/** Message asking the service worker to pre-cache a list of media URLs. */
export const MSG_CACHE_MEDIA = "WORDSLY_CACHE_MEDIA";

/** Message from the service worker asking the page to flush its sync queue. */
export const MSG_FLUSH_SYNC = "WORDSLY_FLUSH_SYNC";

/** Background Sync tag used to wake a client when connectivity returns. */
export const SYNC_TAG_PRACTICE = "wordsly-practice-sync";

/**
 * Hosts observed across the seed corpus: Cambridge and Memrise serve the audio,
 * Langeek's CDN serves the images. Override with NEXT_PUBLIC_MEDIA_HOSTS if a
 * deployment sources media elsewhere.
 */
const DEFAULT_MEDIA_HOSTS =
    "dictionary.cambridge.org,cdn.langeek.co,static.memrise.com";

/** Hosts serving word audio/images, which are safe to cache (no credentials). */
export function getMediaHosts(): Set<string> {
    const configured =
        process.env.NEXT_PUBLIC_MEDIA_HOSTS?.trim() || DEFAULT_MEDIA_HOSTS;
    return new Set(
        configured
            .split(",")
            .map((host) => host.trim())
            .filter(Boolean),
    );
}

/**
 * Ask the service worker to warm a set of media URLs.
 *
 * A runtime CacheFirst route can only fill the cache with what the learner
 * actually plays; this is how words they have not reached yet get downloaded
 * ahead of going offline. No-ops when there is no controller (the first load
 * after install) — the next visit picks it up.
 */
export function requestMediaCaching(urls: string[]): void {
    if (urls.length === 0) return;
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;

    const controller = navigator.serviceWorker.controller;
    if (!controller) return;

    controller.postMessage({ type: MSG_CACHE_MEDIA, urls });
}
