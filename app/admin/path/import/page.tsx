import { AdminUnitImport } from "@/components/features/admin-path/unit-import";

/** /admin/path/import: import one unit file, reviewed by a dry run first. */
export default function AdminUnitImportPage() {
    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-4xl">
                <AdminUnitImport />
            </div>
        </main>
    );
}
