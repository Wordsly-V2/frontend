import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function LoadingSection({ isLoading, error, refetch, loadingLabel = 'Loading...', errorLabel = 'Error', retryLabel = 'Retry' }: { isLoading: boolean, error: string | null, refetch: () => void, loadingLabel?: string, errorLabel?: string, retryLabel?: string }) {
    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <LoadingSpinner size="lg" label={loadingLabel} />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div>{errorLabel}: {error}</div>
                <Button onClick={() => {
                    refetch();
                }}>{retryLabel}</Button>
            </main>
        );
    }
}