"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ICourse } from "@/types/courses/courses.type";

interface CourseFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (course: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>) => void;
    course?: ICourse;
    title: string;
}

export default function CourseFormDialog({
    isOpen,
    onClose,
    onSubmit,
    course,
    title,
}: Readonly<CourseFormDialogProps>) {
    const [formData, setFormData] = useState({
        name: "",
        coverImageUrl: "",
        userLoginId: "user-1",
    });

    useEffect(() => {
        if (course) {
            setFormData({
                name: course.name,
                coverImageUrl: course.coverImageUrl || "",
                userLoginId: course.userLoginId || "user-1",
            });
        } else {
            setFormData({
                name: "",
                coverImageUrl: "",
                userLoginId: "user-1",
            });
        }
    }, [course, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSubmit({
                name: formData.name.trim(),
                coverImageUrl: formData.coverImageUrl.trim() || undefined,
                userLoginId: formData.userLoginId,
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            coverImageUrl: "",
            userLoginId: "user-1",
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
                                Course Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Business English"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
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
                            {formData.coverImageUrl && (
                                <p className="text-xs text-muted-foreground">
                                    Preview will appear on the course card
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {course ? 'Update' : 'Create'} Course
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
