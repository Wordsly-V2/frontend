import { Howl } from "howler";

const MAX_CACHE = 12;

interface CacheEntry {
    howl: Howl;
    lastUsed: number;
}

const cache = new Map<string, CacheEntry>();
let currentHowl: Howl | null = null;

function evictIfNeeded(): void {
    if (cache.size <= MAX_CACHE) return;

    let oldestUrl: string | null = null;
    let oldestTime = Infinity;
    for (const [url, entry] of cache) {
        if (entry.howl !== currentHowl && entry.lastUsed < oldestTime) {
            oldestTime = entry.lastUsed;
            oldestUrl = url;
        }
    }
    if (!oldestUrl) return;

    cache.get(oldestUrl)?.howl.unload();
    cache.delete(oldestUrl);
}

function getOrCreateHowl(url: string): Howl {
    const existing = cache.get(url);
    if (existing) {
        existing.lastUsed = Date.now();
        return existing.howl;
    }

    const howl = new Howl({
        src: [url],
        html5: true,
        preload: true,
    });
    cache.set(url, { howl, lastUsed: Date.now() });
    evictIfNeeded();
    return howl;
}

/** Warm the cache so the next play starts without a network fetch. */
export function preloadAudioUrl(url: string | undefined): void {
    if (!url || globalThis.window === undefined) return;
    try {
        getOrCreateHowl(url);
    } catch {
        // ignore
    }
}

export function playAudioUrl(url: string | undefined): void {
    if (!url || globalThis.window === undefined) return;
    try {
        if (currentHowl) {
            currentHowl.stop();
            currentHowl = null;
        }

        const howl = getOrCreateHowl(url);
        currentHowl = howl;
        howl.play();
    } catch {
        // autoplay or missing file — ignore
    }
}

export function stopAudio(): void {
    if (!currentHowl) return;
    currentHowl.stop();
    currentHowl = null;
}

export function clearAudioCache(): void {
    stopAudio();
    for (const { howl } of cache.values()) {
        howl.unload();
    }
    cache.clear();
}
