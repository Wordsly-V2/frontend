export interface IWordProgressStats {
  totalWords: number;
  newWords: number;
  learningWords: number;
  reviewWords: number;
  dueToday: number;
  overallSuccessRate: number;
}
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
  wordProgressStats: IWordProgressStats;
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
  wordProgressStats: IWordProgressStats;
}

export interface IWordProgress {
  id: string;
  wordId: string;
  userLoginId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReviewedAt?: Date;
  nextReviewAt: Date;
  totalReviews: number;
  correctReviews: number;
  successRate: number;
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
  wordProgress?: IWordProgress;
}

export interface ICourseTotalStats {
  totalCourses: number;
  totalLessons: number;
  totalWords: number;
}

export type CreateMyLesson = Pick<ILesson, 'name' | 'coverImageUrl' | 'maxWords' | 'orderIndex'>;

export type CreateUpdateMyCourse = Pick<ILesson, 'name' | 'coverImageUrl'>;

export type CreateMyWord = Pick<IWord, 'word' | 'meaning' | 'pronunciation' | 'partOfSpeech' | 'audioUrl' | 'imageUrl' | 'example'>;

export interface IWordPronunciation {
  type: string;
  url: string;
}

export interface IWordSearchResult {
  word: string;
  meaning: string;
  partOfSpeech: string;
  imageUrl: string;
}