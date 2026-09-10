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

/**
 * True when the key press is part of a browser/OS shortcut rather than a plain
 * keystroke.
 *
 * Single-letter practice shortcuts must ignore these: without the check, Cmd+A
 * or Ctrl+A ("select all") matched the `a` answer shortcut and submitted an
 * answer the learner never chose.
 */
export function hasShortcutModifier(e: KeyboardEvent): boolean {
    return e.metaKey || e.ctrlKey || e.altKey;
}

/** Runs `action` when Enter is pressed outside text inputs. */
export function useEnterKeyAction(action: () => void, enabled = true): void {
    useEffect(() => {
        if (!enabled) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Enter" || e.shiftKey) return;
            if (hasShortcutModifier(e)) return;
            if (isEditableKeyboardTarget(e.target)) return;
            e.preventDefault();
            action();
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [action, enabled]);
}
