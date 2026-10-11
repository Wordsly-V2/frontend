"use client";

import { Button } from "@/components/ui/button";
import { countOf } from "@/lib/admin/vocabulary";
import { SyncWithLangeekButton } from "./start-sync-dialog";

/** Words ticked in a course, pinned under the page header: sync them, or clear the ticks. */
export function SelectedWordsBar({ wordIds, onClear }: Readonly<{ wordIds: string[]; onClear: () => void }>) {
    if (wordIds.length === 0) return null;
    const label = `${countOf(wordIds.length, "selected word")}`;
    return (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/40 bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
            <span className="text-sm font-medium">{label}</span>
            <span className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={onClear}>
                    Clear
                </Button>
                <SyncWithLangeekButton variant="default" size="sm" preset={{ scope: "words", wordIds, label }}>
                    Sync with Langeek
                </SyncWithLangeekButton>
            </span>
        </div>
    );
}
