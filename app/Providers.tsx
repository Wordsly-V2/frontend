"use client";
import { getServiceHealth, healthCheck, ServiceHealth } from "@/apis/app.api";
import { AppCommandMenu } from "@/components/common/app-command-menu";
import GlobalLoadingOverlay from "@/components/common/loading-overlay/global-loading-overlay";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { store } from "@/store/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        setTimeout(() => {
            getServiceHealth();
            healthCheck().then((services: ServiceHealth[]) => {
                for (const service of services) {
                    if (service.status === 'unhealthy') {
                        toast.warning(`${service.name} is unhealthy`, {
                            description: service.message,
                        });
                    }
                }
            }).catch(() => {
                toast.error("System Status", {
                    description: "Unable to connect to backend services",
                });
            });
        }, 100);
    }, []);

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