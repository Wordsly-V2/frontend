"use client";

import { PageShell } from "@/components/common/page";
import { PathUnitDetail } from "@/components/features/path/path-unit-detail";
import { use } from "react";

export default function PathUnitPage({
    params,
}: Readonly<{ params: Promise<{ unitId: string }> }>) {
    const { unitId } = use(params);

    return (
        <PageShell width="narrow">
            <div>
                <PathUnitDetail unitId={unitId} />
            </div>
        </PageShell>
    );
}
