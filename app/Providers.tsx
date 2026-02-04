"use client";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { healthCheck, ServiceHealth } from "@/apis/app.api";
import { useEffect } from "react";
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
                    else {
                        toast.success(`${service.name} is healthy`, {
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
                {children}
            </QueryClientProvider>
        </Provider>
    );
}