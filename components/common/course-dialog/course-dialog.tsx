/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export type CoursePayload = {
    id?: string;
    title: string;
    cover: string;
};

type CourseDialogProps = {
    isOpen: boolean;
    onSubmit?: (course: CoursePayload) => void;
    onClose?: () => void;
    mode: "create" | "edit" | "view";
    dialogTitle: string;
    course?: CoursePayload;
};

export default function CourseDialog({
    isOpen,
    onSubmit,
    onClose,
    mode,
    dialogTitle,
    course = undefined,
}: Readonly<CourseDialogProps>) {
    const [courseData, setCourseData] = useState<CoursePayload>(course ?? {
        title: "",
        cover: "",
    });
    const [isCoverPreviewError, setIsCoverPreviewError] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setCourseData(course ?? {
                title: "",
                cover: "",
            });
        }, 0);
    }, [course]);

    const resetForm = () => {
        setCourseData({
            title: "",
            cover: "",
        });
        setIsCoverPreviewError(false);
    };

    const handleClose = () => {
        resetForm();
        onClose?.();
    };

    const handleSubmit = () => {
        onSubmit?.(courseData);
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={handleClose}
        >
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="course-title"
                            className="text-sm font-medium text-foreground"
                        >
                            Title
                        </label>
                        <Input
                            id="course-title"
                            disabled={mode === "view"}
                            value={courseData.title}
                            onChange={(event) => setCourseData(prev => ({ ...prev, title: event.target.value }))}
                            placeholder="Nhập tên khóa học"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="course-cover"
                            className="text-sm font-medium text-foreground"
                        >
                            Cover image URL
                        </label>
                        <Input
                            disabled={mode === "view"}
                            id="course-cover"
                            value={courseData.cover}
                            onChange={(event) => {
                                setCourseData(prev => ({ ...prev, cover: event.target.value }));
                                setIsCoverPreviewError(false);
                            }}
                            placeholder="https://..."
                        />
                        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted">
                            {courseData.cover.trim() && !isCoverPreviewError ? (
                                <img
                                    src={courseData.cover}
                                    alt="Cover preview"
                                    className="h-36 w-full object-cover"
                                    onError={() => setIsCoverPreviewError(true)}
                                />
                            ) : (
                                <div className="h-36 w-full flex items-center justify-center text-xs text-muted-foreground">
                                    {courseData.cover.trim()
                                        ? "Không tải được ảnh. Vui lòng kiểm tra URL."
                                        : "Ảnh preview sẽ hiển thị ở đây."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Hủy
                    </Button>
                    {mode === "create" && <Button onClick={handleSubmit}>Tạo</Button>}
                    {mode === "edit" && <Button onClick={handleSubmit}>Cập nhật</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}