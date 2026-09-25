import { cn } from "@/lib/utils";
import { Fragment } from "react";

/**
 * The small Markdown subset Path explanations use (`EXPLAIN.bodyVi`):
 * paragraphs, `-` and `1.` lists, pipe tables and `**bold**`. Built as React
 * nodes, never as HTML, so content can't inject markup.
 */
export function MiniMarkdown({ source, className }: Readonly<{ source: string; className?: string }>) {
    return (
        <div className={cn("space-y-3 text-[15px] leading-relaxed", className)}>
            {toBlocks(source).map((block, i) => (
                <Fragment key={i}>{renderBlock(block)}</Fragment>
            ))}
        </div>
    );
}

type Block =
    | { kind: "p"; lines: string[] }
    | { kind: "ul" | "ol"; items: string[] }
    | { kind: "table"; rows: string[][] };

function toBlocks(source: string): Block[] {
    const blocks: Block[] = [];
    for (const chunk of source.split(/\n\s*\n/)) {
        const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;
        if (lines.every((l) => l.startsWith("|"))) {
            const rows = lines
                .filter((l) => !/^\|[\s|:-]+\|$/.test(l))
                .map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
            blocks.push({ kind: "table", rows });
        } else if (lines.every((l) => /^[-*] /.test(l))) {
            blocks.push({ kind: "ul", items: lines.map((l) => l.slice(2)) });
        } else if (lines.every((l) => /^\d+\. /.test(l))) {
            blocks.push({ kind: "ol", items: lines.map((l) => l.replace(/^\d+\. /, "")) });
        } else {
            blocks.push({ kind: "p", lines });
        }
    }
    return blocks;
}

function renderBlock(block: Block) {
    switch (block.kind) {
        case "p":
            return (
                <p>
                    {block.lines.map((line, i) => (
                        <Fragment key={i}>
                            {i > 0 && <br />}
                            <Inline text={line} />
                        </Fragment>
                    ))}
                </p>
            );
        case "ul":
        case "ol": {
            const List = block.kind;
            return (
                <List className={cn("space-y-1 pl-5", block.kind === "ul" ? "list-disc" : "list-decimal")}>
                    {block.items.map((item, i) => (
                        <li key={i}>
                            <Inline text={item} />
                        </li>
                    ))}
                </List>
            );
        }
        case "table": {
            const [head, ...body] = block.rows;
            return (
                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/60">
                            <tr>
                                {head.map((cell, i) => (
                                    <th key={i} className="px-3 py-2 font-bold">
                                        <Inline text={cell} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {body.map((row, r) => (
                                <tr key={r} className="border-t border-border">
                                    {row.map((cell, i) => (
                                        <td key={i} className="px-3 py-2">
                                            <Inline text={cell} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    }
}

/** `**bold**` spans; everything else is plain text. */
function Inline({ text }: Readonly<{ text: string }>) {
    return (
        <>
            {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
                    <strong key={i} className="font-bold text-foreground">
                        {part.slice(2, -2)}
                    </strong>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                ),
            )}
        </>
    );
}
