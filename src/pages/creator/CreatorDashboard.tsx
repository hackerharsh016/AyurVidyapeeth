import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import { supabase } from '../../supabase/supabase';

interface CreatorStats {
  totalRevenue: number;
  totalStudents: number;
  avgRating: number;
  totalViews: number;
}

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'pending' | 'draft'>('all');
  const [stats, setStats] = useState<CreatorStats>({
    totalRevenue: 0,
    totalStudents: 0,
    avgRating: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchCreatorData = async () => {
        setLoading(true);
        try {
          // 1. Get Creator's Courses
          const { data: myCoursesData } = await supabase
            .from('courses')
            .select('id, rating, price, students_count')
            .eq('creator_id', user.id);

          const myCourseIds = myCoursesData?.map(c => c.id) || [];

          if (myCourseIds.length > 0) {
            // 2. Fetch Enrollments for revenue and unique students
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('user_id, courses(price)')
              .in('course_id', myCourseIds);

            const totalRevenue = enrollments?.reduce((acc, curr: any) => acc + (Number(curr.courses?.price) || 0), 0) || 0;
            const uniqueStudents = new Set(enrollments?.map(e => e.user_id)).size;

            // 3. Calculate Average Rating from individual reviews
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('rating')
              .in('course_id', myCourseIds);

            const totalReviews = reviewsData?.length || 0;
            const sumRatings = reviewsData?.reduce((acc, curr) => acc + (curr.rating || 0), 0) || 0;
            const avgRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

            // 4. Fetch Views (Lesson Progress entries as proxy)
            const { count: progressCount } = await supabase
              .from('progress')
              .select('*', { count: 'exact', head: true })
              .in('lesson_id', 
                (await supabase.from('lessons').select('id').in('section_id', 
                  (await supabase.from('course_sections').select('id').in('course_id', myCourseIds)).data?.map(s => s.id) || []
                )).data?.map(l => l.id) || []
              );

            setStats({
              totalRevenue,
              totalStudents: uniqueStudents,
              avgRating: Number(avgRating.toFixed(1)),
              totalViews: progressCount || 0,
            });
          }
        } catch (error) {
          console.error('Error fetching creator stats:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCreatorData();
      fetchCourses(); // Ensure store is updated
    }
  }, [isAuthenticated, user, fetchCourses]);

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} mb={2}>Sign in to access Creator Dashboard</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go Home</Button>
        </Container>
      </PageLayout>
    );
  }

  const myCourses = courses.filter(c => c.creatorId === user?.id || (user?.role === 'admin' && c.creatorId === user?.id));
  const publishedCount = myCourses.filter(c => c.status === 'published').length;
  const pendingCount = myCourses.filter(c => c.status === 'pending').length;
  const draftCount = myCourses.filter(c => c.status === 'draft').length;

  const filteredCourses = activeFilter === 'all' 
    ? myCourses 
    : myCourses.filter(c => c.status === activeFilter);

  const statusColor = (s: string) => {
    if (s === 'published') return { bg: '#D1FAE5', color: '#065F46', label: '✓ Published' };
    if (s === 'pending') return { bg: '#FEF3C7', color: '#92400E', label: '⏳ Pending Review' };
    return { bg: 'grey.100', color: 'text.secondary', label: '📝 Draft' };
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount}`;
  };

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                  Creator Dashboard
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#D4A017', width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700 }}>
                    {user?.avatar || (user?.name ? user.name[0] : 'U')}
                  </Avatar>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {user?.name} • {user?.college}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/creator/upload')}
                sx={{ bgcolor: '#D4A017', '&:hover': { bgcolor: '#A07810' }, px: 3 }}
              >
                + Create New Course
              </Button>
            </Box>

            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mt: 3 }}>
              {[
                { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', change: 'Live' },
                { label: 'Total Students', value: stats.totalStudents.toLocaleString(), icon: '👥', change: 'Live' },
                { label: 'Avg Rating', value: stats.avgRating === 0 ? 'N/A' : stats.avgRating.toString(), icon: '⭐', change: 'Live' },
                { label: 'Total Views', value: stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews.toString(), icon: '👁', change: 'Live' },
              ].map((stat, i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }}>
                    {loading ? (
                      <CircularProgress size={20} sx={{ color: 'white', mb: 1 }} />
                    ) : (
                      <>
                        <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{stat.icon}</Typography>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>{stat.label}</Typography>
                        <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 600 }}>{stat.change}</Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Course Status Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Courses', value: myCourses.length },
            { id: 'published', label: 'Published', value: publishedCount },
            { id: 'pending', label: 'Pending', value: pendingCount },
            { id: 'draft', label: 'Draft', value: draftCount },
          ].map((item) => (
            <Box 
              key={item.id} 
              onClick={() => setActiveFilter(item.id as any)}
              sx={{ 
                px: 3, 
                py: 1.5, 
                borderRadius: 2, 
                bgcolor: activeFilter === item.id ? 'primary.main' : 'rgba(14,91,68,0.06)', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: activeFilter === item.id ? 'primary.main' : 'rgba(14,91,68,0.1)'
                }
              }}
            >
              <Typography variant="caption" sx={{ color: activeFilter === item.id ? 'rgba(255,255,255,0.8)' : 'text.secondary', display: 'block' }}>
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: activeFilter === item.id ? 'white' : 'primary.main' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Course List */}
        <Typography variant="h6" fontWeight={700} mb={3}>
          {activeFilter === 'all' ? 'My Courses' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Courses`}
        </Typography>

        {filteredCourses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>📹</Typography>
            <Typography variant="h6" color="text.secondary">No {activeFilter !== 'all' ? activeFilter : ''} courses found</Typography>
            {activeFilter === 'all' && (
              <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={() => navigate('/creator/upload')}>
                Create Your First Course
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredCourses.map((course, i) => {
              const sc = statusColor(course.status);
              return (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Card sx={{ '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}>
                    <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                        🌿
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="subtitle1" fontWeight={700} mb={0.5}>{course.title}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={1}>{course.subtitle}</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">📹 {course.totalLessons} lessons</Typography>
                          <Typography variant="caption" color="text.secondary">👥 {course.students.toLocaleString()} students</Typography>
                          <Typography variant="caption" color="text.secondary">⭐ {course.rating}</Typography>
                          <Typography variant="caption" color="text.secondary">💰 {course.free ? 'Free' : `₹${course.price.toLocaleString()}`}</Typography>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Completion rate</Typography>
                            <Typography variant="caption" fontWeight={600} color="primary.main">
                              {Math.round(Math.random() * 40 + 50)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.round(Math.random() * 40 + 50)}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        <Chip
                          label={sc.label}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" onClick={() => navigate(`/courses/${course.id}`)}>
                            View
                          </Button>
                          <Button size="small" variant="contained" color="primary" onClick={() => navigate(`/creator/manage/${course.id}`)}>
                            Manage Content
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </Box>
        )}

        {/* Revenue Chart Placeholder */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Revenue Overview</Typography>
          <Card sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Last 6 months</Typography>
              <Chip label={`Total: ${formatCurrency(stats.totalRevenue)}`} sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120 }}>
              {[35, 55, 45, 70, 85, 100].map((h, i) => (
                <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${h}%`,
                      bgcolor: i === 5 ? 'primary.main' : 'rgba(14,91,68,0.2)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      </Container>
    </PageLayout>
  );
}
