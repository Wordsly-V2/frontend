import { ErrorState } from './error-state';

/**
 * Standard wrapper for the repeated
 * `isLoading || isError || !data ? <fallback/> : children` pattern.
 * Renders skeleton while loading, ErrorState on failure, children otherwise.
 */
export function QueryBoundary({
    isLoading,
    isError,
    isEmpty = false,
    skeleton,
    empty,
    errorMessage,
    onRetry,
    children,
}: {
    isLoading: boolean;
    isError?: boolean;
    isEmpty?: boolean;
    skeleton: React.ReactNode;
    empty?: React.ReactNode;
    errorMessage?: string;
    onRetry?: () => void;
    children: React.ReactNode;
}) {
    if (isLoading) return <>{skeleton}</>;
    if (isError)
        return <ErrorState message={errorMessage} onRetry={onRetry} />;
    if (isEmpty && empty) return <>{empty}</>;
    return <>{children}</>;
}
