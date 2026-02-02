"use client";

import { useState } from "react";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LessonItemProps {
    readonly lesson: ILesson;
    readonly onAddWords: (lessonId: string, words: Array<{ word: string; meaning: string; pronunciation?: string; partOfSpeech?: string; audioUrl?: string }>) => void;
}

export default function LessonItem({ lesson, onAddWords }: LessonItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [words, setWords] = useState<IWord[]>(lesson.words || []);
    const [isAddingWord, setIsAddingWord] = useState(false);
    const [newWord, setNewWord] = useState({
        word: "",
        meaning: "",
        pronunciation: "",
        partOfSpeech: "",
        audioUrl: "",
    });

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

    const handleAddWord = () => {
        if (newWord.word.trim() && newWord.meaning.trim()) {
            onAddWords(lesson.id, [newWord]);
            setWords([...words, { ...newWord, id: Date.now().toString(), lessonId: lesson.id, createdAt: new Date(), updatedAt: new Date() }]);
            setNewWord({
                word: "",
                meaning: "",
                pronunciation: "",
                partOfSpeech: "",
                audioUrl: "",
            });
            setIsAddingWord(false);
        }
    };

    return (
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
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingWord(!isAddingWord)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm từ
                </Button>
            </div>

            {isExpanded && (
                <div className="border-t border-border p-4 space-y-3">
                    {isAddingWord && (
                        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Từ vựng *"
                                    value={newWord.word}
                                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                                />
                                <Input
                                    placeholder="Nghĩa *"
                                    value={newWord.meaning}
                                    onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                                />
                                <Input
                                    placeholder="Phát âm"
                                    value={newWord.pronunciation}
                                    onChange={(e) => setNewWord({ ...newWord, pronunciation: e.target.value })}
                                />
                                <Input
                                    placeholder="Loại từ (noun, verb...)"
                                    value={newWord.partOfSpeech}
                                    onChange={(e) => setNewWord({ ...newWord, partOfSpeech: e.target.value })}
                                />
                                <Input
                                    placeholder="Audio URL"
                                    value={newWord.audioUrl}
                                    className="col-span-2"
                                    onChange={(e) => setNewWord({ ...newWord, audioUrl: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={handleAddWord}>
                                    Thêm
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddingWord(false);
                                        setNewWord({
                                            word: "",
                                            meaning: "",
                                            pronunciation: "",
                                            partOfSpeech: "",
                                            audioUrl: "",
                                        });
                                    }}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    )}

                    {words.length === 0 && !isAddingWord && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            Chưa có từ vựng nào. Nhấn "Thêm từ" để bắt đầu.
                        </div>
                    )}

                    {words.length > 0 && (
                        <div className="space-y-2">
                            {words.map((word) => (
                                <div
                                    key={word.id}
                                    className="p-3 border border-border rounded-lg bg-background"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{word.word}</h4>
                                                {word.partOfSpeech && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                        {word.partOfSpeech}
                                                    </span>
                                                )}
                                            </div>
                                            {word.pronunciation && (
                                                <p className="text-sm text-muted-foreground">
                                                    /{word.pronunciation}/
                                                </p>
                                            )}
                                            <p className="text-sm mt-1">{word.meaning}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
