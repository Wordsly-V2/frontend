"use client";

import { EditorHeader, FIELD, FieldError, Section } from "@/components/features/admin-path/admin-form-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { parseUnitFileJson } from "@/lib/admin-path/json-import";
import { useImportAdminUnitMutation } from "@/queries/admin-path.query";
import type { AdminImportResult, AdminImportReason, AdminKind } from "@/types/admin-path/admin-path.type";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const REASON: Record<AdminImportReason, { label: string; variant: "success" | "accent" | "warning" | "muted" | "destructive" }> = {
    new: { label: "New", variant: "success" },
    changed: { label: "Changes", variant: "accent" },
    "replaces-edit": { label: "Replaces an admin edit", variant: "warning" },
    unchanged: { label: "Unchanged", variant: "muted" },
    archived: { label: "Archived: restore it first", variant: "destructive" },
    "other-unit": { label: "Slug taken by another unit", variant: "destructive" },
};

export const editorHref = (kind: AdminKind, slug: string) =>
    kind === "item" ? `/admin/path/item/${slug}` : `/admin/path/${kind}/${slug}`;

/**
 * /admin/path/import: one unit file (the format of `content/units/…json`) in,
 * checked by a dry run, reviewed record by record, then applied as drafts in
 * one go. Records the file doesn't mention are left alone.
 */
export function AdminUnitImport() {
    const importUnit = useImportAdminUnitMutation();
    const [text, setText] = useState("");
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string[]>([]);
    const [result, setResult] = useState<AdminImportResult | null>(null);
    // The text the result is about: editing it again needs a new check.
    const [checked, setChecked] = useState<string | null>(null);
    const [applied, setApplied] = useState(false);

    const change = (next: string) => {
        setText(next);
        setResult(null);
        setApplied(false);
        setError([]);
    };

    const run = (apply: boolean) => {
        const parsed = parseUnitFileJson(text);
        if (!parsed.ok) {
            setError([parsed.error]);
            return;
        }
        setError([]);
        importUnit.mutate(
            { body: parsed.record, apply },
            {
                onSuccess: (r) => {
                    setResult(r);
                    setChecked(text);
                    if (apply && !r.dryRun) {
                        setApplied(true);
                        toast.success(`Imported ${r.unit}: ${r.summary.insert} new, ${r.summary.update} changed, as drafts`);
                    } else if (apply) {
                        toast.error("Nothing was imported: fix what's listed first.");
                    }
                },
                onError: (e) => {
                    setResult(null);
                    setError(adminErrorMessages(e));
                },
            },
        );
    };

    const fresh = result !== null && checked === text;
    const writes = result ? result.summary.insert + result.summary.update : 0;
    const canApply = fresh && !applied && result.errors.length === 0 && writes > 0;
    const changes = result?.changes.filter((c) => c.action !== "skip") ?? [];
    const skipped = result?.changes.filter((c) => c.action === "skip") ?? [];

    return (
        <div className="space-y-6">
            <EditorHeader title="Import a unit file" />

            <Section title="File">
                <p className="text-sm text-muted-foreground">
                    A whole unit in the seed format (like <code className="font-mono">content/units/a1/a1-03-food-and-drink.json</code>): the
                    unit, its items, dialogues, lessons and unit test. Check it first; nothing is written until you apply. Written records
                    become drafts, and records the file doesn&apos;t mention stay as they are.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer text-sm font-medium text-primary underline">
                        Choose a file…
                        <input
                            type="file"
                            accept=".json,application/json"
                            className="sr-only"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                setFileName(file.name);
                                change(await file.text());
                            }}
                        />
                    </label>
                    <span className="text-sm text-muted-foreground">{fileName ?? "or paste it below"}</span>
                </div>
                <textarea
                    value={text}
                    onChange={(e) => change(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    aria-label="Unit file JSON"
                    className={`${FIELD} font-mono text-xs`}
                />
                {error.length > 0 && (
                    <div role="alert" className="space-y-1">
                        {error.map((e) => (
                            <FieldError key={e} message={e} />
                        ))}
                    </div>
                )}
                <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => run(false)} disabled={!text.trim() || importUnit.isPending}>
                        {importUnit.isPending && !result ? "Checking…" : "Check"}
                    </Button>
                    <Button type="button" variant="play" onClick={() => run(true)} disabled={!canApply || importUnit.isPending}>
                        {importUnit.isPending && result ? "Importing…" : `Apply${writes ? ` (${writes})` : ""}`}
                    </Button>
                </div>
            </Section>

            {result && (
                <Section title={applied ? `Imported ${result.unit}` : `Review: ${result.unit}`}>
                    <p className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="success">{result.summary.insert} new</Badge>
                        <Badge variant="accent">{result.summary.update} changed</Badge>
                        <Badge variant="muted">{result.summary.skip} unchanged</Badge>
                        {result.summary.conflict > 0 && <Badge variant="destructive">{result.summary.conflict} blocked</Badge>}
                    </p>
                    {!fresh && <p className="text-sm text-muted-foreground">The text changed since this check: check again.</p>}

                    {result.errors.length > 0 && (
                        <div role="alert" className="space-y-1 rounded-xl bg-destructive/10 p-3 text-sm">
                            <p className="font-semibold text-destructive">Fix these before importing (nothing was written):</p>
                            <ul className="list-disc pl-5">
                                {result.errors.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {!result.validation.ok && (
                        <div className="space-y-1 rounded-xl bg-[var(--brand-warning)]/15 p-3 text-sm">
                            <p className="font-semibold">
                                {applied ? "Imported. Before the next publish, fix:" : "After this import, publishing would still need:"}
                            </p>
                            <ul className="max-h-40 list-disc overflow-y-auto pl-5">
                                {result.validation.errors.map((e) => (
                                    <li key={e}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {writes === 0 && result.errors.length === 0 && (
                        <p className="text-sm text-muted-foreground">Everything in the file is already in the working copy.</p>
                    )}

                    <ul className="space-y-2">
                        {changes.map((c) => (
                            <ChangeRow key={`${c.kind}:${c.slug}`} change={c} applied={applied} />
                        ))}
                    </ul>
                    {skipped.length > 0 && (
                        <details className="text-sm">
                            <summary className="cursor-pointer text-muted-foreground">{skipped.length} unchanged</summary>
                            <ul className="mt-2 space-y-2">
                                {skipped.map((c) => (
                                    <ChangeRow key={`${c.kind}:${c.slug}`} change={c} applied={applied} />
                                ))}
                            </ul>
                        </details>
                    )}
                    {applied && (
                        <Button variant="outline" asChild>
                            <Link href="/admin/path">Back to all content</Link>
                        </Button>
                    )}
                </Section>
            )}
        </div>
    );
}

function ChangeRow({ change: c, applied }: Readonly<{ change: AdminImportResult["changes"][number]; applied: boolean }>) {
    const reason = REASON[c.reason];
    // A new record has no editor to open until it's written.
    const openable = c.action !== "insert" || applied;
    return (
        <li>
            <details className="rounded-xl border-2 border-border">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-3 text-sm">
                    <Badge variant="muted">{c.kind}</Badge>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{c.slug}</span>
                    <Badge variant={reason.variant}>{reason.label}</Badge>
                    {openable && (
                        <Link href={editorHref(c.kind, c.slug)} className="text-xs text-primary underline" onClick={(e) => e.stopPropagation()}>
                            {applied ? "Open" : "Open current"}
                        </Link>
                    )}
                </summary>
                <pre className="max-h-80 overflow-auto border-t border-border p-3 font-mono text-xs">{JSON.stringify(c.record, null, 2)}</pre>
            </details>
        </li>
    );
}
