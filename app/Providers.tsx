"use client";
import { getServiceHealth, healthCheck, ServiceHealth } from "@/apis/app.api";
import { AppCommandMenu } from "@/components/common/app-command-menu";
import GlobalLoadingOverlay from "@/components/common/loading-overlay/global-loading-overlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { useAppDispatch } from "@/store/hooks";
import { fetchProfile } from "@/store/slices/userSlice";
import { store } from "@/store/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";

const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function notifyUnhealthyServices(services: ServiceHealth[]) {
    for (const service of services) {
        if (service.status === "unhealthy") {
            toast.warning(`${service.name} is unhealthy`, {
                description: service.message,
            });
        }
    }
}

function runHealthChecks() {
    getServiceHealth();
    healthCheck()
        .then(notifyUnhealthyServices)
        .catch(() => undefined);
}

function ServiceHealthMonitor() {
    useEffect(() => {
        const initialTimeout = setTimeout(runHealthChecks, 100);
        const interval = setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, []);

    return null;
}

function UserProfileBootstrap() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchProfile());
    }, [dispatch]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="theme"
            disableTransitionOnChange
        >
            <TooltipProvider delayDuration={200}>
                <Provider store={store}>
                    <ServiceHealthMonitor />
                    <UserProfileBootstrap />
                    <QueryClientProvider client={queryClient}>
                        <GlobalLoadingOverlay />
                        {children}
                        <AppCommandMenu />
                    </QueryClientProvider>
                </Provider>
            </TooltipProvider>
        </ThemeProvider>
    );
}