"use client";

import { Skeleton } from "@/components/common/states";
import { AdminItemEditor } from "@/components/features/admin-path/item-editor";
import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";

export default function AdminItemPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
    const { slug } = use(params);

    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-4xl">
                <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
                    <Editor slug={slug} />
                </Suspense>
            </div>
        </main>
    );
}

/** `?unit=` preselects the unit of a new item. */
function Editor({ slug }: Readonly<{ slug: string }>) {
    const unit = useSearchParams().get("unit") ?? undefined;
    return <AdminItemEditor slug={slug} unit={unit} />;
}
