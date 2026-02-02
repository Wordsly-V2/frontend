import axiosInstance from "@/lib/axios";
import { ICourse, ILesson, IWord } from "@/types/courses/courses.type";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = void> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface GetMyCoursesResponse {
    courses: ICourse[];
}

export interface CreateMyCoursesRequest {
    courses: Array<{
        name: string;
        coverImageUrl?: string;
    }>;
}

export interface CreateMyCoursesResponse {
    success: boolean;
    message: string;
    courses: ICourse[];
}

export interface GetCourseByIdResponse {
    course: ICourse;
}

export interface CreateLessonsRequest {
    lessons: Array<{
        name: string;
        coverImageUrl?: string;
        maxWords?: number;
    }>;
}

export interface CreateLessonsResponse {
    success: boolean;
    message: string;
    lessons: ILesson[];
}

export interface UpdateLessonOrderRequest {
    orderIndex: number;
}

export interface UpdateLessonOrderResponse {
    success: boolean;
    message: string;
    lesson: ILesson;
}

export interface CreateWordsRequest {
    words: Array<{
        word: string;
        meaning: string;
        pronunciation?: string;
        partOfSpeech?: string;
        audioUrl?: string;
    }>;
}

export interface CreateWordsResponse {
    success: boolean;
    message: string;
    words: IWord[];
}

export interface GetWordsInLessonResponse {
    words: IWord[];
}

// ============================================
// API Functions
// ============================================

export const getMyCourses = async (): Promise<ICourse[]> => {
    const response = await axiosInstance.get<GetMyCoursesResponse | ICourse[]>('/courses/me/my-courses');
    // Handle both response formats: { courses: [...] } or [...]
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return (response.data as GetMyCoursesResponse).courses || [];
}

export const createMyCourses = async (payload: CreateMyCoursesRequest): Promise<CreateMyCoursesResponse> => {
    const response = await axiosInstance.post<CreateMyCoursesResponse>('/courses/me/my-courses', payload);
    return response.data;
}

export const getCourseById = async (courseId: string): Promise<ICourse> => {
    const response = await axiosInstance.get<GetCourseByIdResponse | ICourse>(`/courses/${courseId}`);
    // Handle both response formats: { course: {...} } or {...}
    if ('course' in response.data) {
        return response.data.course;
    }
    return response.data;
}

export const createLessons = async (
    courseId: string, 
    payload: CreateLessonsRequest
): Promise<CreateLessonsResponse> => {
    const response = await axiosInstance.post<CreateLessonsResponse>(
        `/courses/${courseId}/lessons`, 
        payload
    );
    return response.data;
}

export const updateLessonOrder = async (
    courseId: string, 
    lessonId: string, 
    orderIndex: number
): Promise<UpdateLessonOrderResponse> => {
    const response = await axiosInstance.patch<UpdateLessonOrderResponse>(
        `/courses/${courseId}/lessons/${lessonId}/order`, 
        { orderIndex }
    );
    return response.data;
}

export const createWords = async (
    lessonId: string, 
    payload: CreateWordsRequest
): Promise<CreateWordsResponse> => {
    const response = await axiosInstance.post<CreateWordsResponse>(
        `/lessons/${lessonId}/words`, 
        payload
    );
    return response.data;
}

export const getWordsInLesson = async (lessonId: string): Promise<IWord[]> => {
    const response = await axiosInstance.get<GetWordsInLessonResponse | IWord[]>(`/lessons/${lessonId}/words`);
    // Handle both response formats: { words: [...] } or [...]
    if (Array.isArray(response.data)) {
        return response.data;
    }
    return (response.data as GetWordsInLessonResponse).words || [];
}