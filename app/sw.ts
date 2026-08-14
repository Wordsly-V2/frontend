import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
    CacheableResponsePlugin,
    CacheFirst,
    ExpirationPlugin,
    NetworkFirst,
    NetworkOnly,
    RangeRequestsPlugin,
    Serwist,
} from "serwist";
import {
    getMediaHosts,
    MSG_CACHE_MEDIA,
    MSG_FLUSH_SYNC,
    SYNC_TAG_PRACTICE,
    WORD_MEDIA_CACHE,
} from "@/lib/offline/media-cache";

// Serwist injects the precache manifest at build time via `self.__SW_MANIFEST`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const OFFLINE_FALLBACK_URL = "/~offline";

const API_ORIGIN = (() => {
    try {
        return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
    } catch {
        return null;
    }
})();

const MEDIA_HOSTS = getMediaHosts();

/**
 * Authenticated API responses cached by an earlier build. `@serwist/next`'s
 * default runtime list ends with a catch-all NetworkFirst for every cross-origin
 * request, and the gateway is cross-origin — so gateway JSON (profiles, words,
 * progress) was being cached keyed by URL alone, with the Authorization header
 * ignored. On a shared device that serves one user's data to another. The
 * NetworkOnly rule below stops it happening; this deletes what was already
 * stored.
 */
const LEGACY_CROSS_ORIGIN_CACHE = "cross-origin";

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // Never cache anything from the gateway. The Cache API keys on URL and
        // ignores Authorization, so there is no safe way to store authenticated
        // JSON here. Offline reads come from the per-user, allowlisted React
        // Query cache in IndexedDB instead — see lib/offline/query-persister.ts.
        ...(API_ORIGIN
            ? [
                  {
                      matcher: ({ url }: { url: URL }) =>
                          url.origin === API_ORIGIN,
                      handler: new NetworkOnly(),
                  },
              ]
            : []),
        // Word audio and images: public, immutable, and the bulk of what an
        // offline practice session needs. Declared before `defaultCache` so it
        // outranks both the generic image rule and the cross-origin catch-all.
        {
            matcher: ({ url }: { url: URL }) => MEDIA_HOSTS.has(url.host),
            handler: new CacheFirst({
                cacheName: WORD_MEDIA_CACHE,
                plugins: [
                    // 0 allows opaque responses, for CDNs that send no CORS
                    // headers. Those cannot be range-sliced, so audio playback
                    // falls back to a full fetch (see lib/practice-audio.ts).
                    new CacheableResponsePlugin({ statuses: [0, 200] }),
                    new ExpirationPlugin({
                        maxEntries: 400,
                        maxAgeSeconds: 30 * 24 * 60 * 60,
                        maxAgeFrom: "last-used",
                        purgeOnQuotaError: true,
                    }),
                    new RangeRequestsPlugin(),
                ],
            }),
        },
        // Pages: NetworkFirst so fresh content wins when online, cached copy
        // (and the offline fallback) keep the app usable offline.
        {
            matcher: ({ request }: { request: Request }) =>
                request.mode === "navigate",
            handler: new NetworkFirst({
                cacheName: "pages",
                networkTimeoutSeconds: 10,
                // Practice URLs carry the whole session in their query string
                // (courseId, wordIds, kind). Matching on the path alone lets a
                // cached shell serve any session instead of dropping the learner
                // on the offline page.
                matchOptions: { ignoreSearch: true },
                plugins: [
                    new ExpirationPlugin({
                        maxEntries: 50,
                        maxAgeSeconds: 7 * 24 * 60 * 60,
                    }),
                ],
            }),
        },
        ...defaultCache,
    ],
    fallbacks: {
        entries: [
            {
                url: OFFLINE_FALLBACK_URL,
                matcher: ({ request }) => request.destination === "document",
            },
        ],
    },
});

serwist.addEventListeners();

self.addEventListener("activate", (event) => {
    event.waitUntil(caches.delete(LEGACY_CROSS_ORIGIN_CACHE));
});

async function cacheMedia(urls: string[]): Promise<void> {
    const cache = await caches.open(WORD_MEDIA_CACHE);

    await Promise.all(
        urls.map(async (url) => {
            if (await cache.match(url)) return;
            try {
                // Prefer a CORS response: opaque entries are padded to ~7MB each
                // against the storage quota and cannot be range-sliced.
                const response = await fetch(url, {
                    mode: "cors",
                    credentials: "omit",
                });
                if (response.ok) {
                    await cache.put(url, response);
                    return;
                }
            } catch {
                // Fall through to the opaque attempt.
            }

            try {
                const opaque = await fetch(url, {
                    mode: "no-cors",
                    credentials: "omit",
                });
                await cache.put(url, opaque);
            } catch {
                // A media file we cannot pre-cache is not worth failing over;
                // the runtime route will try again when it is actually played.
            }
        }),
    );
}

/**
 * Wake any open client so it can flush its queue.
 *
 * The service worker deliberately does NOT post practice answers itself: it
 * cannot read localStorage, so it would need its own copy of the access token
 * and its own 401/refresh handling — duplicating the auth surface into a context
 * with no UI to recover in.
 */
async function wakeClientsToFlush(): Promise<void> {
    const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
    });
    for (const client of clients) {
        client.postMessage({ type: MSG_FLUSH_SYNC });
    }
}

self.addEventListener("message", (event) => {
    const data = event.data as { type?: string; urls?: string[] } | undefined;
    if (data?.type === MSG_CACHE_MEDIA && Array.isArray(data.urls)) {
        event.waitUntil(cacheMedia(data.urls));
    }
});

self.addEventListener("sync", (event) => {
    const syncEvent = event as ExtendableEvent & { tag?: string };
    if (syncEvent.tag === SYNC_TAG_PRACTICE) {
        event.waitUntil(wakeClientsToFlush());
    }
});
type PushPayload = {
    title?: string;
    body?: string;
    url?: string;
};

const DEFAULT_NOTIFICATION_URL = "/learn";

function parsePushPayload(event: PushEvent): PushPayload {
    if (!event.data) return {};
    try {
        return event.data.json() as PushPayload;
    } catch {
        return { body: event.data.text() };
    }
}

// Show a notification from the JSON push payload { title, body, url }.
self.addEventListener("push", (event: PushEvent) => {
    const payload = parsePushPayload(event);
    const title = payload.title ?? "Wordsly";
    const url = payload.url ?? DEFAULT_NOTIFICATION_URL;

    event.waitUntil(
        self.registration.showNotification(title, {
            body: payload.body ?? "Time to practice your words!",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { url },
        }),
    );
});

// Focus an existing tab (or open a new one) at the payload url on click.
self.addEventListener("notificationclick", (event: NotificationEvent) => {
    event.notification.close();
    const data = (event.notification.data ?? {}) as { url?: string };
    const targetUrl = data.url ?? DEFAULT_NOTIFICATION_URL;

    event.waitUntil(
        (async () => {
            const clientList = await self.clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });
            for (const client of clientList) {
                const clientUrl = new URL(client.url);
                if (clientUrl.pathname === targetUrl && "focus" in client) {
                    await client.focus();
                    return;
                }
            }
            if (self.clients.openWindow) {
                await self.clients.openWindow(targetUrl);
            }
        })(),
    );
});
