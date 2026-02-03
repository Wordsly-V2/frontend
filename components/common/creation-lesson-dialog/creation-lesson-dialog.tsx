"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export interface LessonFormData {
    tempId: string;
    name: string;
    coverImageUrl: string;
    maxWords: string;
}

type CreationLessonDialogProps = {
    isOpen: boolean;
    onSubmit: (lessons: LessonFormData[]) => void;
    onClose: () => void;
    isSubmitting?: boolean;
};

export default function CreationLessonDialog({
    isOpen,
    onSubmit,
    onClose,
    isSubmitting = false,
}: Readonly<CreationLessonDialogProps>) {
    const [newLessons, setNewLessons] = useState<LessonFormData[]>([
        { tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }
    ]);

    const handleClose = () => {
        // Reset form when dialog closes
        setNewLessons([{ tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }]);
        onClose();
    };

    const addLessonField = () => {
        setNewLessons([...newLessons, { tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }]);
    };

    const removeLessonField = (index: number) => {
        if (newLessons.length > 1) {
            setNewLessons(newLessons.filter((_, i) => i !== index));
        }
    };

    const updateLessonField = (index: number, field: keyof LessonFormData, value: string) => {
        const updated = [...newLessons];
        updated[index] = { ...updated[index], [field]: value };
        setNewLessons(updated);
    };

    const handleSubmit = () => {
        const validLessons = newLessons.filter(l => l.name.trim());
        if (validLessons.length > 0) {
            onSubmit(validLessons);
        }
    };

    const validLessonsCount = newLessons.filter(l => l.name.trim()).length;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tạo bài học mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {newLessons.map((lesson, index) => (
                        <div key={lesson.tempId} className="space-y-3 p-4 border border-border rounded-lg bg-card">
                            {newLessons.length > 1 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Bài học #{index + 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => removeLessonField(index)}
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor={`lesson-name-${index}`}>
                                    Tên bài học <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id={`lesson-name-${index}`}
                                    placeholder="Nhập tên bài học"
                                    value={lesson.name}
                                    onChange={(e) => updateLessonField(index, 'name', e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`lesson-cover-${index}`}>
                                    Cover image URL
                                </Label>
                                <Input
                                    id={`lesson-cover-${index}`}
                                    placeholder="https://..."
                                    value={lesson.coverImageUrl}
                                    onChange={(e) => updateLessonField(index, 'coverImageUrl', e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`lesson-maxwords-${index}`}>
                                    Số từ tối đa
                                </Label>
                                <Input
                                    id={`lesson-maxwords-${index}`}
                                    type="number"
                                    placeholder="Ví dụ: 50"
                                    value={lesson.maxWords}
                                    onChange={(e) => updateLessonField(index, 'maxWords', e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="outline"
                        onClick={addLessonField}
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm bài học
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={validLessonsCount === 0 || isSubmitting}
                    >
                        {isSubmitting ? "Đang tạo..." : `Tạo ${validLessonsCount} bài học`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}