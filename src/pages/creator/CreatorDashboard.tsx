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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'courses' | 'test' | 'reviews' | 'settings'>('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'published' | 'pending' | 'draft'>('all');
  const [stats, setStats] = useState<CreatorStats>({
    totalRevenue: 0,
    totalStudents: 0,
    avgRating: 0,
    totalViews: 0,
  });
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchCreatorData = async () => {
        try {
          // 1. Get Creator's Courses
          const { data: myCoursesData } = await supabase
            .from('courses')
            .select('id, title, rating, price, students_count')
            .eq('creator_id', user.id);

          const myCourseIds = myCoursesData?.map(c => c.id) || [];

          if (myCourseIds.length > 0) {
            // 2. Fetch Enrollments
            const { data: enrollments } = await supabase
              .from('enrollments')
              .select('user_id, courses(price)')
              .in('course_id', myCourseIds);

            const totalRevenue = enrollments?.reduce((acc, curr: any) => acc + (Number(curr.courses?.price) || 0), 0) || 0;
            const uniqueStudents = new Set(enrollments?.map(e => e.user_id)).size;

            // 3. Average Rating and Reviews List
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('*, courses(title), profiles(name, avatar)')
              .in('course_id', myCourseIds)
              .order('created_at', { ascending: false });

            setReviews(reviewsData || []);
            const totalReviews = reviewsData?.length || 0;
            const sumRatings = reviewsData?.reduce((acc, curr) => acc + (curr.rating || 0), 0) || 0;
            const avgRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

            // 4. Views (Lesson Progress proxy)
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
        }
      };

      fetchCreatorData();
      fetchCourses();
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

  const filteredCourses = activeFilter === 'all' 
    ? myCourses 
    : myCourses.filter(c => c.status === activeFilter);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount}`;
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: <DashboardIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChartIcon /> },
    { id: 'courses', label: 'Courses', icon: <SchoolIcon /> },
    { id: 'test', label: 'Tests', icon: <QuizIcon /> },
    { id: 'reviews', label: 'Reviews', icon: <RateReviewIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>{user?.name?.[0]}</Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} noWrap>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>Creator</Typography>
        </Box>
      </Box>
      <Divider sx={{ opacity: 0.1 }} />
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton 
              selected={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ 
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'rgba(14,91,68,0.08)',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={<Typography variant="body2" fontWeight={600}>{item.label}</Typography>} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 3 }}>
        <Button 
          variant="contained" 
          fullWidth 
          startIcon={<AddIcon />}
          onClick={() => navigate('/creator/upload')}
          sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}
        >
          New Course
        </Button>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h5" fontWeight={800} mb={3}>Dashboard Overview</Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: <TrendingUpIcon />, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                { label: 'Students', value: stats.totalStudents, icon: <PeopleIcon />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
                { label: 'Rating', value: stats.avgRating, icon: <StarIcon />, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Views', value: stats.totalViews, icon: <VisibilityIcon />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
              ].map((stat, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Typography variant="h6" fontWeight={800}>Revenue Growth</Typography>
                    <Chip label="Live Updates" size="small" sx={{ bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontWeight: 700 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 200, pt: 2 }}>
                    {[35, 55, 45, 70, 85, 100].map((h, i) => (
                      <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          style={{
                            width: '100%',
                            backgroundColor: i === 5 ? '#0E5B44' : 'rgba(14,91,68,0.1)',
                            borderRadius: '8px 8px 0 0',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">{['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i]}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                  <Typography variant="h6" fontWeight={800} mb={3}>Quick Actions</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      onClick={() => setActiveTab('test')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3, borderColor: 'divider' }}
                      startIcon={<QuizIcon />}
                    >
                      Manage MCQ Tests
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      onClick={() => navigate('/creator/upload')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3, borderColor: 'divider' }}
                      startIcon={<AddIcon />}
                    >
                      Launch New Course
                    </Button>
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      onClick={() => setActiveTab('settings')}
                      sx={{ justifyContent: 'flex-start', py: 1.5, px: 2, borderRadius: 3, borderColor: 'divider' }}
                      startIcon={<SettingsIcon />}
                    >
                      Update Profile
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </motion.div>
        );
      case 'analytics':
        return (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <BarChartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" fontWeight={700}>Analytics Dashboard</Typography>
            <Typography color="text.secondary">Detailed performance metrics and user insights are coming soon.</Typography>
          </Box>
        );
      case 'courses':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight={800}>My Courses</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['all', 'published', 'pending', 'draft'].map((f) => (
                  <Chip 
                    key={f}
                    label={f.charAt(0).toUpperCase() + f.slice(1)}
                    onClick={() => setActiveFilter(f as any)}
                    variant={activeFilter === f ? 'filled' : 'outlined'}
                    color={activeFilter === f ? 'primary' : 'default'}
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Box>

            {filteredCourses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6">No courses found</Typography>
                <Button sx={{ mt: 2 }} onClick={() => navigate('/creator/upload')}>Create Course</Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredCourses.map((course) => (
                  <Grid size={{ xs: 12 }} key={course.id}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' } }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                        <Box sx={{ width: 60, height: 60, borderRadius: 3, bgcolor: 'rgba(14,91,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🌿</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>{course.title}</Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">📹 {course.totalLessons} lessons</Typography>
                            <Typography variant="caption" color="text.secondary">👥 {course.students} students</Typography>
                            <Typography variant="caption" color="text.secondary">⭐ {course.rating}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip label={course.status} size="small" sx={{ mb: 1.5, fontWeight: 700 }} color={course.status === 'published' ? 'success' : 'default'} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" onClick={() => navigate(`/creator/manage/${course.id}`)}>Manage</Button>
                            <Button size="small" onClick={() => navigate(`/courses/${course.id}`)}>View</Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </motion.div>
        );
      case 'test':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h5" fontWeight={800}>Test Management</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/creator/tests')}>
                Open Test Builder
              </Button>
            </Box>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px dashed', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.01)' }}>
              <QuizIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} mb={1}>Manage MCQ Practice Tests</Typography>
              <Typography color="text.secondary" mb={3}>Click below to access the full test management suite where you can design questions, set durations, and publish tests.</Typography>
              <Button variant="outlined" onClick={() => navigate('/creator/tests')}>Go to Test Dashboard</Button>
            </Paper>
          </Box>
        );
      case 'reviews':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h5" fontWeight={800} mb={4}>Student Reviews</Typography>
            {reviews.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
                <RateReviewIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6">No reviews yet</Typography>
                <Typography color="text.secondary">Reviews from your students will appear here.</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {reviews.map((review) => (
                  <Grid size={{ xs: 12 }} key={review.id}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                            {review.profiles?.name?.[0] || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>{review.profiles?.name || 'Anonymous Student'}</Typography>
                            <Typography variant="caption" color="text.secondary">on {review.courses?.title}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderRadius: 2 }}>
                          <StarIcon sx={{ fontSize: 16 }} />
                          <Typography variant="subtitle2" fontWeight={700}>{review.rating}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.primary" sx={{ fontStyle: review.comment ? 'normal' : 'italic' }}>
                        {review.comment || 'No comment provided.'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </motion.div>
        );
      case 'settings':
        return (
          <Box maxWidth="sm">
            <Typography variant="h5" fontWeight={800} mb={4}>Creator Settings</Typography>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>{user?.name?.[0]}</Avatar>
                <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.college}</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>Display Name</Typography>
                  <Typography variant="body1" sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2 }}>{user?.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>College / Institution</Typography>
                  <Typography variant="body1" sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2 }}>{user?.college}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button variant="contained" disabled fullWidth sx={{ py: 1.5, borderRadius: 2 }}>Update Settings (Coming Soon)</Button>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', bgcolor: '#fbfbfb' }}>
        {/* Sidebar for Desktop */}
        {!isMobile && (
          <Box sx={{ width: 280, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
            {sidebarContent}
          </Box>
        )}

        {/* Mobile Sidebar (Drawer) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4, lg: 6 }, overflowX: 'hidden' }}>
          {isMobile && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => setMobileOpen(true)} color="primary">
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={800}>{menuItems.find(m => m.id === activeTab)?.label}</Typography>
            </Box>
          )}
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </PageLayout>
  );
}
