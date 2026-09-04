/**
 * Every server path the app calls, built in one place.
 *
 * The gateway used to expose its own URL shapes (`/daily-habit`,
 * `/courses/me/my-courses`) and translate them to the services' real
 * `users/:userLoginId/...` routes. Now that it is a plain proxy, what the app
 * asks for is exactly what a service receives, so the shapes live here rather
 * than being spelled out across fourteen api modules.
 *
 * No path names a user. These routes used to carry a `users/me` prefix that each
 * service rewrote to the caller's own id; the services now read the id from the
 * access token directly, so there is nothing left for the client to say. The
 * `user()` helper is kept because it marks which endpoints are scoped to the
 * signed-in learner, which is worth being able to see at a glance.
 */

const user = (segment: string) => `/${segment}`;

export const apiPaths = {
    profile: () => user('profile'),

    courses: {
        root: () => user('courses'),
        totalStats: () => user('courses/total-stats'),
        byId: (courseId: string) => user(`courses/${courseId}`),
        words: (courseId: string) => user(`courses/${courseId}/words`),
        wordsBulkDelete: (courseId: string) =>
            user(`courses/${courseId}/words/bulk-delete`),
        wordsBulkMove: (courseId: string) =>
            user(`courses/${courseId}/words/bulk-move`),
    },

    lessons: {
        root: (courseId: string) => user(`courses/${courseId}/lessons`),
        reorder: (courseId: string) =>
            user(`courses/${courseId}/lessons/reorder`),
        byId: (courseId: string, lessonId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}`),
    },

    lessonWords: {
        root: (courseId: string, lessonId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words`),
        bulk: (courseId: string, lessonId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words/bulk`),
        bulkMove: (courseId: string, lessonId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words/bulk-move`),
        bulkDelete: (courseId: string, lessonId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words/bulk-delete`),
        byId: (courseId: string, lessonId: string, wordId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words/${wordId}`),
        move: (courseId: string, lessonId: string, wordId: string) =>
            user(`courses/${courseId}/lessons/${lessonId}/words/${wordId}/move`),
    },

    words: {
        /** Full word records for ids the learner owns, across every course. */
        hydrateByIds: () => user('words/hydrate-by-ids'),
    },

    dictionary: {
        pronunciation: (word: string) =>
            `/dictionary/pronunciation/${encodeURIComponent(word)}`,
        search: (query: string) =>
            `/dictionary/search/${encodeURIComponent(query)}`,
        searchMyWords: (word: string) =>
            `/dictionary/words/search/${encodeURIComponent(word)}`,
    },

    wordProgress: {
        recordAnswerBulkSync: () => user('word-progress/record-answer/bulk-sync'),
        dueWordIds: () => user('word-progress/due-word-ids'),
        stats: () => user('word-progress/stats'),
        statsByCourseIds: () => user('word-progress/stats/by-course-ids'),
        statsByLessonIds: () => user('word-progress/stats/by-lesson-ids'),
        byWordIds: () => user('word-progress/by-word-ids'),
        leeches: () => user('word-progress/leeches'),
        word: (wordId: string) => user(`word-progress/words/${wordId}`),
        resetWord: (wordId: string) =>
            user(`word-progress/words/${wordId}/reset`),
        unsuspendWord: (wordId: string) =>
            user(`word-progress/words/${wordId}/unsuspend`),
    },

    dailyHabit: {
        root: () => user('daily-habit'),
        recordPractice: () => user('daily-habit/record-practice'),
        recordPracticeBatch: () => user('daily-habit/record-practice/batch'),
        goal: () => user('daily-habit/goal'),
    },

    learningReport: {
        root: () => user('learning-report'),
        forecast: () => user('learning-report/forecast'),
        activityCalendar: () => user('learning-report/activity-calendar'),
    },

    learningSettings: () => user('learning-settings'),
    preferences: () => user('preferences'),
    level: () => user('level'),

    notifications: {
        subscriptions: () => user('notifications/subscriptions'),
        preferences: () => user('notifications/preferences'),
        vapidPublicKey: () => user('notifications/vapid-public-key'),
    },

    auth: {
        logout: () => '/auth/logout',
        refreshToken: () => '/auth/refresh-token',
        google: () => '/auth/google',
    },
} as const;
