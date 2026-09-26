"use client";

import { AdminUserDetail } from "@/components/features/admin-users/admin-user-detail";
import { use } from "react";

export default function AdminUserPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = use(params);
    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-4xl">
                <AdminUserDetail userLoginId={id} />
            </div>
        </main>
    );
}
