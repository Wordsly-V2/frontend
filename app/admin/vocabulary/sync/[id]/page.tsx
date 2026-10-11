"use client";

import { SyncRunDetail } from "@/components/features/admin-dictionary-sync/sync-run-detail";
import { use } from "react";

export default function AdminLangeekSyncRunPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = use(params);
    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-4xl">
                <SyncRunDetail jobId={id} />
            </div>
        </main>
    );
}
