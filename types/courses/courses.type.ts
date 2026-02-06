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

export interface ICourseTotalStats {
    totalCourses: number;
    totalLessons: number;
    totalWords: number;
}

export type CreateMyLesson = Pick<ILesson, 'name' | 'coverImageUrl' | 'maxWords' | 'orderIndex'>;

export type CreateUpdateMyCourse = Pick<ILesson, 'name' | 'coverImageUrl'>;

export type CreateMyWord = Pick<IWord, 'word' | 'meaning' | 'pronunciation' | 'partOfSpeech' | 'audioUrl'>;

export interface IDictionaryWord {
  word: string;
  phonetic?: string;
  phonetics: PhoneticDto[];
  meanings: MeaningDto[];
  sourceUrls?: string[];
}

export interface PhoneticDto {
  text?: string;
  audio?: string;
  sourceUrl?: string;
}

export interface MeaningDto {
  partOfSpeech: string;
  definitions: DefinitionDto[];
  synonyms: string[];
  antonyms: string[];
}

export interface DefinitionDto {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}
