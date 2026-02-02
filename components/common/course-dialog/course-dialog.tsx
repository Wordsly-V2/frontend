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
import { X, Plus } from "lucide-react";

export type CoursePayload = {
    id?: string;
    tempId?: string; // For stable keys during creation
    title: string;
    cover: string;
};

type CourseDialogProps = {
    isOpen: boolean;
    onSubmit?: (courses: CoursePayload[]) => void;
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
    const [courses, setCourses] = useState<CoursePayload[]>([{
        tempId: crypto.randomUUID(),
        title: "",
        cover: "",
    }]);
    const [coverPreviewErrors, setCoverPreviewErrors] = useState<Record<number, boolean>>({});

    useEffect(() => {
        setTimeout(() => {
            if (course) {
                setCourses([{ ...course, tempId: course.tempId || crypto.randomUUID() }]);
            } else {
                setCourses([{
                    tempId: crypto.randomUUID(),
                    title: "",
                    cover: "",
                }]);
            }
            setCoverPreviewErrors({});
        }, 0);
    }, [course]);

    const resetForm = () => {
        setCourses([{
            tempId: crypto.randomUUID(),
            title: "",
            cover: "",
        }]);
        setCoverPreviewErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose?.();
    };

    const handleSubmit = () => {
        onSubmit?.(courses);
    };

    const addCourse = () => {
        setCourses([...courses, { tempId: crypto.randomUUID(), title: "", cover: "" }]);
    };

    const removeCourse = (index: number) => {
        if (courses.length > 1) {
            setCourses(courses.filter((_, i) => i !== index));
            const newErrors = { ...coverPreviewErrors };
            delete newErrors[index];
            setCoverPreviewErrors(newErrors);
        }
    };

    const updateCourse = (index: number, field: keyof CoursePayload, value: string) => {
        const newCourses = [...courses];
        newCourses[index] = { ...newCourses[index], [field]: value };
        setCourses(newCourses);
        
        if (field === 'cover') {
            const newErrors = { ...coverPreviewErrors };
            delete newErrors[index];
            setCoverPreviewErrors(newErrors);
        }
    };

    const setCoverError = (index: number, hasError: boolean) => {
        setCoverPreviewErrors({ ...coverPreviewErrors, [index]: hasError });
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={handleClose}
        >
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    {courses.map((courseData, index) => (
                        <div key={courseData.tempId || courseData.id || index} className="space-y-3 p-4 border border-border rounded-lg relative">
                            {mode === "create" && courses.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    onClick={() => removeCourse(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={`course-title-${index}`}
                                    className="text-sm font-medium text-foreground"
                                >
                                    Title {courses.length > 1 && `#${index + 1}`}
                                </label>
                                <Input
                                    id={`course-title-${index}`}
                                    disabled={mode === "view"}
                                    value={courseData.title}
                                    onChange={(event) => updateCourse(index, 'title', event.target.value)}
                                    placeholder="Nhập tên khóa học"
                                    autoFocus={index === 0}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={`course-cover-${index}`}
                                    className="text-sm font-medium text-foreground"
                                >
                                    Cover image URL
                                </label>
                                <Input
                                    disabled={mode === "view"}
                                    id={`course-cover-${index}`}
                                    value={courseData.cover}
                                    onChange={(event) => updateCourse(index, 'cover', event.target.value)}
                                    placeholder="https://..."
                                />
                                <div className="mt-2 overflow-hidden rounded-lg border border-border bg-muted">
                                    {courseData.cover.trim() && !coverPreviewErrors[index] ? (
                                        <img
                                            src={courseData.cover}
                                            alt="Cover preview"
                                            className="h-36 w-full object-cover"
                                            onError={() => setCoverError(index, true)}
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
                    ))}
                    {mode === "create" && (
                        <Button
                            variant="outline"
                            onClick={addCourse}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm khóa học
                        </Button>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Hủy
                    </Button>
                    {mode === "create" && <Button onClick={handleSubmit}>Tạo {courses.length > 1 ? `${courses.length} khóa học` : 'khóa học'}</Button>}
                    {mode === "edit" && <Button onClick={handleSubmit}>Cập nhật</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}