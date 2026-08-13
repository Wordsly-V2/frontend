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

/**
 * Bumped by every playback entry point. A running sequence compares the id it
 * captured against this counter, so any newer playback silently supersedes it.
 */
let sequenceId = 0;

function stopCurrent(): void {
    if (!currentHowl) return;
    currentHowl.stop();
    currentHowl = null;
}

function playNow(url: string): Howl | null {
    try {
        stopCurrent();
        const howl = getOrCreateHowl(url);
        currentHowl = howl;
        howl.play();
        return howl;
    } catch {
        // autoplay or missing file — ignore
        return null;
    }
}

export function playAudioUrl(url: string | undefined): void {
    if (!url || globalThis.window === undefined) return;
    // A direct play wins over any sequence still in flight.
    sequenceId += 1;
    playNow(url);
}

/**
 * Play `urls` back to back, skipping empty entries. Returns a cancel function.
 *
 * Chaining is driven by Howler's `end` event and also by `loaderror`/
 * `playerror`, so a missing or broken file skips to the next url instead of
 * stalling the chain. Any other playback (`playAudioUrl`, `stopAudio`, another
 * sequence) supersedes this one — the learner tapping an audio button wins.
 */
export function playAudioSequence(urls: (string | undefined)[]): () => void {
    const queue = urls.filter((url): url is string => Boolean(url?.trim()));
    if (queue.length === 0 || globalThis.window === undefined) return () => {};

    sequenceId += 1;
    const id = sequenceId;
    let index = 0;
    let detachStep: (() => void) | null = null;

    const playStep = (): void => {
        detachStep?.();
        detachStep = null;
        if (id !== sequenceId || index >= queue.length) return;

        const howl = playNow(queue[index++]);
        if (!howl) {
            playStep();
            return;
        }

        // `playStep` detaches these itself on its next run, so re-entering from
        // any of the three events leaves nothing behind.
        howl.once("end", playStep);
        howl.once("loaderror", playStep);
        howl.once("playerror", playStep);
        // Howls are cached and shared between plays, so listeners must come off
        // again or they pile up on every replay of the same url.
        detachStep = () => {
            howl.off("end", playStep);
            howl.off("loaderror", playStep);
            howl.off("playerror", playStep);
        };
    };

    playStep();

    return () => {
        // Already superseded — don't stop audio that now belongs to someone else.
        if (id !== sequenceId) return;
        sequenceId += 1;
        detachStep?.();
        detachStep = null;
        stopCurrent();
    };
}

export function stopAudio(): void {
    sequenceId += 1;
    stopCurrent();
}

export function clearAudioCache(): void {
    stopAudio();
    for (const { howl } of cache.values()) {
        howl.unload();
    }
    cache.clear();
}
