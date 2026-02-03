"use client";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { healthCheck } from "@/apis/app.api";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        setTimeout(() => {
            healthCheck().then((res) => {
                console.log(`Health check: ${JSON.stringify(res)}`);
            }).catch((err) => {
                console.log(`Health check error: ${JSON.stringify(err)}`);
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