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
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';

const mockStats = {
  totalRevenue: 128400,
  totalStudents: 4234,
  avgRating: 4.7,
  totalViews: 89200,
};

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { courses } = useCourseStore();

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

  const myCourses = courses.filter(c => c.creatorId === user?.id || user?.role === 'admin');
  const publishedCount = myCourses.filter(c => c.status === 'published').length;
  const pendingCount = myCourses.filter(c => c.status === 'pending').length;
  const draftCount = myCourses.filter(c => c.status === 'draft').length;

  const statusColor = (s: string) => {
    if (s === 'published') return { bg: '#D1FAE5', color: '#065F46', label: '✓ Published' };
    if (s === 'pending') return { bg: '#FEF3C7', color: '#92400E', label: '⏳ Pending Review' };
    return { bg: 'grey.100', color: 'text.secondary', label: '📝 Draft' };
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
                    {user?.avatar}
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
                { label: 'Total Revenue', value: `₹${mockStats.totalRevenue.toLocaleString()}`, icon: '💰', change: '+12%' },
                { label: 'Total Students', value: mockStats.totalStudents.toLocaleString(), icon: '👥', change: '+8%' },
                { label: 'Avg Rating', value: mockStats.avgRating.toString(), icon: '⭐', change: '+0.1' },
                { label: 'Total Views', value: `${(mockStats.totalViews / 1000).toFixed(0)}K`, icon: '👁', change: '+15%' },
              ].map((stat, i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }}>
                    <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{stat.icon}</Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>{stat.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 600 }}>{stat.change} this month</Typography>
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
            { label: 'All Courses', value: myCourses.length, active: true },
            { label: 'Published', value: publishedCount },
            { label: 'Pending', value: pendingCount },
            { label: 'Draft', value: draftCount },
          ].map((item, i) => (
            <Box key={i} sx={{ px: 3, py: 1.5, borderRadius: 2, bgcolor: item.active ? 'primary.main' : 'rgba(14,91,68,0.06)', cursor: 'pointer' }}>
              <Typography variant="caption" sx={{ color: item.active ? 'rgba(255,255,255,0.8)' : 'text.secondary', display: 'block' }}>
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: item.active ? 'white' : 'primary.main' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Course List */}
        <Typography variant="h6" fontWeight={700} mb={3}>My Courses</Typography>

        {myCourses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography sx={{ fontSize: '3rem', mb: 2 }}>📹</Typography>
            <Typography variant="h6" color="text.secondary">No courses created yet</Typography>
            <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={() => navigate('/creator/upload')}>
              Create Your First Course
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {myCourses.map((course, i) => {
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
                          <Button size="small" variant="contained" color="primary" onClick={() => navigate('/creator/upload')}>
                            Edit
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
              <Chip label="This Month: ₹18,400" sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
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
