import AuthGuard from "@/components/common/auth-guard/auth-guard";

export default function ProfileLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthGuard>{children}</AuthGuard>;
}
