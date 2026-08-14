"use client";

import { useAppSelector } from "@/store/hooks";
import {
    evaluateOfflineGrace,
    type OfflineGraceRejection,
} from "@/lib/offline/auth-session";
import { useMemo } from "react";

/**
 * Whether the app may be used right now, and on what basis.
 *
 * - `verifying`       first ever load, nothing cached to fall back to
 * - `online-verified` a live 200 from the server this session
 * - `offline-grace`   no connection, but a recent confirmed identity is cached
 * - `offline-expired` no connection and the grace window is gone or untrusted
 * - `rejected`        the server refused this identity
 *
 * The critical invariant: **only `online-verified` may send data off the
 * device.** Grace grants local reads. There is deliberately no path that posts a
 * queued answer on the strength of a cached profile.
 */
export type AuthSessionState =
    | "verifying"
    | "online-verified"
    | "offline-grace"
    | "offline-expired"
    | "rejected";

export interface AuthSession {
    state: AuthSessionState;
    /** Why grace was refused, when state is `offline-expired`. */
    rejectionReason?: OfflineGraceRejection;
    /** When the offline grace window runs out, if we are inside one. */
    graceExpiresAtMs?: number;
    /** True while running on cached data rather than a live response. */
    isOffline: boolean;
    /** True only after a live server confirmation — gate outbound writes on this. */
    canSync: boolean;
}

export function useAuthSession(): AuthSession {
    const profile = useAppSelector((state) => state.user.profile);
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const authFailure = useAppSelector((state) => state.user.authFailure);
    const isProfileFromCache = useAppSelector(
        (state) => state.user.isProfileFromCache,
    );

    return useMemo<AuthSession>(() => {
        if (authFailure === "unauthorized") {
            return { state: "rejected", isOffline: false, canSync: false };
        }

        if (authFailure === "network") {
            const grace = evaluateOfflineGrace({});
            if (!grace.allowed) {
                return {
                    state: "offline-expired",
                    rejectionReason: grace.reason,
                    isOffline: true,
                    canSync: false,
                };
            }
            return {
                state: "offline-grace",
                graceExpiresAtMs: grace.expiresAtMs,
                isOffline: true,
                canSync: false,
            };
        }

        if (profile && !isProfileFromCache) {
            return { state: "online-verified", isOffline: false, canSync: true };
        }

        if (isLoading) {
            return { state: "verifying", isOffline: false, canSync: false };
        }

        // Not loading, no profile, no recorded failure — nobody is signed in.
        return { state: "rejected", isOffline: false, canSync: false };
    }, [authFailure, isLoading, isProfileFromCache, profile]);
}
