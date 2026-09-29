/** The live rows among siblings, in their current order: what `POST /admin/path/reorder` takes. */
export function liveSlugs(rows: readonly { slug: string; status: string; order: number }[]): string[] {
    return [...rows]
        .filter((r) => r.status !== "ARCHIVED")
        .sort((a, b) => a.order - b.order)
        .map((r) => r.slug);
}

/** `slugs` with `slug` swapped one place up (-1) or down (+1); null when it can't move that way. */
export function moveSlug(slugs: readonly string[], slug: string, by: -1 | 1): string[] | null {
    const from = slugs.indexOf(slug);
    const to = from + by;
    if (from < 0 || to < 0 || to >= slugs.length) return null;
    const next = [...slugs];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
}
