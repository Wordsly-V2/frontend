"use client";

import { Badge } from "@/components/ui/badge";
import { ExampleLine, SpeakButton } from "@/components/features/path/path-speech";
import type { PathItem, PathItemType } from "@/types/path/path.type";
import { Lightbulb } from "lucide-react";

const TYPE_LABELS: Record<PathItemType, string> = {
    LEXICAL: "Word",
    PHRASE: "Phrase",
    PATTERN: "Pattern",
    GRAMMAR: "Grammar",
};

/**
 * One learn item as it is first presented: the English, how it sounds, what
 * it means, examples, and the note on what Vietnamese learners get wrong.
 */
export function PathItemCard({ item }: Readonly<{ item: PathItem }>) {
    return (
        <article className="glass-surface space-y-5 rounded-3xl p-5 sm:p-7">
            <header className="space-y-2">
                <Badge variant="muted">{TYPE_LABELS[item.type]}</Badge>
                <div className="flex items-center gap-3">
                    <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                        {item.text}
                    </h2>
                    {item.type !== "GRAMMAR" && (
                        <SpeakButton
                            text={item.pattern ? item.examples[0]?.en ?? item.text : item.text}
                            audioUrl={item.audioUrl}
                            size="icon-lg"
                        />
                    )}
                </div>
                {item.ipa && <p className="font-mono text-muted-foreground">{item.ipa}</p>}
                <p className="text-lg font-semibold">{item.meaningVi}</p>
            </header>

            {item.pattern && (
                <section className="rounded-2xl bg-primary/5 p-4">
                    <p className="font-display text-lg font-bold">
                        {item.pattern.template.split(/(\{\w+\})/g).map((part, i) =>
                            /^\{\w+\}$/.test(part) ? (
                                <span
                                    key={i}
                                    className="mx-0.5 rounded-lg border-2 border-dashed border-primary/40 px-2 text-primary"
                                >
                                    …
                                </span>
                            ) : (
                                <span key={i}>{part}</span>
                            ),
                        )}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {item.pattern.slots.map((slot) => (
                            <li key={slot.name}>
                                <span className="font-semibold text-foreground">…</span> = {slot.hintVi}
                                {": "}
                                {slot.options.join(", ")}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {item.grammar && (
                <section className="space-y-3">
                    <p>{item.grammar.ruleVi}</p>
                    <ul className="space-y-2">
                        {item.grammar.forms.map((form) => (
                            <li key={form.label} className="rounded-2xl border border-border bg-card p-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    {form.label}
                                </p>
                                <p className="font-medium">{form.example}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {item.examples.length > 0 && (
                <section className="space-y-3">
                    {item.examples.map((example) => (
                        <ExampleLine key={example.en} example={example} />
                    ))}
                </section>
            )}

            {(item.noteVi || (item.grammar && item.grammar.pitfallsVi.length > 0)) && (
                <aside className="flex gap-3 rounded-2xl bg-[var(--brand-warning)]/15 p-4 text-sm">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-orange)]" aria-hidden />
                    <div className="space-y-1">
                        {item.noteVi && <p>{item.noteVi}</p>}
                        {item.grammar?.pitfallsVi.map((pitfall) => <p key={pitfall}>{pitfall}</p>)}
                    </div>
                </aside>
            )}
        </article>
    );
}
