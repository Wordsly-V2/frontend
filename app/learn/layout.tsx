import AuthGuard from "@/components/common/auth-guard/auth-guard";

export default function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthGuard>{children}</AuthGuard>;
}
