import { useEffect } from "react";

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
    );
}

/** Runs `action` when Enter is pressed outside text inputs. */
export function useEnterKeyAction(action: () => void, enabled = true): void {
    useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            if (isEditableKeyboardTarget(e.target)) return;
            e.preventDefault();
            action();
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [action, enabled]);
}
