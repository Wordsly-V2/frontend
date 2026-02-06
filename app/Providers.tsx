"use client";
import { healthCheck, ServiceHealth } from "@/apis/app.api";
import GlobalLoadingOverlay from "@/components/common/loading-overlay/global-loading-overlay";
import { queryClient } from "@/lib/queryClient";
import { store } from "@/store/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { toast } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        setTimeout(() => {
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
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <GlobalLoadingOverlay />
                {children}
            </QueryClientProvider>
        </Provider>
    );
}