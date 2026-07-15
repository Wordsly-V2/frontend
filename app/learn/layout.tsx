import AuthGuard from "@/components/common/auth-guard/auth-guard";
import { LearnScreenPrompts } from "@/components/features/learn/learn-screen-prompts";

export default function LearnLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthGuard>
            {children}
            <LearnScreenPrompts />
        </AuthGuard>
    );
}
