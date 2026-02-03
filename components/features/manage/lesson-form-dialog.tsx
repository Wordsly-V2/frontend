"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ILesson } from "@/types/courses/courses.type";

interface LessonFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (lesson: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words' | 'orderIndex'>) => void;
    lesson?: ILesson;
    title: string;
}

export default function LessonFormDialog({
    isOpen,
    onClose,
    onSubmit,
    lesson,
    title,
}: Readonly<LessonFormDialogProps>) {
    const [formData, setFormData] = useState({
        name: "",
        coverImageUrl: "",
        maxWords: "",
    });

    useEffect(() => {
        if (lesson) {
            setFormData({
                name: lesson.name,
                coverImageUrl: lesson.coverImageUrl || "",
                maxWords: lesson.maxWords?.toString() || "",
            });
        } else {
            setFormData({
                name: "",
                coverImageUrl: "",
                maxWords: "",
            });
        }
    }, [lesson, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSubmit({
                name: formData.name.trim(),
                coverImageUrl: formData.coverImageUrl.trim() || undefined,
                maxWords: formData.maxWords ? parseInt(formData.maxWords) : undefined,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            coverImageUrl: "",
            maxWords: "",
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Lesson Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Greetings & Introductions"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxWords">Max Words</Label>
                            <Input
                                id="maxWords"
                                type="number"
                                min="1"
                                placeholder="e.g., 20"
                                value={formData.maxWords}
                                onChange={(e) => setFormData({ ...formData, maxWords: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum number of vocabulary words for this lesson
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                            <Input
                                id="coverImageUrl"
                                type="url"
                                placeholder="https://..."
                                value={formData.coverImageUrl}
                                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {lesson ? 'Update' : 'Create'} Lesson
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
