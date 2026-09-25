"use client";

import { PathCheckpointScreen } from "@/components/features/path/checkpoint/path-checkpoint-screen";
import { use } from "react";

export default function PathCheckpointPage({
    params,
}: Readonly<{ params: Promise<{ unitId: string }> }>) {
    const { unitId } = use(params);

    return (
        <main className="min-h-dvh px-3 pb-16 pt-3 sm:px-4 md:pt-6">
            <div className="mx-auto max-w-2xl">
                <PathCheckpointScreen unitId={unitId} />
            </div>
        </main>
    );
}
