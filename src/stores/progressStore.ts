import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

interface LessonProgress {
  [lessonId: string]: boolean;
}

interface CourseProgress {
  [courseId: string]: LessonProgress;
}

interface ProgressState {
  progress: CourseProgress;
  currentLesson: Record<string, string>;
  fetchProgress: () => Promise<void>;
  markComplete: (courseId: string, lessonId: string) => Promise<void>;
  isCompleted: (courseId: string, lessonId: string) => boolean;
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
    
    const { data } = await supabase.from('progress').select('lesson_id, completed, lessons!inner(section_id, course_sections!inner(course_id))').eq('user_id', session.user.id);
    
    if (data) {
      const newProgress: CourseProgress = {};
      data.forEach((p: any) => {
        const courseId = p.lessons?.course_sections?.course_id;
        const lessonId = p.lesson_id;
        if (courseId && lessonId && p.completed) {
          if (!newProgress[courseId]) newProgress[courseId] = {};
          newProgress[courseId][lessonId] = true;
        }
      });
      set({ progress: newProgress });
    }
  },

  markComplete: async (courseId: string, lessonId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    set(state => ({
      progress: {
        ...state.progress,
        [courseId]: {
          ...state.progress[courseId],
          [lessonId]: true,
        },
      },
    }));

    await supabase.from('progress').upsert({
      user_id: session.user.id,
      lesson_id: lessonId,
      completed: true
    }, { onConflict: 'user_id, lesson_id' });
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
}));
