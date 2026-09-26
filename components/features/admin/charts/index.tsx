"use client";

import { Skeleton } from "@/components/common/states";
import dynamic from "next/dynamic";

function ChartPlaceholder() {
    return <Skeleton className="h-[220px] w-full rounded-xl" />;
}

// recharts stays out of the initial bundle: charts load on demand, client-side only.
export const AdminBarChart = dynamic(() => import("./admin-bar-chart").then((m) => m.AdminBarChart), {
    ssr: false,
    loading: ChartPlaceholder,
});

export const AdminPercentLineChart = dynamic(
    () => import("./admin-line-chart").then((m) => m.AdminPercentLineChart),
    { ssr: false, loading: ChartPlaceholder },
);

export type { BarPoint } from "./admin-bar-chart";
export type { LinePoint } from "./admin-line-chart";
