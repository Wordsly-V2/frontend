"use client";

import { ErrorState, Skeleton } from "@/components/common/states";
import {
    ArchiveRestoreButtons,
    EditorHeader,
    FIELD,
    Feedback,
    FieldError,
    Section,
    useUnsavedWarning,
} from "@/components/features/admin-path/admin-form-parts";
import { Button } from "@/components/ui/button";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { useAdminRecordQuery, useSaveAdminRecordMutation } from "@/queries/admin-path.query";
import type { AdminKind, AdminRecord, AdminValidation } from "@/types/admin-path/admin-path.type";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** Starting points for a new record (the server checks the full shape). */
const TEMPLATES: Partial<Record<AdminKind, (unit: string) => object>> = {
    unit: () => ({ slug: "", stage: "", order: 1, title: "", titleVi: "", canDo: [""] }),
    dialogue: (unit) => ({
        slug: "",
        unit,
        title: "",
        situationVi: "",
        lines: [
            { speaker: "", en: "", vi: "" },
            { speaker: "You", en: "", vi: "", learnerTurn: true },
        ],
    }),
    checkpoint: (unit) => ({ slug: "", unit, passPercent: 70, questions: [] }),
    placement: () => ({
        slug: "",
        title: "Placement test",
        questions: [{ unit: "", kind: "choice", prompt: "", options: ["", "", ""], answer: 0 }],
    }),
};

const LABEL: Record<AdminKind, string> = {
    unit: "unit",
    item: "item",
    dialogue: "dialogue",
    lesson: "lesson",
    checkpoint: "unit test",
    placement: "placement test",
};

/**
 * The record as JSON, for the kinds without a form of their own (units,
 * dialogues, unit tests, the placement test). The server validates it with the seed's schema and
 * answers with every problem, so this stays a thin text editor.
 */
export function AdminRecordJsonEditor({ kind, slug, unit }: Readonly<{ kind: AdminKind; slug: string; unit?: string }>) {
    const isNew = slug === "new";
    const record = useAdminRecordQuery(kind, isNew ? null : slug);

    if (!isNew && !record.data) {
        if (record.isFetching) return <Skeleton aria-busy className="h-96 w-full rounded-2xl" />;
        return <ErrorState message={`Couldn't load ${LABEL[kind]} ${slug}.`} onRetry={() => void record.refetch()} />;
    }

    const initial = record.data?.record ?? TEMPLATES[kind]?.(unit ?? "") ?? { slug: "" };
    return <JsonForm key={slug} kind={kind} slug={isNew ? null : slug} initial={initial} meta={record.data} />;
}

function JsonForm({
    kind,
    slug,
    initial,
    meta,
}: Readonly<{ kind: AdminKind; slug: string | null; initial: object; meta?: AdminRecord }>) {
    const router = useRouter();
    const save = useSaveAdminRecordMutation();
    const [text, setText] = useState(() => JSON.stringify(initial, null, 2));
    const [saved, setSaved] = useState(text);
    const [parseError, setParseError] = useState<string | null>(null);
    const [serverErrors, setServerErrors] = useState<string[]>([]);
    const [validation, setValidation] = useState<AdminValidation | null>(null);
    const archived = meta?.status === "ARCHIVED";
    useUnsavedWarning(text !== saved);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        setServerErrors([]);
        let body: unknown;
        try {
            body = JSON.parse(text);
        } catch (error) {
            setParseError(error instanceof Error ? error.message : "Not valid JSON");
            return;
        }
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            setParseError("The record must be a JSON object.");
            return;
        }
        setParseError(null);
        save.mutate(
            { kind, slug, body: body as Record<string, unknown> },
            {
                onSuccess: (result) => {
                    const stored = JSON.stringify(result.record, null, 2);
                    setText(stored);
                    setSaved(stored);
                    setValidation(result.validation);
                    toast.success(slug ? "Saved as a draft" : "Created as a draft");
                    if (!slug) router.replace(`/admin/path/${kind}/${result.slug}`);
                },
                onError: (error) => setServerErrors(adminErrorMessages(error)),
            },
        );
    };

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <EditorHeader
                title={slug ? `${LABEL[kind][0].toUpperCase()}${LABEL[kind].slice(1)} ${slug}` : `New ${LABEL[kind]}`}
                status={meta?.status}
                origin={meta?.origin}
            />
            <Section title="Record">
                <p className="text-sm text-muted-foreground">
                    The same shape as in the seed files. The slug can&apos;t change once created.
                </p>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={archived}
                    rows={Math.min(40, Math.max(10, text.split("\n").length))}
                    spellCheck={false}
                    aria-label="Record JSON"
                    className={`${FIELD} font-mono text-xs`}
                />
                {parseError && <FieldError message={parseError} />}
            </Section>

            <Feedback serverErrors={serverErrors} validation={validation} />

            <div className="flex flex-wrap items-center gap-3">
                {!archived && (
                    <Button type="submit" variant="play" disabled={save.isPending}>
                        {save.isPending ? "Saving…" : slug ? "Save draft" : "Create"}
                    </Button>
                )}
                {slug && <ArchiveRestoreButtons kind={kind} slug={slug} archived={archived} onValidation={setValidation} />}
            </div>
        </form>
    );
}
