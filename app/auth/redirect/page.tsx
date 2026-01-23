"use client";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RedirectPage() {
    const searchParams = useSearchParams();
    const accessToken = searchParams.get("access_token");
    const errorParam = searchParams.get("error");

    useEffect(() => {
        if (errorParam) {
            return;
        }

        if (!accessToken) {
            return;
        }

        localStorage.setItem("access_token", accessToken);
        redirect("/profile");
    }, [accessToken, errorParam]);

    if (errorParam) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                            !
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">
                                Không thể đăng nhập
                            </h1>
                            <p className="text-sm text-slate-500">
                                Đã xảy ra lỗi trong quá trình xác thực.
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {errorParam}
                    </p>
                    <div className="mt-6 flex items-center justify-between text-sm">
                        <Link
                            href="/auth/login"
                            className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                        >
                            Quay lại đăng nhập
                        </Link>
                        <span className="text-slate-400">Mã lỗi có thể tạm thời.</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <LoadingSpinner size="lg" label="Đang chuyển hướng…" />
        </main>
    );
}