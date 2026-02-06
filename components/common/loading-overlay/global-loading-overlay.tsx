"use client";

import { useAppSelector } from "@/store/hooks";
import LoadingOverlay from "./loading-overlay";

/**
 * Global loading overlay driven by Redux. Mount once inside the Redux Provider (e.g. in Providers.tsx).
 * Control visibility via useLoadingOverlay() hook.
 */
export default function GlobalLoadingOverlay() {
    const { visible, label } = useAppSelector((state) => state.loadingOverlay);
    return <LoadingOverlay isLoading={visible} label={label} />;
}
