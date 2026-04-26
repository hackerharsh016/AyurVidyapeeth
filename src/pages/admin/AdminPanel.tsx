import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabase';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  college: string;
  joined: string;
  courses: number;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { courses, updateCourseStatus } = useCourseStore();
  const [tab, setTab] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' });
  
  const [platformStats, setPlatformStats] = useState([
    { label: 'Total Users', value: '0', icon: '👥', change: '-' },
    { label: 'Total Courses', value: '0', icon: '📚', change: '-' },
    { label: 'Total Revenue', value: '₹0', icon: '💰', change: '-' },
    { label: 'Active Learners', value: '0', icon: '🎓', change: '-' },
  ]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const fetchStats = async () => {
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
        const { count: studentsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
        
        const { data: enrollments } = await supabase.from('enrollments').select('courses(price)');
        let revenue = 0;
        if (enrollments) {
          // @ts-ignore - Supabase type inference gets a bit confused with joined pricing depending on schema
          revenue = enrollments.reduce((acc, curr) => acc + (Number(curr.courses?.price) || 0), 0);
        }

        const formatCurrency = (amount: number) => {
          if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
          if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
          return `₹${amount}`;
        };

        setPlatformStats([
          { label: 'Total Users', value: (usersCount || 0).toLocaleString(), icon: '👥', change: 'Live Database' },
          { label: 'Total Courses', value: (coursesCount || 0).toLocaleString(), icon: '📚', change: 'Live Database' },
          { label: 'Total Revenue', value: formatCurrency(revenue), icon: '💰', change: 'Live Database' },
          { label: 'Active Learners', value: (studentsCount || 0).toLocaleString(), icon: '🎓', change: 'Live Database' },
        ]);
      };
      
      const fetchUsers = async () => {
        const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!profiles) return;
        
        const { data: enrollments } = await supabase.from('enrollments').select('user_id');
        const { data: ownedCourses } = await supabase.from('courses').select('creator_id');
        
        const mapped = profiles.map(p => {
          let courseCount = 0;
          if (p.role === 'creator') {
              courseCount = ownedCourses?.filter(c => c.creator_id === p.id).length || 0;
          } else {
              courseCount = enrollments?.filter(e => e.user_id === p.id).length || 0;
          }
          
          return {
            id: p.id,
            name: p.full_name || 'Unknown User',
            email: p.email || 'No email',
            role: p.role || 'student',
            college: p.college || 'N/A',
            joined: p.created_at || new Date().toISOString(),
            courses: courseCount
          };
        });
        setAdminUsers(mapped);
      };

      fetchStats();
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" fontWeight={700} mb={2}>Admin access required</Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Please login with admin@ayurvidyapeeth.com to access the admin panel.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go Home</Button>
        </Container>
      </PageLayout>
    );
  }

  const pendingCourses = courses.filter(c => c.status === 'pending');
  const publishedCourses = courses.filter(c => c.status === 'published');

  const handleApprove = (courseId: string, title: string) => {
    updateCourseStatus(courseId, 'published');
    setSelectedCourse(null);
    setToast({ open: true, message: `✅ "${title}" approved and published!`, severity: 'success' });
  };

  const handleReject = (courseId: string, title: string) => {
    updateCourseStatus(courseId, 'draft');
    setSelectedCourse(null);
    setToast({ open: true, message: `❌ "${title}" rejected. Sent back to creator.`, severity: 'info' });
  };

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <AdminPanelSettingsIcon sx={{ color: '#D4A017', fontSize: 36 }} />
              <Box>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                  Admin Panel
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>AyurVidyapeeth Platform Management</Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {platformStats.map((stat, i) => (
                <Grid key={i} size={{ xs: 6, md: 3 }}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{stat.icon}</Typography>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.2rem', md: '1.5rem' } }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{stat.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#86EFAC', fontWeight: 600 }}>{stat.change}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Pending Alert */}
        {pendingCourses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ mb: 3, p: 2, bgcolor: '#FEF3C7', borderRadius: 2, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>⏳</Typography>
              <Typography variant="body2" fontWeight={600} color="warning.dark">
                {pendingCourses.length} course(s) awaiting your review and approval
              </Typography>
              <Button size="small" onClick={() => setTab(2)} sx={{ ml: 'auto', color: '#92400E' }}>
                Review Now →
              </Button>
            </Box>
          </motion.div>
        )}

        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label={`Users (${adminUsers.length})`} />
          <Tab label={`Courses (${courses.length})`} />
          <Tab label={`Approvals (${pendingCourses.length})`} />
        </Tabs>

        {/* Users Tab */}
        {tab === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Platform Users</Typography>
              <Chip label={`${adminUsers.length} registered`} sx={{ bgcolor: '#D1FAE5', color: '#065F46' }} />
            </Box>
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(14,91,68,0.04)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Institution</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Joined</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Courses</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminUsers.map(u => (
                    <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(14,91,68,0.02)' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 }}>
                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{
                            bgcolor: u.role === 'creator' ? '#D1FAE5' : u.role === 'admin' ? '#FEF3C7' : '#E0E7FF',
                            color: u.role === 'creator' ? '#065F46' : u.role === 'admin' ? '#92400E' : '#3730A3',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            fontSize: '0.65rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" color="text.secondary">{u.college}</Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(u.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.courses} size="small" sx={{ bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" variant="outlined" sx={{ borderRadius: 1, minWidth: 0, px: 1 }}>
                            View
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </motion.div>
        )}

        {/* Courses Tab */}
        {tab === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>All Courses</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${publishedCourses.length} Published`} sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
                <Chip label={`${pendingCourses.length} Pending`} sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card>
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🌿</Box>
                      <Box sx={{ flex: 1, minWidth: 150 }}>
                        <Typography variant="subtitle2" fontWeight={700}>{course.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{course.instructor}</Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">⭐ {course.rating}</Typography>
                          <Typography variant="caption" color="text.secondary">👥 {course.students.toLocaleString()}</Typography>
                          <Typography variant="caption" color="text.secondary">💰 {course.free ? 'Free' : `₹${course.price.toLocaleString()}`}</Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={course.status}
                        size="small"
                        sx={{
                          bgcolor: course.status === 'published' ? '#D1FAE5' : course.status === 'pending' ? '#FEF3C7' : 'grey.100',
                          color: course.status === 'published' ? '#065F46' : course.status === 'pending' ? '#92400E' : 'text.secondary',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => navigate(`/courses/${course.id}`)}>View</Button>
                        {course.status === 'pending' && (
                          <Button size="small" variant="contained" color="primary" onClick={() => setSelectedCourse(course)}>
                            Review
                          </Button>
                        )}
                        {course.status === 'published' && (
                          <Button size="small" variant="outlined" color="error" onClick={() => handleReject(course.id, course.title)}>
                            Unpublish
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        )}

        {/* Approvals Tab */}
        {tab === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Pending Approvals ({pendingCourses.length})
            </Typography>
            {pendingCourses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>✅</Typography>
                <Typography variant="h6" color="text.secondary">All caught up! No pending approvals.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pendingCourses.map((course, i) => (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card sx={{ border: '2px solid #FDE68A' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Chip label="⏳ Pending Review" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700, mb: 1 }} />
                            <Typography variant="h6" fontWeight={700}>{course.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{course.subtitle}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              startIcon={<CheckCircleIcon />}
                              variant="contained"
                              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                              onClick={() => handleApprove(course.id, course.title)}
                            >
                              Approve & Publish
                            </Button>
                            <Button
                              startIcon={<CancelIcon />}
                              variant="outlined"
                              color="error"
                              onClick={() => handleReject(course.id, course.title)}
                            >
                              Reject
                            </Button>
                            <Button
                              startIcon={<VisibilityIcon />}
                              variant="outlined"
                              onClick={() => setSelectedCourse(course)}
                            >
                              Review Details
                            </Button>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          {[
                            { label: 'Instructor', value: course.instructor },
                            { label: 'Subject', value: course.subject },
                            { label: 'Level', value: course.level },
                            { label: 'Price', value: course.free ? 'Free' : `₹${course.price.toLocaleString()}` },
                            { label: 'Language', value: course.language },
                            { label: 'Total Lessons', value: `${course.totalLessons} lessons` },
                          ].map(item => (
                            <Grid key={item.label} size={{ xs: 6, sm: 4 }}>
                              <Box sx={{ p: 1.5, bgcolor: 'rgba(14,91,68,0.04)', borderRadius: 2 }}>
                                <Typography variant="caption" color="text.secondary" display="block">{item.label}</Typography>
                                <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            )}
          </motion.div>
        )}
      </Container>

      {/* Course Detail Dialog */}
      <Dialog
        open={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedCourse && (
          <>
            <DialogTitle fontWeight={700}>{selectedCourse.title}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" mb={2}>{selectedCourse.description}</Typography>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>What students will learn:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {selectedCourse.whatYouLearn.slice(0, 4).map((item, i) => (
                  <Typography key={i} variant="body2" color="text.secondary">• {item}</Typography>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
              <Button onClick={() => setSelectedCourse(null)} color="inherit">Cancel</Button>
              <Button
                startIcon={<CancelIcon />}
                color="error"
                variant="outlined"
                onClick={() => handleReject(selectedCourse.id, selectedCourse.title)}
              >
                Reject
              </Button>
              <Button
                startIcon={<CheckCircleIcon />}
                variant="contained"
                sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                onClick={() => handleApprove(selectedCourse.id, selectedCourse.title)}
              >
                Approve & Publish
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>
    </PageLayout>
  );
}
