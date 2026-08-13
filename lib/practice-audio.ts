import { Howl } from "howler";

const MAX_CACHE = 12;

interface CacheEntry {
    howl: Howl;
    lastUsed: number;
}

/** Why a playback stopped. Reported to its owner exactly once. */
export type PlaybackEndReason =
    /** Played through to the end. */
    | "ended"
    /** The file could not be loaded or played. */
    | "error"
    /** Superseded by other playback, or cancelled by its owner. */
    | "stopped";

export interface PlayAudioOptions {
    /** Called exactly once when this playback stops, whatever the reason. */
    onFinish?: (reason: PlaybackEndReason) => void;
}

interface ActivePlayback {
    howl: Howl;
    settle: (reason: PlaybackEndReason) => void;
}

const cache = new Map<string, CacheEntry>();
/**
 * The one sound allowed to play at a time. Every audio in the app goes through
 * here, so starting something new always stops what was playing rather than
 * layering two voices over each other.
 */
let active: ActivePlayback | null = null;

function evictIfNeeded(): void {
    if (cache.size <= MAX_CACHE) return;

    let oldestUrl: string | null = null;
    let oldestTime = Infinity;
    for (const [url, entry] of cache) {
        if (entry.howl !== active?.howl && entry.lastUsed < oldestTime) {
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
 * Play `url`, stopping whatever was playing first.
 *
 * Returns a cancel function that stops playback only while this call still owns
 * the player — cancelling a playback that something else already replaced is a
 * no-op, so a stale cleanup can never cut off the current sound.
 */
export function playAudioUrl(
    url: string | undefined,
    options?: PlayAudioOptions,
): () => void {
    if (!url || globalThis.window === undefined) return () => {};

    // Whatever is playing loses the player — never two voices at once.
    stopAudio();

    let howl: Howl;
    try {
        howl = getOrCreateHowl(url);
    } catch {
        options?.onFinish?.("error");
        return () => {};
    }

    let settled = false;
    const settle = (reason: PlaybackEndReason): void => {
        if (settled) return;
        settled = true;
        // Howls are cached and shared between plays, so listeners must come off
        // again or they pile up on every replay of the same url.
        howl.off("end", onEnd);
        howl.off("loaderror", onFail);
        howl.off("playerror", onFail);
        if (active?.settle === settle) active = null;
        options?.onFinish?.(reason);
    };
    const onEnd = () => settle("ended");
    const onFail = () => settle("error");

    howl.on("end", onEnd);
    howl.on("loaderror", onFail);
    howl.on("playerror", onFail);
    active = { howl, settle };

    try {
        howl.play();
    } catch {
        // autoplay blocked or missing file — report and release the player.
        settle("error");
        return () => {};
    }

    return () => {
        if (active?.settle !== settle) return;
        howl.stop();
        settle("stopped");
    };
}

/**
 * Play `urls` back to back, skipping empty entries. Returns a cancel function.
 *
 * A step that errors advances to the next url instead of stalling the chain. If
 * something else takes the player mid-sequence (the learner tapping an audio
 * button), the sequence gives up rather than fighting for it.
 */
export function playAudioSequence(urls: (string | undefined)[]): () => void {
    const queue = urls.filter((url): url is string => Boolean(url?.trim()));
    if (queue.length === 0 || globalThis.window === undefined) return () => {};

    let index = 0;
    let stepId = 0;
    let cancelStep: (() => void) | null = null;
    let cancelled = false;

    const playStep = (): void => {
        if (cancelled || index >= queue.length) return;

        const myStep = ++stepId;
        const cancel = playAudioUrl(queue[index++], {
            onFinish: (reason) => {
                if (myStep !== stepId) return;
                cancelStep = null;
                if (reason === "stopped") {
                    cancelled = true;
                    return;
                }
                playStep();
            },
        });
        // `onFinish` can fire synchronously (a url that fails immediately), which
        // already started the next step — don't overwrite its canceller.
        if (myStep === stepId) cancelStep = cancel;
    };

    playStep();

    return () => {
        cancelled = true;
        cancelStep?.();
        cancelStep = null;
    };
}

/** Stop whatever is playing, if anything. */
export function stopAudio(): void {
    const current = active;
    if (!current) return;
    current.howl.stop();
    current.settle("stopped");
}

export function clearAudioCache(): void {
    stopAudio();
    for (const { howl } of cache.values()) {
        howl.unload();
    }
    cache.clear();
}
