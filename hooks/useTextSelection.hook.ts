"use client";

import { useCallback, useEffect, useState } from "react";

const MAX_CHARS = 60;
const MAX_WORDS = 4;

/** Ignore selections made inside typing surfaces or an already-open dialog. */
const IGNORED_ANCESTORS = "input, textarea, [contenteditable='true'], [role='dialog']";

function readSelection(): string {
    const selection = globalThis.getSelection?.();
    if (!selection || selection.isCollapsed) return "";

    const text = selection.toString().trim().replace(/\s+/g, " ");
    if (!text || text.length > MAX_CHARS) return "";
    if (text.split(" ").length > MAX_WORDS) return "";
    if (!/[a-zA-Z]/.test(text)) return "";

    const node = selection.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    if (element?.closest(IGNORED_ANCESTORS)) return "";

    return text;
}

/**
 * The phrase the user currently has highlighted, if it looks like something
 * worth looking up (a word or short phrase, not a paragraph).
 */
export function useTextSelection() {
    const [selectedText, setSelectedText] = useState("");

    useEffect(() => {
        let settleTimer: ReturnType<typeof setTimeout> | undefined;

        /**
         * `selectionchange` is the only event that covers mobile: long-press
         * selection and dragging the native selection handles never produce a
         * touchend on the document. It fires continuously while dragging, so
         * settle first — and clear immediately on collapse so the pill goes
         * away the moment the user taps elsewhere.
         */
        const onSelectionChange = () => {
            clearTimeout(settleTimer);
            if (globalThis.getSelection?.()?.isCollapsed) {
                setSelectedText("");
                return;
            }
            settleTimer = setTimeout(() => setSelectedText(readSelection()), 250);
        };

        // Desktop: a finished drag should show the pill without waiting out the
        // settle delay. Next tick, because the browser clears the selection
        // after mouseup on a plain click.
        const onPointerFinished = () => {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(() => setSelectedText(readSelection()), 0);
        };

        document.addEventListener("selectionchange", onSelectionChange);
        document.addEventListener("mouseup", onPointerFinished);
        document.addEventListener("keyup", onPointerFinished);
        return () => {
            clearTimeout(settleTimer);
            document.removeEventListener("selectionchange", onSelectionChange);
            document.removeEventListener("mouseup", onPointerFinished);
            document.removeEventListener("keyup", onPointerFinished);
        };
    }, []);

    const clearSelection = useCallback(() => {
        globalThis.getSelection?.()?.removeAllRanges();
        setSelectedText("");
    }, []);

    return { selectedText, clearSelection };
}
