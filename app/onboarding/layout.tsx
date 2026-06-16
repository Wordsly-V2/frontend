import AuthGuard from "@/components/common/auth-guard/auth-guard";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthGuard>{children}</AuthGuard>;
}
