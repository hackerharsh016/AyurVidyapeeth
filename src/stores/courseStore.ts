import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { courses as initialCourses, type Course } from '../data/courses';

interface EnrolledCourse {
  courseId: string;
  enrolledAt: string;
}

interface CourseState {
  enrolledCourses: EnrolledCourse[];
  wishlist: string[];
  courses: Course[];
  enroll: (courseId: string) => void;
  isEnrolled: (courseId: string) => boolean;
  toggleWishlist: (courseId: string) => void;
  isWishlisted: (courseId: string) => boolean;
  addCourse: (course: Course) => void;
  updateCourseStatus: (courseId: string, status: Course['status']) => void;
  getCourseById: (id: string) => Course | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      enrolledCourses: [],
      wishlist: [],
      courses: initialCourses,

      enroll: (courseId: string) => {
        const already = get().isEnrolled(courseId);
        if (already) return;
        set(state => ({
          enrolledCourses: [...state.enrolledCourses, { courseId, enrolledAt: new Date().toISOString() }],
        }));
      },

      isEnrolled: (courseId: string) => {
        return get().enrolledCourses.some(e => e.courseId === courseId);
      },

      toggleWishlist: (courseId: string) => {
        set(state => {
          const inList = state.wishlist.includes(courseId);
          return {
            wishlist: inList
              ? state.wishlist.filter(id => id !== courseId)
              : [...state.wishlist, courseId],
          };
        });
      },

      isWishlisted: (courseId: string) => {
        return get().wishlist.includes(courseId);
      },

      addCourse: (course: Course) => {
        set(state => ({ courses: [...state.courses, course] }));
      },

      updateCourseStatus: (courseId: string, status: Course['status']) => {
        set(state => ({
          courses: state.courses.map(c => c.id === courseId ? { ...c, status } : c),
        }));
      },

      getCourseById: (id: string) => {
        return get().courses.find(c => c.id === id);
      },
    }),
    { name: 'ayurvidya_courses' }
  )
);
