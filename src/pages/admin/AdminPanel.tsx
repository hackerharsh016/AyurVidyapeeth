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
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
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
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { courses, updateCourseStatus } = useCourseStore();
  const [tab, setTab] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' | 'error' });
  
  const [platformStats, setPlatformStats] = useState([
    { label: 'Total Users', value: '0', icon: '👥', change: '-' },
    { label: 'Total Courses', value: '0', icon: '📚', change: '-' },
    { label: 'Total Revenue', value: '₹0', icon: '💰', change: '-' },
    { label: 'Active Learners', value: '0', icon: '🎓', change: '-' },
  ]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setDebugInfo(null);
    try {
      // 1. Fetch All Profiles (Total Users)
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // 2. Fetch Students specifically
      const { data: studentProfiles, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (studentError) throw studentError;

      // 3. Fetch Creators specifically
      const { data: creatorProfiles, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator')
        .order('created_at', { ascending: false });

      if (creatorError) throw creatorError;

      // 4. Fetch Meta Data (Enrollments and Course Counts)
      const [enRes, crRes, coursesCountRes] = await Promise.all([
        supabase.from('enrollments').select('user_id, courses(price)'),
        supabase.from('courses').select('creator_id'),
        supabase.from('courses').select('*', { count: 'exact', head: true })
      ]);

      const enrollments = enRes.data || [];
      const ownedCourses = crRes.data || [];
      const totalCourses = coursesCountRes.count || 0;

      // Stats Calculation
      const revenue = enrollments.reduce((acc, curr: any) => acc + (Number(curr.courses?.price) || 0), 0);
      const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
        return `₹${amount}`;
      };

      setPlatformStats([
        { label: 'Total Users', value: (allProfiles?.length || 0).toLocaleString(), icon: '👥', change: 'Live' },
        { label: 'Total Courses', value: totalCourses.toLocaleString(), icon: '📚', change: 'Live' },
        { label: 'Total Revenue', value: formatCurrency(revenue), icon: '💰', change: 'Live' },
        { label: 'Active Learners', value: (studentProfiles?.length || 0).toLocaleString(), icon: '🎓', change: 'Live' },
      ]);

      // Map combined data for the tables
      const mapUser = (p: any) => {
        let count = 0;
        if (p.role === 'creator') {
          count = ownedCourses.filter(c => c.creator_id === p.id).length;
        } else {
          count = enrollments.filter(e => e.user_id === p.id).length;
        }
        return {
          id: p.id,
          name: p.full_name || 'Unknown User',
          email: p.email || 'No email',
          role: p.role || 'student',
          college: p.college || 'N/A',
          joined: p.created_at || new Date().toISOString(),
          courses: count
        };
      };

      // Set state
      setAdminUsers(allProfiles?.map(mapUser) || []);
      
      if (!allProfiles || allProfiles.length === 0) {
        setDebugInfo('Profiles table is empty. Ensure data exists in the "profiles" table.');
      }

    } catch (error: any) {
      setToast({ open: true, message: `Error: ${error.message}`, severity: 'error' });
      setDebugInfo(`Fetch failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      fetchData();
    }
  }, [isAuthenticated, currentUser]);

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" fontWeight={700} mb={2}>Admin access required</Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Please login with an admin account to access this panel.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go Home</Button>
        </Container>
      </PageLayout>
    );
  }

  const pendingCourses = courses.filter(c => c.status === 'pending');
  const publishedCourses = courses.filter(c => c.status === 'published');
  
  const students = adminUsers.filter(u => u.role === 'student');
  const creators = adminUsers.filter(u => u.role === 'creator');

  const handleApprove = (courseId: string, title: string) => {
    updateCourseStatus(courseId, 'published');
    setSelectedCourse(null);
    setToast({ open: true, message: `✅ "${title}" approved and published!`, severity: 'success' });
  };

  const handleReject = (courseId: string, title: string) => {
    updateCourseStatus(courseId, 'draft');
    setSelectedCourse(null);
    setToast({ open: true, message: `❌ "${title}" rejected.`, severity: 'info' });
  };

  const UserTable = ({ users, type }: { users: AdminUser[], type: 'Student' | 'Creator' }) => (
    <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'rgba(14,91,68,0.04)' }}>
            <TableCell sx={{ fontWeight: 700 }}>{type}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>College / Institution</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{type === 'Creator' ? 'Courses' : 'Enrolled'}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <Box sx={{ opacity: 0.5 }}>
                  <Typography variant="h1" sx={{ mb: 1 }}>👥</Typography>
                  <Typography variant="h6">No {type.toLowerCase()}s found</Typography>
                  <Typography variant="body2">If you expect data here, check your database connections.</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            users.map(u => (
              <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(14,91,68,0.02)' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar 
                      onClick={() => navigate(`/profile/${u.id}`)}
                      sx={{ 
                        bgcolor: type === 'Creator' ? '#D1FAE5' : 'primary.main', 
                        color: type === 'Creator' ? '#065F46' : 'white',
                        width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' 
                      }}
                    >
                      {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight={600} 
                        sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                        onClick={() => navigate(`/profile/${u.id}`)}
                      >
                        {u.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{u.college}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(u.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={u.courses} size="small" sx={{ bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/profile/${u.id}`)}>View Profile</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AdminPanelSettingsIcon sx={{ color: '#D4A017', fontSize: 36 }} />
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                    Admin Panel
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>AyurVidyapeeth Platform Management</Typography>
                </Box>
              </Box>
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={fetchData} 
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }} 
                variant="outlined"
              >
                Refresh Data
              </Button>
            </Box>

            {debugInfo && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <ErrorOutlineIcon sx={{ color: '#EF4444' }} />
                <Typography variant="body2" sx={{ color: '#FCA5A5' }}>{debugInfo}</Typography>
              </Box>
            )}

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
        {pendingCourses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ mb: 3, p: 2, bgcolor: '#FEF3C7', borderRadius: 2, border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>⏳</Typography>
              <Typography variant="body2" fontWeight={600} color="warning.dark">
                {pendingCourses.length} course(s) awaiting your review and approval
              </Typography>
              <Button size="small" onClick={() => setTab(3)} sx={{ ml: 'auto', color: '#92400E' }}>
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
          <Tab label={`Students (${students.length})`} />
          <Tab label={`Creators (${creators.length})`} />
          <Tab label={`Courses (${courses.length})`} />
          <Tab label={`Approvals (${pendingCourses.length})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={tab}>
            {/* Students Tab */}
            {tab === 0 && (
              <>
                <Typography variant="h6" fontWeight={700} mb={3}>Registered Students</Typography>
                <UserTable users={students} type="Student" />
              </>
            )}

            {/* Creators Tab */}
            {tab === 1 && (
              <>
                <Typography variant="h6" fontWeight={700} mb={3}>Platform Creators</Typography>
                <UserTable users={creators} type="Creator" />
              </>
            )}

            {/* Courses Tab */}
            {tab === 2 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>All Courses</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${publishedCourses.length} Published`} sx={{ bgcolor: '#D1FAE5', color: '#065F46', fontWeight: 600 }} />
                    <Chip label={`${pendingCourses.length} Pending`} sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {courses.length === 0 ? (
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No courses found in database.</Typography>
                    </Card>
                  ) : (
                    courses.map((course, i) => (
                      <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
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
                    ))
                  )}
                </Box>
              </>
            )}

            {/* Approvals Tab */}
            {tab === 3 && (
              <>
                <Typography variant="h6" fontWeight={700} mb={3}>Pending Approvals ({pendingCourses.length})</Typography>
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
              </>
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
