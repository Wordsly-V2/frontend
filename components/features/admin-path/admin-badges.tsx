import { Badge } from "@/components/ui/badge";
import type { ContentStatus, RowOrigin } from "@/types/admin-path/admin-path.type";

const STATUS: Record<ContentStatus, { label: string; variant: "success" | "warning" | "muted" }> = {
    PUBLISHED: { label: "Live", variant: "success" },
    DRAFT: { label: "Draft", variant: "warning" },
    ARCHIVED: { label: "Archived", variant: "muted" },
};

/** Live = in the working copy as learners have it; Draft = changed since. */
export function StatusBadge({ status }: Readonly<{ status: ContentStatus }>) {
    const { label, variant } = STATUS[status];
    return <Badge variant={variant}>{label}</Badge>;
}

const ORIGIN: Record<RowOrigin, { label: string; title: string } | null> = {
    seed: null,
    edited: { label: "Edited", title: "Changed here; content/ has an older version" },
    admin: { label: "Admin-made", title: "Created here; not in content/" },
};

/** Nothing for rows that match content/; a badge when an admin changed them. */
export function OriginBadge({ origin }: Readonly<{ origin: RowOrigin }>) {
    const meta = ORIGIN[origin];
    if (!meta) return null;
    return (
        <Badge variant="outline" title={meta.title}>
            {meta.label}
        </Badge>
    );
}
