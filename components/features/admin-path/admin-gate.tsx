"use client";

import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { useAppSelector } from "@/store/hooks";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

/**
 * Shows admin pages to admins only. This only hides UI: the API refuses
 * non-admins on its own (403), whatever the browser shows.
 */
export function AdminGate({ children }: Readonly<{ children: React.ReactNode }>) {
    const profile = useAppSelector((state) => state.user.profile);
    if (isAdmin(profile)) return <>{children}</>;

    return (
        <main className="min-h-dvh px-4 pt-10">
            <div className="mx-auto max-w-lg">
                <EmptyState
                    icon={ShieldAlert}
                    title="Admins only"
                    description="This area is for editing Wordsly Path content. If you were just given access, sign out and back in."
                    action={
                        <Button variant="play" asChild>
                            <Link href="/learn">Back to learning</Link>
                        </Button>
                    }
                />
            </div>
        </main>
    );
}
