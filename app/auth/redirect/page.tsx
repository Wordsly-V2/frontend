"use client";
import { redirect, useSearchParams } from "next/navigation";

export default function RedirectPage() {
    const searchParams = useSearchParams()
    const access_token = searchParams.get('access_token')

    localStorage.setItem('access_token', access_token || '')
    redirect('/profile');
}