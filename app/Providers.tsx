'use client';
import { AppCommandMenu } from '@/components/common/app-command-menu';
import GlobalLoadingOverlay from '@/components/common/loading-overlay/global-loading-overlay';
import ServiceHealthMonitor from '@/components/common/service-health-monitor';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePreferencesSync } from '@/hooks/usePreferencesSync.hook';
import { queryClient } from '@/lib/queryClient';
import { useAppDispatch } from '@/store/hooks';
import { fetchProfile } from '@/store/slices/userSlice';
import { store } from '@/store/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';
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
                    <QueryClientProvider client={queryClient}>
                        <PreferencesSync />
                        <GlobalLoadingOverlay />
                        {children}
                        <AppCommandMenu />
                    </QueryClientProvider>
                </Provider>
            </TooltipProvider>
        </ThemeProvider>
    );
}
