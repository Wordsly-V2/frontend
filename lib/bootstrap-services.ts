/**
 * The services' own public URLs, so the browser can nudge them directly.
 *
 * Optional, and empty in local dev. Without it the gateway is the only thing
 * the browser can reach, and the boots serialize: the gateway's own cold start
 * has to finish before it can even begin waking the services behind it.
 *
 * Imported by both the page (which fires the nudges) and the service worker
 * (which must stay out of their way), so the two can never disagree.
 */
export function getBootstrapServiceUrls(): string[] {
    return (
        process.env.NEXT_PUBLIC_BOOTSTRAP_SERVICE_URLS?.split(",")
            .map((url) => url.trim().replace(/\/$/, ""))
            .filter(Boolean) ?? []
    );
}

/** Origins of the bootstrap URLs, for matching requests by origin. */
export function getBootstrapServiceOrigins(): Set<string> {
    const origins = new Set<string>();
    for (const url of getBootstrapServiceUrls()) {
        try {
            origins.add(new URL(url).origin);
        } catch {
            // A malformed entry nudges nothing; it has nothing to exclude either.
        }
    }
    return origins;
}
