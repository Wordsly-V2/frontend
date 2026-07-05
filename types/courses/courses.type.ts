import type {
    IWordProgressResponse,
    IWordProgressStats,
} from "@/types/word-progress/word-progress.type";

export type { IWordProgressResponse as IWordProgress, IWordProgressStats };

export interface ICourse {
  id: string;
  name: string;
  coverImageUrl?: string;
  userLoginId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lessons?: ILesson[];
  totalLessonsCount?: number;
  totalWordsCount?: number;
}

export interface ICourseWithProgress extends ICourse {
  wordProgressStats?: IWordProgressStats;
}

export interface ILesson {
  id: string;
  name: string;
  coverImageUrl?: string;
  maxWords?: number;
  orderIndex?: number;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  words?: IWord[];
  wordProgressStats?: IWordProgressStats;
}

/** Lightweight lesson for lists (no word details). */
export interface ILessonSummary {
  id: string;
  name: string;
  coverImageUrl?: string | null;
  maxWords?: number | null;
  orderIndex?: number | null;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  wordsCount: number;
}

export interface IWord {
  id: string; word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  imageUrl?: string;
  example?: string;
  lessonId: string; createdAt: Date;
  updatedAt: Date;
  wordProgress?: IWordProgressResponse;
}

export interface ICourseTotalStats {
  totalCourses: number;
  totalLessons: number;
  totalWords: number;
}

export type CreateMyLesson = Omit<Pick<ILesson, 'name' | 'coverImageUrl' | 'maxWords' | 'orderIndex'>, 'maxWords' | 'coverImageUrl'> & { maxWords?: number | null; coverImageUrl?: string | null };

export type CreateUpdateMyCourse = Pick<ILesson, 'name' | 'coverImageUrl'>;

export type CreateMyWord = Pick<IWord, 'word' | 'meaning' | 'pronunciation' | 'partOfSpeech' | 'audioUrl' | 'imageUrl' | 'example'>;

/** Display payload for word detail dialog (IWord or dictionary-sourced data). */
export type WordDetailView = Pick<IWord, 'word' | 'meaning' | 'pronunciation' | 'partOfSpeech' | 'audioUrl' | 'imageUrl' | 'example'> & {
    id?: string;
    courseId?: string;
    lessonId?: string;
};

export interface IWordPronunciation {
  type: string;
  url: string;
}

export interface IWordSearchResult {
  langeekWordId: number;
  word: string;
  meaning: string;
  partOfSpeech: string;
  imageUrl: string;
}

export interface IUserWordSearchResult {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string | null;
  imageUrl: string | null;
  lessonId: string;
  lessonName: string;
  courseId: string;
  courseName: string;
}