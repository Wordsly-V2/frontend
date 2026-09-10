"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { flushSyncQueue } from "@/lib/offline/sync-flush";
import {
	deleteSyncRecord,
	retrySyncRecord,
	type SyncRecord,
} from "@/lib/offline/sync-queue";
import { useState } from "react";
import { toast } from "sonner";

function describe(record: SyncRecord): string {
	if (record.op.kind === "practice-answers") {
		const count = record.op.body.answers?.length ?? 0;
		return `${count} answer${count === 1 ? "" : "s"}`;
	}
	const days = record.op.body.days?.length ?? 0;
	return `${days} day${days === 1 ? "" : "s"} of practice`;
}

function savedOn(record: SyncRecord): string {
	return new Date(record.createdAt).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

interface UnsyncedWorkDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	records: SyncRecord[];
	userLoginId: string | null;
	canSync: boolean;
}

/**
 * Lets the learner act on practice the app could not save.
 *
 * The queue has always kept these records rather than dropping them, but until
 * now nothing showed them: work sat in IndexedDB permanently with no way to
 * retry it and no way to clear it. Discard is deliberately explicit and
 * per-record — this is practice the learner actually did, so the app never
 * throws it away on their behalf.
 */
export default function UnsyncedWorkDialog({
	open,
	onOpenChange,
	records,
	userLoginId,
	canSync,
}: UnsyncedWorkDialogProps) {
	const [busyId, setBusyId] = useState<string | null>(null);

	const handleRetry = async (record: SyncRecord) => {
		setBusyId(record.id);
		try {
			await retrySyncRecord(record.id);
			const result = await flushSyncQueue({
				userLoginId,
				canSync,
				reason: "manual",
			});
			if (result.sent > 0) {
				toast.success("Saved", {
					description: "Your practice is on your account.",
				});
			} else {
				toast("Still waiting", {
					description: "We'll keep trying in the background.",
				});
			}
		} finally {
			setBusyId(null);
		}
	};

	const handleDiscard = async (record: SyncRecord) => {
		setBusyId(record.id);
		try {
			await deleteSyncRecord(record.id);
			toast("Removed", { description: "That practice was discarded." });
		} finally {
			setBusyId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Practice we couldn&apos;t save</DialogTitle>
					<DialogDescription>
						Your practice is safe on this device. Try again, or remove it
						if you&apos;d rather not keep it.
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-72 pr-3">
					<ul className="flex flex-col gap-3">
						{records.map((record) => (
							<li
								key={record.id}
								className="rounded-lg border border-border/60 p-3"
							>
								<p className="text-sm font-medium">
									{describe(record)}
								</p>
								<p className="text-xs text-muted-foreground">
									From {savedOn(record)}
								</p>
								{record.lastError ? (
									<p className="mt-1 text-xs text-muted-foreground">
										{record.lastError}
									</p>
								) : null}
								<div className="mt-2 flex gap-2">
									<Button
										size="sm"
										onClick={() => void handleRetry(record)}
										disabled={busyId === record.id}
									>
										Try again
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => void handleDiscard(record)}
										disabled={busyId === record.id}
									>
										Remove
									</Button>
								</div>
							</li>
						))}
					</ul>
				</ScrollArea>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
