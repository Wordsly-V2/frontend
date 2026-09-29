"use client";

import { FIELD, FieldError } from "@/components/features/admin-path/admin-form-parts";
import { FormDialog } from "@/components/common/form-dialog";
import { Button } from "@/components/ui/button";
import { parseRecordJson } from "@/lib/admin-path/json-import";
import type { AdminRecordBody } from "@/types/admin-path/admin-path.type";
import { Braces } from "lucide-react";
import { useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

/** How an editor's form turns into its record and back. */
export interface JsonBridge {
    /**
     * The form as a record. While the form doesn't pass its schema, the last
     * saved version instead (for a new record, the empty template).
     */
    current: () => { record: AdminRecordBody; fromForm: boolean };
    /** Puts a record into the form for review: the form turns dirty, nothing is saved. */
    load: (record: AdminRecordBody) => void;
}

export function jsonBridge<V extends FieldValues>(
    form: UseFormReturn<V>,
    schema: z.ZodType<V>,
    toRecord: (values: V) => AdminRecordBody,
    fromRecord: (record: AdminRecordBody) => V,
): JsonBridge {
    return {
        current: () => {
            const parsed = schema.safeParse(form.getValues());
            if (parsed.success) return { record: toRecord(parsed.data), fromForm: true };
            return { record: toRecord(form.formState.defaultValues as V), fromForm: false };
        },
        load: (record) => {
            // Keep the defaults, so the form compares against what is saved.
            form.reset(fromRecord(record), { keepDefaultValues: true });
            void form.trigger();
        },
    };
}

/**
 * "Edit as JSON": the record in seed shape in a text box, to edit by hand,
 * paste over or fill from a file. "Put in the form" loads it into the form
 * for review; only Save writes it.
 */
export function JsonToolsButton({
    bridge,
    slug,
    disabled,
}: Readonly<{
    bridge: JsonBridge;
    /** The record being edited (its slug can't change); null for a new one. */
    slug: string | null;
    disabled?: boolean;
}>) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [note, setNote] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const show = () => {
        const { record, fromForm } = bridge.current();
        setText(JSON.stringify(record, null, 2));
        setNote(fromForm ? null : "The form has fields to fix, so this is the last saved version.");
        setError(null);
        setOpen(true);
    };

    const readFile = async (file: File | undefined) => {
        if (!file) return;
        setText(await file.text());
        setNote(`Loaded ${file.name}.`);
        setError(null);
    };

    const apply = (event?: React.FormEvent) => {
        event?.preventDefault();
        // The dialog is portalled, but React events still bubble to the editor's form.
        event?.stopPropagation();
        const parsed = parseRecordJson(text, slug);
        if (!parsed.ok) {
            setError(parsed.error);
            return;
        }
        bridge.load(parsed.record);
        setOpen(false);
    };

    return (
        <>
            <Button type="button" variant="outline" onClick={show} disabled={disabled} className="gap-2">
                <Braces className="h-4 w-4" aria-hidden /> Edit as JSON
            </Button>
            <FormDialog
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Edit as JSON"
                onSubmit={apply}
                submitLabel="Put in the form"
                contentClassName="max-w-3xl max-h-[90dvh] overflow-y-auto sm:mx-auto"
            >
                <p className="text-sm text-muted-foreground">
                    The same shape as the seed files. Edit it, paste a record, or load a .json file, then check it in the form.
                    Nothing is saved until you press Save.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer text-sm font-medium text-primary underline">
                        Load a file…
                        <input
                            type="file"
                            accept=".json,application/json"
                            className="sr-only"
                            onChange={(e) => {
                                void readFile(e.target.files?.[0]);
                                e.target.value = "";
                            }}
                        />
                    </label>
                    {note && <span className="text-sm text-muted-foreground">{note}</span>}
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={20}
                    spellCheck={false}
                    aria-label="Record JSON"
                    className={`${FIELD} font-mono text-xs`}
                />
                {error && <FieldError message={error} />}
            </FormDialog>
        </>
    );
}
