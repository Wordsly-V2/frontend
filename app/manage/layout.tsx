import AuthGuard from "@/components/common/auth-guard/auth-guard";

export default function ManageLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthGuard>{children}</AuthGuard>;
}
