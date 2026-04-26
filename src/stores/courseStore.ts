import { create } from 'zustand';
import { supabase } from '../supabase/supabase';
import type { Course } from '../data/courses';

interface EnrolledCourse {
  courseId: string;
  enrolledAt: string;
}

interface CourseState {
  enrolledCourses: EnrolledCourse[];
  wishlist: string[];
  courses: Course[];
  fetchCourses: () => Promise<void>;
  fetchUserEnrollments: () => Promise<void>;
  fetchWishlist: () => Promise<void>;
  enroll: (courseId: string) => Promise<void>;
  isEnrolled: (courseId: string) => boolean;
  toggleWishlist: (courseId: string) => Promise<void>;
  isWishlisted: (courseId: string) => boolean;
  getCourseById: (id: string) => Course | undefined;
  addCourse: (course: Course) => Promise<void>;
  updateCourseStatus: (courseId: string, status: Course['status']) => Promise<void>;
}

export const useCourseStore = create<CourseState>()((set, get) => ({
  enrolledCourses: [],
  wishlist: [],
  courses: [],

  fetchCourses: async () => {
    const { data: dbCourses } = await supabase.from('courses').select('*, profiles(full_name, avatar_url)');
    if (dbCourses) {
      const mapped = dbCourses.map((c: any) => ({
        ...c,
        instructor: c.profiles?.full_name || 'Instructor',
        instructorAvatar: c.profiles?.avatar_url || '',
        price: c.price || 0,
        originalPrice: c.price ? c.price * 2 : 0,
        thumbnail: c.thumbnail_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
        rating: c.rating || 4.5,
        students: c.students_count || 120,
        status: c.status
      })) as Course[];
      set({ courses: mapped });
    }
  },

  fetchUserEnrollments: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase.from('enrollments').select('course_id, enrolled_at').eq('user_id', session.user.id);
    if (data) {
      set({ 
        enrolledCourses: data
          .filter(d => d.course_id && d.enrolled_at)
          .map(d => ({ courseId: d.course_id as string, enrolledAt: d.enrolled_at as string }))
      });
    }
  },

  fetchWishlist: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data } = await supabase.from('wishlists').select('course_id').eq('user_id', session.user.id);
    if (data) {
      set({ 
        wishlist: data
          .filter(d => d.course_id)
          .map(d => d.course_id as string)
      });
    }
  },

  enroll: async (courseId: string) => {
    const already = get().isEnrolled(courseId);
    if (already) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Must be logged in

    const { error } = await supabase.from('enrollments').insert({
      course_id: courseId,
      user_id: session.user.id,
      payment_status: 'paid' // prototype auto paid
    });

    if (!error) {
      await get().fetchUserEnrollments();
    }
  },

  isEnrolled: (courseId: string) => {
    return get().enrolledCourses.some(e => e.courseId === courseId);
  },

  toggleWishlist: async (courseId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Must be logged in

    const inList = get().isWishlisted(courseId);
    if (inList) {
      await supabase.from('wishlists').delete().eq('course_id', courseId).eq('user_id', session.user.id);
    } else {
      await supabase.from('wishlists').insert({ course_id: courseId, user_id: session.user.id });
    }
    await get().fetchWishlist();
  },

  isWishlisted: (courseId: string) => {
    return get().wishlist.includes(courseId);
  },

  getCourseById: (id: string) => {
    return get().courses.find(c => c.id === id);
  },

  addCourse: async (course: Course) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('courses').insert({
      creator_id: session.user.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      status: 'pending' // new courses go to pending
    });
    
    await get().fetchCourses();
  },

  updateCourseStatus: async (courseId: string, status: Course['status']) => {
    await supabase.from('courses').update({ status }).eq('id', courseId);
    await get().fetchCourses();
  }
}));
