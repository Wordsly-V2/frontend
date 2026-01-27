'use client';
import { useUserProfile } from "@/hooks/useUser";
import { redirect } from "next/navigation";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    const { data: userProfile } = useUserProfile();

    if (userProfile) {
        redirect("/profile");
    }

    return (
        children
    );
}