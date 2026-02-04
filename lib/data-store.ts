import { ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import { IPaginatedResponse, IPaginationParams } from "@/types/common/pagination.type";
import { dummyCourses } from "./dummy-data";

/**
 * Client-side data store for managing courses, lessons, and words
 * This simulates a backend database with CRUD operations
 */

class DataStore {
    private courses: ICourse[] = [];

    constructor() {
        // Initialize with dummy data
        this.courses = JSON.parse(JSON.stringify(dummyCourses));
    }

    // ============================================
    // COURSE OPERATIONS
    // ============================================

    getAllCourses(): ICourse[] {
        return [...this.courses];
    }

    getPaginatedCourses(params: IPaginationParams): IPaginatedResponse<ICourse> {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const allCourses = [...this.courses];
        const paginatedData = allCourses.slice(startIndex, endIndex);

        return {
            totalItems: allCourses.length,
            totalPages: Math.ceil(allCourses.length / limit),
            currentPage: page,
            data: paginatedData,
        };
    }

    getCourseById(id: string): ICourse | undefined {
        return this.courses.find(c => c.id === id);
    }

    createCourse(course: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>): ICourse {
        const newCourse: ICourse = {
            ...course,
            id: `course-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            lessons: [],
        };
        this.courses.push(newCourse);
        return newCourse;
    }

    updateCourse(id: string, updates: Partial<Omit<ICourse, 'id' | 'createdAt' | 'lessons'>>): ICourse | null {
        const index = this.courses.findIndex(c => c.id === id);
        if (index === -1) return null;

        this.courses[index] = {
            ...this.courses[index],
            ...updates,
            updatedAt: new Date(),
        };
        return this.courses[index];
    }

    deleteCourse(id: string): boolean {
        const index = this.courses.findIndex(c => c.id === id);
        if (index === -1) return false;

        this.courses.splice(index, 1);
        return true;
    }

    // ============================================
    // LESSON OPERATIONS
    // ============================================

    createLesson(courseId: string, lesson: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words'>): ILesson | null {
        const course = this.getCourseById(courseId);
        if (!course) return null;

        const newLesson: ILesson = {
            ...lesson,
            id: `lesson-${Date.now()}`,
            courseId,
            createdAt: new Date(),
            updatedAt: new Date(),
            words: [],
            orderIndex: course.lessons?.length || 0,
        };

        if (!course.lessons) course.lessons = [];
        course.lessons.push(newLesson);
        return newLesson;
    }

    updateLesson(courseId: string, lessonId: string, updates: Partial<Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'words'>>): ILesson | null {
        const course = this.getCourseById(courseId);
        if (!course || !course.lessons) return null;

        const index = course.lessons.findIndex(l => l.id === lessonId);
        if (index === -1) return null;

        course.lessons[index] = {
            ...course.lessons[index],
            ...updates,
            updatedAt: new Date(),
        };
        return course.lessons[index];
    }

    deleteLesson(courseId: string, lessonId: string): boolean {
        const course = this.getCourseById(courseId);
        if (!course || !course.lessons) return false;

        const index = course.lessons.findIndex(l => l.id === lessonId);
        if (index === -1) return false;

        course.lessons.splice(index, 1);
        return true;
    }

    reorderLessons(courseId: string, lessonIds: string[]): boolean {
        const course = this.getCourseById(courseId);
        if (!course || !course.lessons) return false;

        // Reorder lessons based on the provided array
        const reordered: ILesson[] = [];
        for (let i = 0; i < lessonIds.length; i++) {
            const lesson = course.lessons.find(l => l.id === lessonIds[i]);
            if (lesson) {
                lesson.orderIndex = i;
                reordered.push(lesson);
            }
        }

        course.lessons = reordered;
        return true;
    }

    getLessonById(lessonId: string): ILesson | undefined {
        for (const course of this.courses) {
            const lesson = course.lessons?.find(l => l.id === lessonId);
            if (lesson) return lesson;
        }
        return undefined;
    }

    // ============================================
    // WORD OPERATIONS
    // ============================================

    createWord(lessonId: string, word: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>): IWord | null {
        const lesson = this.getLessonById(lessonId);
        if (!lesson) return null;

        const newWord: IWord = {
            ...word,
            id: `word-${Date.now()}-${Math.random()}`,
            lessonId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (!lesson.words) lesson.words = [];
        lesson.words.push(newWord);
        return newWord;
    }

    updateWord(lessonId: string, wordId: string, updates: Partial<Omit<IWord, 'id' | 'lessonId' | 'createdAt'>>): IWord | null {
        const lesson = this.getLessonById(lessonId);
        if (!lesson || !lesson.words) return null;

        const index = lesson.words.findIndex(w => w.id === wordId);
        if (index === -1) return null;

        lesson.words[index] = {
            ...lesson.words[index],
            ...updates,
            updatedAt: new Date(),
        };
        return lesson.words[index];
    }

    deleteWord(lessonId: string, wordId: string): boolean {
        const lesson = this.getLessonById(lessonId);
        if (!lesson || !lesson.words) return false;

        const index = lesson.words.findIndex(w => w.id === wordId);
        if (index === -1) return false;

        lesson.words.splice(index, 1);
        return true;
    }

    moveWord(sourceLessonId: string, targetLessonId: string, wordId: string): boolean {
        const sourceLesson = this.getLessonById(sourceLessonId);
        const targetLesson = this.getLessonById(targetLessonId);
        
        if (!sourceLesson || !targetLesson || !sourceLesson.words) return false;
        if (sourceLessonId === targetLessonId) return false;

        const wordIndex = sourceLesson.words.findIndex(w => w.id === wordId);
        if (wordIndex === -1) return false;

        // Remove word from source lesson
        const [word] = sourceLesson.words.splice(wordIndex, 1);
        
        // Update word's lessonId and add to target lesson
        word.lessonId = targetLessonId;
        word.updatedAt = new Date();
        
        if (!targetLesson.words) targetLesson.words = [];
        targetLesson.words.push(word);

        return true;
    }

    // ============================================
    // BATCH OPERATIONS
    // ============================================

    createMultipleLessons(courseId: string, lessons: Array<Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words'>>): ILesson[] {
        const createdLessons: ILesson[] = [];
        for (const lesson of lessons) {
            const created = this.createLesson(courseId, lesson);
            if (created) createdLessons.push(created);
        }
        return createdLessons;
    }

    createMultipleWords(lessonId: string, words: Array<Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>>): IWord[] {
        const createdWords: IWord[] = [];
        for (const word of words) {
            const created = this.createWord(lessonId, word);
            if (created) createdWords.push(created);
        }
        return createdWords;
    }
}

// Create singleton instance
const dataStore = new DataStore();

// Export functions that use the store
export function getAllCourses(): ICourse[] {
    return dataStore.getAllCourses();
}

export function getPaginatedCourses(params: IPaginationParams): IPaginatedResponse<ICourse> {
    return dataStore.getPaginatedCourses(params);
}

export function getCourseById(id: string): ICourse | undefined {
    return dataStore.getCourseById(id);
}

export function createCourse(course: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>): ICourse {
    return dataStore.createCourse(course);
}

export function updateCourse(id: string, updates: Partial<Omit<ICourse, 'id' | 'createdAt' | 'lessons'>>): ICourse | null {
    return dataStore.updateCourse(id, updates);
}

export function deleteCourse(id: string): boolean {
    return dataStore.deleteCourse(id);
}

export function createLesson(courseId: string, lesson: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words'>): ILesson | null {
    return dataStore.createLesson(courseId, lesson);
}

export function updateLesson(courseId: string, lessonId: string, updates: Partial<Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'words'>>): ILesson | null {
    return dataStore.updateLesson(courseId, lessonId, updates);
}

export function deleteLesson(courseId: string, lessonId: string): boolean {
    return dataStore.deleteLesson(courseId, lessonId);
}

export function reorderLessons(courseId: string, lessonIds: string[]): boolean {
    return dataStore.reorderLessons(courseId, lessonIds);
}

export function getLessonById(lessonId: string): ILesson | undefined {
    return dataStore.getLessonById(lessonId);
}

export function createWord(lessonId: string, word: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>): IWord | null {
    return dataStore.createWord(lessonId, word);
}

export function updateWord(lessonId: string, wordId: string, updates: Partial<Omit<IWord, 'id' | 'lessonId' | 'createdAt'>>): IWord | null {
    return dataStore.updateWord(lessonId, wordId, updates);
}

export function deleteWord(lessonId: string, wordId: string): boolean {
    return dataStore.deleteWord(lessonId, wordId);
}

export function moveWord(sourceLessonId: string, targetLessonId: string, wordId: string): boolean {
    return dataStore.moveWord(sourceLessonId, targetLessonId, wordId);
}

export function createMultipleLessons(courseId: string, lessons: Array<Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words'>>): ILesson[] {
    return dataStore.createMultipleLessons(courseId, lessons);
}

export function createMultipleWords(lessonId: string, words: Array<Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>>): IWord[] {
    return dataStore.createMultipleWords(lessonId, words);
}
