"use client";

import { useSyncExternalStore } from "react";
import {
    getServerWarmupSnapshot,
    getWarmupSnapshot,
    subscribeToWarmup,
    type WarmupSnapshot,
} from "@/lib/service-warmup";

/**
 * Whether the backend is awake, booting, or unreachable.
 * See `lib/service-warmup.ts` for why this exists.
 */
export function useServiceWarmup(): WarmupSnapshot {
    return useSyncExternalStore(
        subscribeToWarmup,
        getWarmupSnapshot,
        getServerWarmupSnapshot,
    );
}
