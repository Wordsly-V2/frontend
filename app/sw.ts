import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
    ExpirationPlugin,
    NetworkFirst,
    NetworkOnly,
    Serwist,
} from "serwist";

// Serwist injects the precache manifest at build time via `self.__SW_MANIFEST`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const OFFLINE_FALLBACK_URL = "/~offline";

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // Never cache API traffic — always go to the network. The app talks to
        // the gateway on a separate origin, but guard same-origin /api too.
        {
            matcher: ({ url }) => url.pathname.startsWith("/api"),
            handler: new NetworkOnly(),
        },
        // Pages: NetworkFirst so fresh content wins when online, cached copy
        // (and the offline fallback) keep the app usable offline.
        {
            matcher: ({ request }) => request.mode === "navigate",
            handler: new NetworkFirst({
                cacheName: "pages",
                networkTimeoutSeconds: 10,
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
