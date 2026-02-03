"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface WordFormData {
    word: string;
    meaning: string;
    pronunciation: string;
    partOfSpeech: string;
    audioUrl: string;
}

interface WordFormProps {
    initialData?: Partial<WordFormData>;
    onSubmit: (data: WordFormData) => void;
    onCancel: () => void;
    submitText?: string;
    cancelText?: string;
    isSubmitting?: boolean;
}

export default function WordForm({
    initialData,
    onSubmit,
    onCancel,
    submitText = "Thêm",
    cancelText = "Hủy",
    isSubmitting = false,
}: Readonly<WordFormProps>) {
    const [formData, setFormData] = useState<WordFormData>({
        word: initialData?.word || "",
        meaning: initialData?.meaning || "",
        pronunciation: initialData?.pronunciation || "",
        partOfSpeech: initialData?.partOfSpeech || "",
        audioUrl: initialData?.audioUrl || "",
    });

    const handleSubmit = () => {
        if (formData.word.trim() && formData.meaning.trim()) {
            onSubmit(formData);
        }
    };

    const handleChange = (field: keyof WordFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const isValid = formData.word.trim() && formData.meaning.trim();

    return (
        <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="word" className="text-sm font-medium">
                        Từ vựng <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="word"
                        placeholder="Nhập từ vựng"
                        value={formData.word}
                        onChange={(e) => handleChange("word", e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="meaning" className="text-sm font-medium">
                        Nghĩa <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="meaning"
                        placeholder="Nhập nghĩa"
                        value={formData.meaning}
                        onChange={(e) => handleChange("meaning", e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="pronunciation" className="text-sm font-medium">
                        Phát âm
                    </Label>
                    <Input
                        id="pronunciation"
                        placeholder="Ví dụ: həˈloʊ"
                        value={formData.pronunciation}
                        onChange={(e) => handleChange("pronunciation", e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="partOfSpeech" className="text-sm font-medium">
                        Loại từ
                    </Label>
                    <Input
                        id="partOfSpeech"
                        placeholder="noun, verb, adjective..."
                        value={formData.partOfSpeech}
                        onChange={(e) => handleChange("partOfSpeech", e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="audioUrl" className="text-sm font-medium">
                        Audio URL
                    </Label>
                    <Input
                        id="audioUrl"
                        placeholder="https://..."
                        value={formData.audioUrl}
                        onChange={(e) => handleChange("audioUrl", e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                    size="sm"
                >
                    {isSubmitting ? "Đang xử lý..." : submitText}
                </Button>
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    size="sm"
                >
                    {cancelText}
                </Button>
            </div>
        </div>
    );
}
