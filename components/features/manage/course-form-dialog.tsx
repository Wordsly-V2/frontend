"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ICourse } from "@/types/courses/courses.type";
import { useEffect, useState } from "react";

interface CourseFormDialogProps {
    isLoading?: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => void;
    course?: ICourse;
    title: string;
}

export default function CourseFormDialog({
    isLoading,
    isOpen,
    onClose,
    onSubmit,
    course,
    title,
}: Readonly<CourseFormDialogProps>) {
    const [formData, setFormData] = useState({
        name: "",
        coverImageUrl: "",
    });

    useEffect(() => {
        const _setFormData = () => {
            if (course) {
                setFormData({
                    name: course.name,
                    coverImageUrl: course.coverImageUrl || "",
                });
            } else {
                setFormData({
                    name: "",
                    coverImageUrl: "",
                });
            }
        }

        _setFormData();
    }, [course, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSubmit({
                name: formData.name.trim(),
                coverImageUrl: formData.coverImageUrl.trim() || undefined,
            });
        }
    };

    const handleClose = () => {
        setFormData({
            name: "",
            coverImageUrl: "",
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto sm:mx-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm">
                                Course Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Business English"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImageUrl" className="text-sm">Cover Image URL</Label>
                            <Input
                                id="coverImageUrl"
                                type="url"
                                placeholder="https://..."
                                value={formData.coverImageUrl}
                                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                                className="text-sm sm:text-base"
                            />
                            {formData.coverImageUrl && (
                                <div className="mt-2 sm:mt-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">Image Preview:</p>
                                    <div className="relative w-full h-32 sm:h-40 rounded-lg border-2 border-border overflow-hidden bg-muted">
                                        <img
                                            src={formData.coverImageUrl}
                                            alt="Cover preview"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent && !parent.querySelector('.error-placeholder')) {
                                                    const placeholder = document.createElement('div');
                                                    placeholder.className = 'error-placeholder absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground';
                                                    placeholder.innerHTML = '<svg class="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Invalid image URL</p>';
                                                    parent.appendChild(placeholder);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto text-sm">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm">
                            {
                                isLoading ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    course ? 'Update Course' : 'Create Course'
                                )
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
