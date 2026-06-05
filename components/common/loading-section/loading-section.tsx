import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

export default function LoadingSection({
    isLoading,
    error,
    refetch,
    loadingLabel = 'Loading...',
    errorLabel = 'Error',
    retryLabel = 'Retry',
    isDataNotFound = false,
    dataNotFoundLabel = 'Data not found',
    fullPage = true,
    className,
}: {
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    loadingLabel?: string;
    errorLabel?: string;
    retryLabel?: string;
    isDataNotFound?: boolean;
    dataNotFoundLabel?: string;
    fullPage?: boolean;
    className?: string;
}) {
    const wrapperClass = cn(
        'flex items-center justify-center px-4',
        fullPage ? 'min-h-dvh' : 'py-16',
        className,
    );

    if (isLoading) {
        return (
            <div className={wrapperClass}>
                <LoadingSpinner size='lg' label={loadingLabel} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={wrapperClass}>
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        {errorLabel}: {error}
                    </p>
                    <Button onClick={() => refetch()}>{retryLabel}</Button>
                </div>
            </div>
        );
    }

    if (isDataNotFound) {
        return (
            <div className={wrapperClass}>
                <p className="text-center text-sm text-muted-foreground">{dataNotFoundLabel}</p>
            </div>
        );
    }
}
