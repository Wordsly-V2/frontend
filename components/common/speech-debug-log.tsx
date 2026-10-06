/**
 * The speech recogniser's event log, shown under a speaking exercise with
 * `?speechDebug=1` so a failure on a phone can be read off the screen.
 */
export function SpeechDebugLog({ lines }: Readonly<{ lines: string[] }>) {
    return (
        <pre className="max-h-48 w-full overflow-auto whitespace-pre-wrap break-all rounded-xl bg-muted p-3 text-left font-mono text-[11px] leading-snug text-muted-foreground">
            {lines.length > 0 ? lines.join("\n") : "speech debug: tap the mic"}
        </pre>
    );
}
