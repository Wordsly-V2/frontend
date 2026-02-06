import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideLoadingOverlay, showLoadingOverlay } from "@/store/slices/loadingOverlaySlice";

const defaultLabel = "Loading...";

/**
 * Hook to control the global loading overlay via Redux.
 * - Use showOverlay / hideOverlay for imperative control.
 * - Or pass isPending + label to sync overlay with a mutation (e.g. reorder).
 */
export function useLoadingOverlay(options?: {
    isPending?: boolean;
    label?: string;
}) {
    const dispatch = useAppDispatch();
    const { visible, label } = useAppSelector((state) => state.loadingOverlay);

    const show = (overlayLabel?: string) => {
        dispatch(showLoadingOverlay({ label: overlayLabel ?? defaultLabel }));
    };

    const hide = () => {
        dispatch(hideLoadingOverlay());
    };

    useEffect(() => {
        if (options?.isPending === undefined) return;
        if (options.isPending) {
            dispatch(showLoadingOverlay({ label: options.label ?? defaultLabel }));
        } else {
            dispatch(hideLoadingOverlay());
        }
        return () => {
            dispatch(hideLoadingOverlay());
        };
    }, [options?.isPending, options?.label, dispatch]);

    return { showOverlay: show, hideOverlay: hide, isVisible: visible, label };
}
