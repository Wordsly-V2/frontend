'use client';
import { AppCommandMenu } from '@/components/common/app-command-menu';
import GlobalLoadingOverlay from '@/components/common/loading-overlay/global-loading-overlay';
import OfflineBootstrap from '@/components/common/offline/offline-bootstrap';
import ServiceHealthMonitor from '@/components/common/service-health-monitor';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePreferencesSync } from '@/hooks/usePreferencesSync.hook';
import { getBootUserLoginId } from '@/lib/offline/auth-session';
import { clearOfflineData } from '@/lib/offline/clear-offline-data';
import { buildPersistOptions } from '@/lib/offline/query-persister';
import { queryClient } from '@/lib/queryClient';
import { useAppDispatch } from '@/store/hooks';
import { fetchProfile } from '@/store/slices/userSlice';
import { store } from '@/store/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider } from 'next-themes';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { Provider } from 'react-redux';

function UserProfileBootstrap() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchProfile());
    }, [dispatch]);

    return null;
}

/** Keeps synced preferences (practice/UI/theme) in step with the server. */
function PreferencesSync() {
    usePreferencesSync();
    return null;
}

/**
 * The cache has to be keyed by user before the first paint, but the profile only
 * arrives after a network round trip. The last confirmed identity is cached in
 * localStorage precisely so it can be read synchronously here.
 */
function useBootUserLoginId(): string | null {
    // useSyncExternalStore rather than an effect: the value never changes for
    // the life of the page (an account switch reloads), and the server snapshot
    // has to be null because there is no localStorage during SSR.
    return useSyncExternalStore(
        subscribeToNothing,
        getBootUserLoginId,
        getNoBootUser,
    );
}

/** The boot identity is fixed per page load, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};
const getNoBootUser = (): string | null => null;

/**
 * Wipes device-local data when the account changes.
 *
 * A full reload rather than a remount: the outgoing persister may already have a
 * throttled write in flight, and only a reload guarantees it cannot land in the
 * new user's cache key.
 */
function AccountSwitchGuard() {
    useEffect(() => {
        let cancelled = false;

        const unsubscribe = store.subscribe(() => {
            const profile = store.getState().user.profile;
            if (!profile || cancelled) return;

            const cachedId = getBootUserLoginId();
            if (cachedId && cachedId !== profile.userLoginId) {
                cancelled = true;
                void clearOfflineData().finally(() => {
                    window.location.reload();
                });
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    return null;
}

function CacheProvider({ children }: { children: React.ReactNode }) {
    const bootUserLoginId = useBootUserLoginId();

    const persistOptions = useMemo(
        () => buildPersistOptions(bootUserLoginId),
        [bootUserLoginId],
    );

    // Nobody has signed in on this device yet, so there is nothing to scope a
    // disk cache to — run purely in memory.
    if (!persistOptions) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
        >
            {children}
        </PersistQueryClientProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            storageKey='theme'
            disableTransitionOnChange
        >
            <TooltipProvider delayDuration={200}>
                <Provider store={store}>
                    <ServiceHealthMonitor />
                    <UserProfileBootstrap />
                    <AccountSwitchGuard />
                    <CacheProvider>
                        <OfflineBootstrap />
                        <PreferencesSync />
                        <GlobalLoadingOverlay />
                        {children}
                        <AppCommandMenu />
                    </CacheProvider>
                </Provider>
            </TooltipProvider>
        </ThemeProvider>
    );
}
