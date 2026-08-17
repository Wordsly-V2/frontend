import { parseAsInteger, parseAsString } from "nuqs/server";

/**
 * Search + pagination for every course library list (`/learn/courses`, `/manage`).
 *
 * `clearOnDefault` keeps `?page=1` / `?q=` out of the URL, so the first page has
 * one canonical address and Back never lands on a noisier duplicate of it.
 */
export const coursesListSearchParams = {
    q: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
};
