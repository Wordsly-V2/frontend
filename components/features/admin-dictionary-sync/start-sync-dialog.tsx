"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { FIELD_OPTIONS, MODE_OPTIONS } from "@/lib/admin/dictionary-sync";
import { countOf } from "@/lib/admin/vocabulary";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { cn } from "@/lib/utils";
import { useAdminOfficialCoursesQuery } from "@/queries/admin-official-courses.query";
import { useStartSyncMutation, useSyncPreviewQuery } from "@/queries/admin-dictionary-sync.query";
import {
    SYNC_FIELDS,
    type SyncField,
    type SyncMode,
    type SyncScopeInput,
} from "@/types/admin-dictionary-sync/admin-dictionary-sync.type";
import { RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

/** What the dialog syncs when it is opened from a course, a lesson or a selection. */
export interface SyncPreset extends SyncScopeInput {
    /** Shown instead of the scope picker, e.g. `Lesson "Animals"`. */
    label: string;
}

type PickedScope = "all" | "official" | "health" | "course";

const SCOPE_OPTIONS: readonly { value: PickedScope; label: string; hint: string }[] = [
    { value: "health", label: "Words with gaps", hint: "Missing IPA, audio, a meaning, an example or an image" },
    { value: "official", label: "All official courses", hint: "Every word in official courses" },
    { value: "course", label: "One official course", hint: "Pick a course below" },
    { value: "all", label: "All words", hint: "Every word, learners' courses included" },
];

/**
 * Start a Langeek sync: which words (fixed by a preset, or picked here), which
 * fields, and whether to fill only empty ones. Shows how many words it covers
 * before starting, then opens the run's page.
 */
export function StartSyncDialog({
    isOpen,
    onClose,
    preset,
}: Readonly<{ isOpen: boolean; onClose: () => void; preset?: SyncPreset }>) {
    const router = useRouter();
    const [picked, setPicked] = useState<PickedScope>("health");
    const [courseId, setCourseId] = useState<string | null>(null);
    const [fields, setFields] = useState<SyncField[]>([...SYNC_FIELDS]);
    const [mode, setMode] = useState<SyncMode>("fill_missing");
    const start = useStartSyncMutation();

    const scope: SyncScopeInput | null = preset
        ? { scope: preset.scope, targetId: preset.targetId, wordIds: preset.wordIds }
        : picked === "course"
          ? courseId
              ? { scope: "course", targetId: courseId }
              : null
          : { scope: picked };
    const preview = useSyncPreviewQuery(scope ?? { scope: "all" }, isOpen && scope !== null);
    const total = preview.data?.total;

    const toggleField = (field: SyncField, on: boolean) =>
        setFields((current) => (on ? [...current, field] : current.filter((value) => value !== field)));

    const submit = () => {
        if (!scope) return;
        start.mutate(
            { ...scope, fields, mode },
            {
                onSuccess: (job) => {
                    toast.success(`Sync started for ${countOf(job.total, "word")}`);
                    onClose();
                    router.push(`/admin/vocabulary/sync/${job.id}`);
                },
                onError: (err) => toast.error(adminErrorMessages(err)[0]),
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
                    <DialogTitle>Sync with Langeek</DialogTitle>
                    <DialogDescription>
                        Fills word fields from the Langeek dictionary (and Cambridge for UK and US pronunciation). It
                        runs in the background; you can leave the page.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 sm:px-6">
                    <Group title="Words">
                        {preset ? (
                            <p className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm font-medium">
                                {preset.label}
                            </p>
                        ) : (
                            <>
                                <Choices
                                    label="Words"
                                    value={picked}
                                    options={SCOPE_OPTIONS}
                                    onChange={(value) => setPicked(value)}
                                />
                                {picked === "course" ? <CoursePicker value={courseId} onChange={setCourseId} /> : null}
                            </>
                        )}
                    </Group>

                    <Group title="Fields">
                        <ul className="space-y-2">
                            {FIELD_OPTIONS.map((field) => {
                                const id = `sync-field-${field.value}`;
                                return (
                                    <li key={field.value} className="flex items-start gap-3">
                                        <Checkbox
                                            id={id}
                                            checked={fields.includes(field.value)}
                                            onCheckedChange={(checked) => toggleField(field.value, checked === true)}
                                            className="mt-0.5"
                                        />
                                        <label htmlFor={id} className="cursor-pointer text-sm">
                                            <span className="font-medium">{field.label}</span>
                                            <span className="block text-muted-foreground">{field.hint}</span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </Group>

                    <Group title="When a field already has a value">
                        <Choices
                            label="When a field already has a value"
                            value={mode}
                            options={MODE_OPTIONS}
                            onChange={setMode}
                        />
                    </Group>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-5">
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {!scope
                            ? "Pick a course."
                            : preview.isFetching && total === undefined
                              ? "Counting words…"
                              : total === undefined
                                ? "Couldn't count the words."
                                : total === 0
                                  ? "No words to sync."
                                  : `${countOf(total, "word")} to sync`}
                    </p>
                    <span className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={start.isPending}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={!scope || !total || fields.length === 0 || start.isPending}
                            className="flex-1 sm:flex-none"
                        >
                            {start.isPending ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
                            Start sync
                        </Button>
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Group({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    return (
        <section className="space-y-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </section>
    );
}

/** A stacked radio group of cards with a hint each. */
function Choices<T extends string>({
    label,
    value,
    options,
    onChange,
}: Readonly<{
    label: string;
    value: T;
    options: readonly { value: T; label: string; hint: string }[];
    onChange: (value: T) => void;
}>) {
    return (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-2">
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                            active ? "border-primary bg-primary/10" : "border-border/70 hover:bg-muted/40",
                        )}
                    >
                        <span className="font-medium">{option.label}</span>
                        <span className="block text-muted-foreground">{option.hint}</span>
                    </button>
                );
            })}
        </div>
    );
}

/** Official courses by name, newest first; the first page is enough to search from. */
function CoursePicker({ value, onChange }: Readonly<{ value: string | null; onChange: (id: string) => void }>) {
    const [search, setSearch] = useState("");
    const searchQuery = useDebounce(search.trim(), 300);
    const { data, isFetching } = useAdminOfficialCoursesQuery({
        page: 1,
        limit: 20,
        searchQuery: searchQuery || undefined,
    });

    return (
        <div className="space-y-2 rounded-xl border border-border/70 p-3">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search official courses…"
                    aria-label="Search official courses"
                    className="pl-9"
                />
            </div>
            {!data && isFetching ? (
                <p className="text-sm text-muted-foreground">Loading courses…</p>
            ) : !data || data.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No course found.</p>
            ) : (
                <div role="radiogroup" aria-label="Official course" className="max-h-48 space-y-1 overflow-y-auto">
                    {data.items.map((course) => (
                        <button
                            key={course.id}
                            type="button"
                            role="radio"
                            aria-checked={course.id === value}
                            onClick={() => onChange(course.id)}
                            className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                                course.id === value ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted/40",
                            )}
                        >
                            <span className="truncate">{course.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {countOf(course.totalWordsCount, "word")}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** A button that opens the sync dialog with its words already chosen. */
export function SyncWithLangeekButton({
    preset,
    children = "Sync with Langeek",
    variant = "outline",
    size,
    disabled,
}: Readonly<{
    preset?: SyncPreset;
    children?: ReactNode;
    variant?: "outline" | "ghost" | "default" | "secondary";
    size?: "sm" | "default";
    disabled?: boolean;
}>) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={disabled}>
                <RefreshCw className="h-4 w-4" />
                {children}
            </Button>
            {open ? <StartSyncDialog isOpen onClose={() => setOpen(false)} preset={preset} /> : null}
        </>
    );
}
