/** Pull distance (px, after resistance) that arms a refresh on release. */
export const PULL_THRESHOLD = 72;
/** The indicator never travels further than this. */
export const PULL_MAX = 120;
/** Finger travel before a gesture counts as a pull, so taps and scrolls pass. */
export const PULL_SLOP = 8;

/**
 * Finger travel → indicator travel. Linear-ish at first, then flattening
 * towards `PULL_MAX`, so the pull feels like stretching rubber.
 */
export function pullDistance(fingerDelta: number): number {
    if (fingerDelta <= 0) return 0;
    return PULL_MAX * (1 - Math.exp(-fingerDelta / (PULL_MAX * 1.2)));
}

/** 0 → 1 progress towards the threshold, for the indicator's turn and fade. */
export function pullProgress(distance: number): number {
    return Math.min(1, Math.max(0, distance / PULL_THRESHOLD));
}

/**
 * Decides, once the finger has moved past the slop, whether the gesture is a
 * pull (mostly downward) or something else (a scroll up, a sideways swipe).
 * `null` means it is too early to tell.
 */
export function classifyPull(dx: number, dy: number): "pull" | "other" | null {
    if (Math.hypot(dx, dy) < PULL_SLOP) return null;
    return dy > 0 && dy > Math.abs(dx) * 1.5 ? "pull" : "other";
}
