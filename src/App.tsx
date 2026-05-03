import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import theme from './theme';
import { useAuthStore } from './stores/authStore';
import { useCourseStore } from './stores/courseStore';
import { supabase } from './supabase/supabase';

import HomePage from './pages/HomePage';
import DirectoryPage from './pages/directory/DirectoryPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import LearningPage from './pages/learning/LearningPage';
import VideoPlayerPage from './pages/learning/VideoPlayerPage';
import ProfilePage from './pages/ProfilePage';
import TopicDetailPage from './pages/TopicDetailPage';
import ResourcesPage from './pages/ResourcesPage';
import CreatorDashboard from './pages/creator/CreatorDashboard';
import UploadCoursePage from './pages/creator/UploadCoursePage';
import AdminPanel from './pages/admin/AdminPanel';
import ManageCurriculumPage from './pages/creator/ManageCurriculumPage';
import TestsPage from './pages/tests/TestsPage';
import TestTakePage from './pages/tests/TestTakePage';
import ManageTestsPage from './pages/creator/ManageTestsPage';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname.split('/')[1] || 'home'}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/topic/:slug" element={<TopicDetailPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/:courseId" element={<VideoPlayerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/creator/upload" element={<UploadCoursePage />} />
          <Route path="/creator/manage/:id" element={<ManageCurriculumPage />} />
          <Route path="/creator/tests" element={<ManageTestsPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:id" element={<TestTakePage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { initializeSession } = useAuthStore();
  const { fetchCourses, fetchUserEnrollments, fetchWishlist, fetchTestimonials } = useCourseStore();

  useEffect(() => {
    fetchCourses();
    fetchTestimonials();
    initializeSession().then(() => {
      fetchUserEnrollments();
      fetchWishlist();
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeSession();
      if (session) {
        fetchUserEnrollments();
        fetchWishlist();
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeSession, fetchCourses, fetchTestimonials, fetchUserEnrollments, fetchWishlist]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
