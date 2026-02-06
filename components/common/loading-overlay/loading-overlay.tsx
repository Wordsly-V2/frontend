import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function LoadingOverlay({
    isLoading,
    label = "Loading...",
}: Readonly<{
    isLoading: boolean;
    label?: string;
}>) {
    if (!isLoading) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="rounded-xl bg-card p-6 shadow-lg">
                <LoadingSpinner size="lg" label={label} />
            </div>
        </div>
    );
}
