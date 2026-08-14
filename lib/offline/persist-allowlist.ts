import type { Query } from "@tanstack/react-query";

/**
 * Which cached queries may be written to disk.
 *
 * This is the single most important security control in offline mode. Everything
 * persisted is plaintext in IndexedDB, readable by any script on the origin — so
 * an allowlist, not a denylist: a query added later is off-disk by default and
 * has to be opted in deliberately.
 *
 * Each entry is a key *prefix*; a query is persisted when its key starts with one.
 */
const PERSISTED_KEY_PREFIXES: readonly (readonly unknown[])[] = [
    // Course structure and the words themselves — what a session is made of.
    ["courses", "course-detail"],
    ["courses", "lessons"],
    ["courses", "my-courses", "total-stats"],
    ["words"],
    // Scheduling state, so stage classification is right offline.
    ["word-progress"],
    ["due-word-ids"],
    ["leeches"],
    // Small, and drives what the learner sees on /learn.
    ["daily-habit"],
    ["learning-settings"],
    ["preferences"],
    // The warmer's record of what is available offline.
    ["offline-pool"],
];

/**
 * Deliberately NOT persisted, with reasons — kept as documentation so the next
 * person does not "helpfully" add them:
 *
 * - `dictionary.*`     third-party payloads, large, useless without a network
 * - `my-words.search`  unbounded churn, one entry per keystroke
 * - `courses.list`     pagination fragments; `total-stats` + `detail` cover the
 *                      offline need without persisting a partial list
 * - `learning-report`  large chart series that would render misleading numbers
 *                      offline; the page says "needs a connection" instead
 * - `user-level`       XP must never be shown offline as though it were settled
 * - `notifications`    push subscription state, meaningless offline
 */

function hasPrefix(key: readonly unknown[], prefix: readonly unknown[]): boolean {
    if (key.length < prefix.length) return false;
    return prefix.every((segment, index) => key[index] === segment);
}

export function isPersistableQueryKey(key: readonly unknown[]): boolean {
    return PERSISTED_KEY_PREFIXES.some((prefix) => hasPrefix(key, prefix));
}

/**
 * `shouldDehydrateQuery` for the persister.
 *
 * Beyond the allowlist: only successful results are stored (an error or a
 * pending fetch is not worth restoring), and any result the app itself derived
 * offline is skipped — otherwise an offline guess would come back after a
 * restart looking exactly like server truth.
 */
export function shouldDehydrateQuery(query: Query): boolean {
    if (query.state.status !== "success") return false;
    if (query.state.data === undefined) return false;

    const data = query.state.data as { source?: unknown } | null;
    if (data && typeof data === "object" && data.source === "offline") {
        return false;
    }

    return isPersistableQueryKey(query.queryKey);
}
