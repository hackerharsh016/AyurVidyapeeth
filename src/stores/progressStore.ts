import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface LessonProgress {
  completed: boolean;
  watchedSeconds: number;
}

interface CourseProgress {
  [courseId: string]: Record<string, LessonProgress>;
}

interface ProgressState {
  progress: CourseProgress;
  currentLesson: Record<string, string>;
  fetchProgress: () => Promise<void>;
  updateProgress: (courseId: string, lessonId: string, watchedSeconds: number, completed?: boolean) => Promise<void>;
  isCompleted: (courseId: string, lessonId: string) => boolean;
  getWatchedSeconds: (courseId: string, lessonId: string) => number;
  getCourseProgress: (courseId: string, totalLessons: number) => number;
  setCurrentLesson: (courseId: string, lessonId: string) => void;
  getCurrentLesson: (courseId: string) => string | null;
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  progress: {},
  currentLesson: {},

  fetchProgress: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase
      .from('progress')
      .select('lesson_id, completed, watched_seconds, lessons!inner(section_id, course_sections!inner(course_id))')
      .eq('user_id', session.user.id);
    
    if (data) {
      const newProgress: CourseProgress = {};
      data.forEach((p: any) => {
        const courseId = p.lessons?.course_sections?.course_id;
        const lessonId = p.lesson_id;
        if (courseId && lessonId) {
          if (!newProgress[courseId]) newProgress[courseId] = {};
          newProgress[courseId][lessonId] = {
            completed: !!p.completed,
            watchedSeconds: p.watched_seconds || 0
          };
        }
      });
      set({ progress: newProgress });
    }
  },

  updateProgress: async (courseId: string, lessonId: string, watchedSeconds: number, completed?: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const current = get().progress[courseId]?.[lessonId];
    const isCompleted = completed ?? current?.completed ?? false;

    set(state => ({
      progress: {
        ...state.progress,
        [courseId]: {
          ...state.progress[courseId],
          [lessonId]: {
            completed: isCompleted,
            watchedSeconds
          },
        },
      },
    }));

    // Update in Supabase
    await supabase.from('progress').upsert({
      user_id: session.user.id,
      lesson_id: lessonId,
      watched_seconds: Math.floor(watchedSeconds),
      completed: isCompleted,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, lesson_id' });
  },

  isCompleted: (courseId: string, lessonId: string) => {
    return !!get().progress[courseId]?.[lessonId]?.completed;
  },

  getWatchedSeconds: (courseId: string, lessonId: string) => {
    return get().progress[courseId]?.[lessonId]?.watchedSeconds || 0;
  },

  getCourseProgress: (courseId: string, totalLessons: number) => {
    const courseProgress = get().progress[courseId] || {};
    const completedCount = Object.values(courseProgress).filter(p => p.completed).length;
    if (totalLessons === 0) return 0;
    return Math.round((completedCount / totalLessons) * 100);
  },

  setCurrentLesson: (courseId: string, lessonId: string) => {
    set(state => ({
      currentLesson: { ...state.currentLesson, [courseId]: lessonId },
    }));
  },

  getCurrentLesson: (courseId: string) => {
    return get().currentLesson[courseId] || null;
  },
}));
