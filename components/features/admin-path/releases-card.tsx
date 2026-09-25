"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { useActivateAdminReleaseMutation, useAdminReleasesQuery } from "@/queries/admin-path.query";
import type { AdminRelease } from "@/types/admin-path/admin-path.type";
import { useState } from "react";
import { toast } from "sonner";

/** Every release, newest first; any of them can be made live again. */
export function ReleasesCard() {
    const releases = useAdminReleasesQuery();
    const activate = useActivateAdminReleaseMutation();
    const [target, setTarget] = useState<AdminRelease | null>(null);

    const confirm = () => {
        if (!target) return;
        activate.mutate(target.id, {
            onSuccess: () => {
                toast.success(`Release v${target.version} is live`);
                setTarget(null);
            },
            onError: (error) => toast.error(adminErrorMessages(error)[0]),
        });
    };

    return (
        <section className="glass-surface space-y-3 rounded-2xl p-4" aria-label="Releases">
            <h2 className="font-semibold">Releases</h2>
            {!releases.data && <p className="text-sm text-muted-foreground">Loading…</p>}
            <ul className="divide-y divide-border text-sm">
                {releases.data?.map((release) => (
                    <li key={release.id} className="flex flex-wrap items-center gap-2 py-2">
                        <span className="font-semibold tabular-nums">v{release.version}</span>
                        {release.active && <Badge variant="success">Live</Badge>}
                        <span className="text-muted-foreground">
                            {new Date(release.createdAt).toLocaleString()}
                            {release.createdBy ? "" : " · import"}
                        </span>
                        {release.note && <span className="min-w-0 flex-1 truncate">{release.note}</span>}
                        {!release.active && (
                            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setTarget(release)}>
                                Make live
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            <ConfirmDialog
                isOpen={target !== null}
                onClose={() => setTarget(null)}
                onConfirm={confirm}
                title={target ? `Make v${target.version} live?` : ""}
                description="Learners switch to this release right away. Nothing is retired, so their review cards stay; draft edits are untouched."
                confirmText="Make live"
                isLoading={activate.isPending}
            />
        </section>
    );
}
