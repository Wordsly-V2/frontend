import AuthGuard from "@/components/common/auth-guard/auth-guard";

/**
 * `/progress` used to roll its own signed-out check off `useUser`, which is not
 * offline-aware — a dropped connection read as "logged out" and hid the report
 * behind a Log in button. It now protects itself the same way `/learn`,
 * `/manage` and `/profile` do.
 */
export default function ProgressLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return <AuthGuard>{children}</AuthGuard>;
}
