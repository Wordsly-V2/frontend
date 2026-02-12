import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LoadingSection({
    isLoading,
    error,
    refetch,
    loadingLabel = 'Loading...',
    errorLabel = 'Error',
    retryLabel = 'Retry',
    isDataNotFound = false,
    dataNotFoundLabel = 'Data not found',
}: {
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    loadingLabel?: string;
    errorLabel?: string;
    retryLabel?: string;
    isDataNotFound?: boolean;
    dataNotFoundLabel?: string;
}) {
    if (isLoading) {
        return (
            <main className='min-h-dvh bg-slate-50 flex items-center justify-center px-4'>
                <LoadingSpinner size='lg' label={loadingLabel} />
            </main>
        );
    }

    if (error) {
        return (
            <main className='min-h-dvh bg-slate-50 flex items-center justify-center px-4'>
                <div>
                    <div className='text-center text-sm text-muted-foreground'>{errorLabel}: {error}</div>
                </div>
                <Button
                    onClick={() => {
                        refetch();
                    }}
                >
                    {retryLabel}
                </Button>
            </main>
        );
    }

    if (isDataNotFound) {
        return (
            <main className='min-h-dvh bg-slate-50 flex items-center justify-center px-4'>
                <div className='text-center text-sm text-muted-foreground'>{dataNotFoundLabel}</div>
            </main>
        );
    }
}
