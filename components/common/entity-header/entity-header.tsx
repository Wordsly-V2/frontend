"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";

interface EntityHeaderProps {
    title: string;
    subtitle?: string;
    coverImageUrl?: string;
    onDelete?: () => void;
    onEdit?: () => void;
    imageHeight?: string;
    children?: React.ReactNode;
}

export default function EntityHeader({
    title,
    subtitle,
    coverImageUrl,
    onDelete,
    onEdit,
    imageHeight = "h-64",
    children,
}: Readonly<EntityHeaderProps>) {
    return (
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {coverImageUrl && (
                <div className={`relative ${imageHeight} w-full`}>
                    <Image
                        src={coverImageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                </div>
            )}
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-semibold mb-2">{title}</h1>
                        {subtitle && (
                            <p className="text-muted-foreground">{subtitle}</p>
                        )}
                        {children}
                    </div>
                    <div className="flex gap-2">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onEdit}
                                title="Chỉnh sửa"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onDelete}
                                title="Xóa"
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
