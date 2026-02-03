"use client";

import { useState } from "react";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus, GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WordCard from "@/components/common/word-card/word-card";
import WordForm, { WordFormData } from "@/components/common/word-form/word-form";
import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";

interface LessonItemProps {
    readonly lesson: ILesson;
    readonly onAddWords: (lessonId: string, words: Array<{ word: string; meaning: string; pronunciation?: string; partOfSpeech?: string; audioUrl?: string }>) => void;
    readonly onDeleteLesson?: (lessonId: string) => void;
    readonly onDeleteWord?: (lessonId: string, wordId: string) => void;
}

export default function LessonItem({ lesson, onAddWords, onDeleteLesson, onDeleteWord }: LessonItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [words, setWords] = useState<IWord[]>(lesson.words || []);
    const [isAddingWord, setIsAddingWord] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [wordToDelete, setWordToDelete] = useState<string | null>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddWord = (data: WordFormData) => {
        const newWordData = {
            word: data.word,
            meaning: data.meaning,
            pronunciation: data.pronunciation || undefined,
            partOfSpeech: data.partOfSpeech || undefined,
            audioUrl: data.audioUrl || undefined,
        };

        onAddWords(lesson.id, [newWordData]);
        
        // Optimistically update local state
        setWords([
            ...words,
            {
                ...newWordData,
                id: Date.now().toString(),
                lessonId: lesson.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ]);
        setIsAddingWord(false);
    };

    const handleDeleteWord = (wordId: string) => {
        if (onDeleteWord) {
            onDeleteWord(lesson.id, wordId);
            setWords(words.filter(w => w.id !== wordId));
        }
        setWordToDelete(null);
    };

    const confirmDeleteWord = (wordId: string) => {
        setWordToDelete(wordId);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className="border border-border rounded-lg bg-card overflow-hidden"
            >
                <div className="flex items-center gap-2 p-4 hover:bg-muted/50">
                    <button
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 flex-1 text-left"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                            <h3 className="font-medium">{lesson.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {words.length} từ vựng {lesson.maxWords && `/ ${lesson.maxWords} từ tối đa`}
                            </p>
                        </div>
                    </button>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddingWord(!isAddingWord)}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm từ
                        </Button>
                        {onDeleteLesson && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeleteConfirmOpen(true)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3">
                        {isAddingWord && (
                            <WordForm
                                onSubmit={handleAddWord}
                                onCancel={() => setIsAddingWord(false)}
                                submitText="Thêm từ"
                            />
                        )}

                        {words.length === 0 && !isAddingWord && (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                Chưa có từ vựng nào. Nhấn &ldquo;Thêm từ&rdquo; để bắt đầu.
                            </div>
                        )}

                        {words.length > 0 && (
                            <div className="space-y-2">
                                {words.map((word) => (
                                    <WordCard
                                        key={word.id}
                                        word={word}
                                        onDelete={onDeleteWord ? confirmDeleteWord : undefined}
                                        showActions={!!onDeleteWord}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete lesson confirmation */}
            {onDeleteLesson && (
                <ConfirmDialog
                    isOpen={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={() => {
                        onDeleteLesson(lesson.id);
                        setDeleteConfirmOpen(false);
                    }}
                    title="Xóa bài học"
                    description={`Bạn có chắc chắn muốn xóa bài học &ldquo;${lesson.name}&rdquo;? Tất cả từ vựng trong bài học này cũng sẽ bị xóa.`}
                    confirmText="Xóa"
                    variant="destructive"
                />
            )}

            {/* Delete word confirmation */}
            {wordToDelete && (
                <ConfirmDialog
                    isOpen={!!wordToDelete}
                    onClose={() => setWordToDelete(null)}
                    onConfirm={() => handleDeleteWord(wordToDelete)}
                    title="Xóa từ vựng"
                    description="Bạn có chắc chắn muốn xóa từ vựng này?"
                    confirmText="Xóa"
                    variant="destructive"
                />
            )}
        </>
    );
}
