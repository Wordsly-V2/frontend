import type { AdminTree } from "@/types/admin-path/admin-path.type";

/** Units in path order, and every item, as picker options. */
export function pathOptions(tree: AdminTree | undefined, keep?: string) {
    const stages = tree?.stages ?? [];
    const units = stages.flatMap((stage) =>
        stage.units
            .filter((u) => u.status !== "ARCHIVED" || u.slug === keep)
            .map((u) => ({ value: u.slug, label: `${stage.title} · ${u.order}. ${u.title}` })),
    );
    const items = stages.flatMap((stage) =>
        stage.units.flatMap((u) => u.itemList.map((item) => ({ value: item.slug, label: item.text }))),
    );
    return { units, items };
}
