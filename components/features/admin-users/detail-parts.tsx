"use client";

import type { ReactNode } from "react";

/** A card-like section on a user's page. */
export function DetailSection({
    title,
    description,
    children,
}: Readonly<{ title: string; description?: string; children: ReactNode }>) {
    return (
        <section className="rounded-2xl border border-border/80 bg-card p-5">
            <h2 className="font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            <div className="mt-4">{children}</div>
        </section>
    );
}

export function Facts({ children }: Readonly<{ children: ReactNode }>) {
    return <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

export function Fact({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 font-medium">{children}</dd>
        </div>
    );
}

export function ActionRow({
    title,
    description,
    children,
}: Readonly<{ title: string; description: ReactNode; children: ReactNode }>) {
    return (
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <div className="text-sm text-muted-foreground">{description}</div>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}
