import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LessonProgress {
  [lessonId: string]: boolean;
}

interface CourseProgress {
  [courseId: string]: LessonProgress;
}

interface ProgressState {
  progress: CourseProgress;
  currentLesson: Record<string, string>;
  markComplete: (courseId: string, lessonId: string) => void;
  isCompleted: (courseId: string, lessonId: string) => boolean;
  getCourseProgress: (courseId: string, totalLessons: number) => number;
  setCurrentLesson: (courseId: string, lessonId: string) => void;
  getCurrentLesson: (courseId: string) => string | null;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      currentLesson: {},

      markComplete: (courseId: string, lessonId: string) => {
        set(state => ({
          progress: {
            ...state.progress,
            [courseId]: {
              ...state.progress[courseId],
              [lessonId]: true,
            },
          },
        }));
      },

      isCompleted: (courseId: string, lessonId: string) => {
        return !!get().progress[courseId]?.[lessonId];
      },

      getCourseProgress: (courseId: string, totalLessons: number) => {
        const courseProgress = get().progress[courseId] || {};
        const completed = Object.values(courseProgress).filter(Boolean).length;
        if (totalLessons === 0) return 0;
        return Math.round((completed / totalLessons) * 100);
      },

      setCurrentLesson: (courseId: string, lessonId: string) => {
        set(state => ({
          currentLesson: { ...state.currentLesson, [courseId]: lessonId },
        }));
      },

      getCurrentLesson: (courseId: string) => {
        return get().currentLesson[courseId] || null;
      },
    }),
    { name: 'ayurvidya_progress' }
  )
);
