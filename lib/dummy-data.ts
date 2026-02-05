// import { ICourse, ILesson, IWord } from "@/types/courses/courses.type";
// import { IPaginatedResponse, IPaginationParams } from "@/types/common/pagination.type";

// /**
//  * Dummy data service for development and testing
//  * This provides realistic sample data for the English learning app
//  */

// // Sample words with proper CEFR levels and practical vocabulary
// const beginnerWords: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         word: "hello",
//         meaning: "xin chào",
//         pronunciation: "həˈloʊ",
//         partOfSpeech: "interjection",
//         audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/hello--_us_1.mp3"
//     },
//     {
//         word: "goodbye",
//         meaning: "tạm biệt",
//         pronunciation: "ɡʊdˈbaɪ",
//         partOfSpeech: "interjection",
//         audioUrl: "https://ssl.gstatic.com/dictionary/static/sounds/20200429/goodbye--_us_1.mp3"
//     },
//     {
//         word: "thank you",
//         meaning: "cảm ơn",
//         pronunciation: "θæŋk juː",
//         partOfSpeech: "phrase",
//     },
//     {
//         word: "please",
//         meaning: "làm ơn",
//         pronunciation: "pliːz",
//         partOfSpeech: "adverb",
//     },
//     {
//         word: "sorry",
//         meaning: "xin lỗi",
//         pronunciation: "ˈsɑːri",
//         partOfSpeech: "adjective",
//     },
// ];

// const travelWords: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         word: "airport",
//         meaning: "sân bay",
//         pronunciation: "ˈerˌpɔːrt",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "hotel",
//         meaning: "khách sạn",
//         pronunciation: "hoʊˈtel",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "ticket",
//         meaning: "vé",
//         pronunciation: "ˈtɪkɪt",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "passport",
//         meaning: "hộ chiếu",
//         pronunciation: "ˈpæspɔːrt",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "luggage",
//         meaning: "hành lý",
//         pronunciation: "ˈlʌɡɪdʒ",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "reservation",
//         meaning: "đặt chỗ",
//         pronunciation: "ˌrezərˈveɪʃn",
//         partOfSpeech: "noun",
//     },
// ];

// const workWords: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         word: "meeting",
//         meaning: "cuộc họp",
//         pronunciation: "ˈmiːtɪŋ",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "deadline",
//         meaning: "hạn chót",
//         pronunciation: "ˈdedˌlaɪn",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "colleague",
//         meaning: "đồng nghiệp",
//         pronunciation: "ˈkɑːliːɡ",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "presentation",
//         meaning: "bài thuyết trình",
//         pronunciation: "ˌprezənˈteɪʃn",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "schedule",
//         meaning: "lịch trình",
//         pronunciation: "ˈskedʒuːl",
//         partOfSpeech: "noun",
//     },
// ];

// const dailyLifeWords: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         word: "breakfast",
//         meaning: "bữa sáng",
//         pronunciation: "ˈbrekfəst",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "grocery",
//         meaning: "cửa hàng tạp hóa",
//         pronunciation: "ˈɡroʊsəri",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "neighbor",
//         meaning: "hàng xóm",
//         pronunciation: "ˈneɪbər",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "exercise",
//         meaning: "tập thể dục",
//         pronunciation: "ˈeksərsaɪz",
//         partOfSpeech: "verb",
//     },
// ];

// const foodWords: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         word: "delicious",
//         meaning: "ngon",
//         pronunciation: "dɪˈlɪʃəs",
//         partOfSpeech: "adjective",
//     },
//     {
//         word: "menu",
//         meaning: "thực đơn",
//         pronunciation: "ˈmenjuː",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "waiter",
//         meaning: "người phục vụ",
//         pronunciation: "ˈweɪtər",
//         partOfSpeech: "noun",
//     },
//     {
//         word: "order",
//         meaning: "đặt món",
//         pronunciation: "ˈɔːrdər",
//         partOfSpeech: "verb",
//     },
//     {
//         word: "bill",
//         meaning: "hóa đơn",
//         pronunciation: "bɪl",
//         partOfSpeech: "noun",
//     },
// ];

// // Generate IDs for words
// function generateWords(words: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[], lessonId: string): IWord[] {
//     return words.map((word, index) => ({
//         ...word,
//         id: `word-${lessonId}-${index}`,
//         lessonId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//     }));
// }

// // Sample lessons with proper educational structure
// const beginnerLessons: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         name: "Greetings & Introductions",
//         coverImageUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
//         maxWords: 10,
//         orderIndex: 0,
//     },
//     {
//         name: "Numbers & Time",
//         coverImageUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80",
//         maxWords: 15,
//         orderIndex: 1,
//     },
//     {
//         name: "Colors & Shapes",
//         coverImageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&q=80",
//         maxWords: 12,
//         orderIndex: 2,
//     },
// ];

// const travelLessons: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         name: "At the Airport",
//         coverImageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
//         maxWords: 15,
//         orderIndex: 0,
//     },
//     {
//         name: "Hotel Check-in",
//         coverImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
//         maxWords: 12,
//         orderIndex: 1,
//     },
//     {
//         name: "Asking for Directions",
//         coverImageUrl: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80",
//         maxWords: 10,
//         orderIndex: 2,
//     },
// ];

// const workLessons: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>[] = [
//     {
//         name: "Office Vocabulary",
//         coverImageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
//         maxWords: 20,
//         orderIndex: 0,
//     },
//     {
//         name: "Email Writing",
//         coverImageUrl: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=800&q=80",
//         maxWords: 15,
//         orderIndex: 1,
//     },
//     {
//         name: "Meetings & Presentations",
//         coverImageUrl: "https://images.unsplash.com/photo-1573167243872-43c6433b9d40?w=800&q=80",
//         maxWords: 18,
//         orderIndex: 2,
//     },
// ];

// // Generate lessons with words
// function generateLessons(
//     lessons: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt'>[],
//     courseId: string,
//     wordsData: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>[]
// ): ILesson[] {
//     return lessons.map((lesson, index) => {
//         const lessonId = `lesson-${courseId}-${index}`;
//         return {
//             ...lesson,
//             id: lessonId,
//             courseId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             words: generateWords(wordsData, lessonId),
//         };
//     });
// }

// // Sample courses with proper CEFR levels and descriptions
// export const dummyCourses: ICourse[] = [
//     {
//         id: "course-1",
//         name: "English for Beginners",
//         coverImageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: generateLessons(beginnerLessons, "course-1", beginnerWords),
//     },
//     {
//         id: "course-2",
//         name: "Travel English",
//         coverImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: generateLessons(travelLessons, "course-2", travelWords),
//     },
//     {
//         id: "course-3",
//         name: "Business English",
//         coverImageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: generateLessons(workLessons, "course-3", workWords),
//     },
//     {
//         id: "course-4",
//         name: "Daily Conversation",
//         coverImageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: generateLessons(
//             [
//                 {
//                     name: "Morning Routine",
//                     coverImageUrl: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=800&q=80",
//                     maxWords: 12,
//                     orderIndex: 0,
//                 },
//                 {
//                     name: "Shopping & Errands",
//                     coverImageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80",
//                     maxWords: 15,
//                     orderIndex: 1,
//                 },
//             ],
//             "course-4",
//             dailyLifeWords
//         ),
//     },
//     {
//         id: "course-5",
//         name: "Food & Restaurants",
//         coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: generateLessons(
//             [
//                 {
//                     name: "Ordering Food",
//                     coverImageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
//                     maxWords: 10,
//                     orderIndex: 0,
//                 },
//                 {
//                     name: "Food Vocabulary",
//                     coverImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
//                     maxWords: 20,
//                     orderIndex: 1,
//                 },
//             ],
//             "course-5",
//             foodWords
//         ),
//     },
//     {
//         id: "course-6",
//         name: "Grammar Essentials",
//         coverImageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
//         userLoginId: "user-1",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         lessons: [],
//     },
// ];

// /**
//  * Get all courses
//  */
// export function getAllCourses(): ICourse[] {
//     return dummyCourses;
// }

// /**
//  * Get course by ID
//  */
// export function getCourseById(id: string): ICourse | undefined {
//     return dummyCourses.find(course => course.id === id);
// }

// /**
//  * Get lesson by ID
//  */
// export function getLessonById(lessonId: string): ILesson | undefined {
//     for (const course of dummyCourses) {
//         const lesson = course.lessons?.find(l => l.id === lessonId);
//         if (lesson) return lesson;
//     }
//     return undefined;
// }

// /**
//  * Get random words for practice
//  */
// export function getRandomWords(count: number = 10): IWord[] {
//     const allWords: IWord[] = [];
//     dummyCourses.forEach(course => {
//         course.lessons?.forEach(lesson => {
//             if (lesson.words) {
//                 allWords.push(...lesson.words);
//             }
//         });
//     });
    
//     // Shuffle and return random words
//     const shuffled = allWords.sort(() => Math.random() - 0.5);
//     return shuffled.slice(0, count);
// }

// /**
//  * Mock delay for simulating API calls
//  */
// export function mockDelay(ms: number = 500): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// /**
//  * Simulate API call to get courses
//  */
// export async function mockGetCourses(): Promise<ICourse[]> {
//     await mockDelay();
//     return getAllCourses();
// }

// /**
//  * Simulate API call to get paginated courses
//  */
// export async function mockGetPaginatedCourses(params: IPaginationParams): Promise<IPaginatedResponse<ICourse>> {
//     await mockDelay();
//     const page = params.page || 1;
//     const limit = params.limit || 10;
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;

//     const allCourses = getAllCourses();
//     const paginatedData = allCourses.slice(startIndex, endIndex);

//     return {
//         totalItems: allCourses.length,
//         totalPages: Math.ceil(allCourses.length / limit),
//         currentPage: page,
//         data: paginatedData,
//     };
// }

// /**
//  * Simulate API call to get course by ID
//  */
// export async function mockGetCourseById(id: string): Promise<ICourse> {
//     await mockDelay();
//     const course = getCourseById(id);
//     if (!course) throw new Error("Course not found");
//     return course;
// }
