"use client";

import { useAuthSession } from "@/hooks/useAuthSession.hook";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSection from "../loading-section/loading-section";
import OfflineReconnectScreen from "../offline/offline-reconnect-screen";

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * Client-side route protection.
 *
 * Offline-aware: a request that never reached the server is not evidence that
 * the user is signed out. Bouncing to `/auth/login` in that case used to make
 * the whole app — including offline practice — unreachable without a
 * connection, because the login page needs the network too.
 */
export default function AuthGuard({ children }: Readonly<AuthGuardProps>) {
    const router = useRouter();
    const pathname = usePathname();
    const { state } = useAuthSession();

    const isAuthRoute = pathname?.startsWith("/auth") ?? false;

    useEffect(() => {
        if (isAuthRoute) return;
        if (state === "rejected") {
            router.push("/auth/login");
        }
    }, [isAuthRoute, router, state]);

    if (isAuthRoute) {
        return <>{children}</>;
    }

    switch (state) {
        case "verifying":
            return (
                <LoadingSection
                    isLoading
                    error={null}
                    refetch={() => {}}
                    loadingLabel="Checking authentication..."
                />
            );

        case "offline-expired":
            // Never a spinner and never a silent redirect: offline, the login
            // page cannot load either, so that reads as a crash. Say what
            // happened and reassure the learner their practice is safe.
            return <OfflineReconnectScreen />;

        case "rejected":
            // The redirect is in flight; render nothing rather than flashing the
            // protected page.
            return null;

        case "online-verified":
        case "offline-grace":
            return <>{children}</>;
    }
}
