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
  }

export interface IWord {
    id: string;
    word: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    audioUrl?: string;
    lessonId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  