"use client";

import { PathUnitDetail } from "@/components/features/path/path-unit-detail";
import { use } from "react";

export default function PathUnitPage({
    params,
}: Readonly<{ params: Promise<{ unitId: string }> }>) {
    const { unitId } = use(params);

    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
            <div className="mx-auto max-w-3xl">
                <PathUnitDetail unitId={unitId} />
            </div>
        </main>
    );
}
