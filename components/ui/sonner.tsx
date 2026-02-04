"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            position="top-right"
            expand={true}
            visibleToasts={4}
            richColors
            closeButton
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
                    closeButton: "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border",
                    success: "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-900 dark:group-[.toaster]:bg-green-950 dark:group-[.toaster]:border-green-800 dark:group-[.toaster]:text-green-100",
                    error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-900 dark:group-[.toaster]:bg-red-950 dark:group-[.toaster]:border-red-800 dark:group-[.toaster]:text-red-100",
                    warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:border-yellow-200 group-[.toaster]:text-yellow-900 dark:group-[.toaster]:bg-yellow-950 dark:group-[.toaster]:border-yellow-800 dark:group-[.toaster]:text-yellow-100",
                    info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-900 dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:border-blue-800 dark:group-[.toaster]:text-blue-100",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
