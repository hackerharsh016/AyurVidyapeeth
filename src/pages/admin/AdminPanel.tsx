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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
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
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';

import { motion, AnimatePresence } from 'framer-motion';
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

type AdminView = 'home' | 'students' | 'creators' | 'courses' | 'approvals';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  college: string | null;
  created_at: string | null;
}

interface EnrollmentWithCourse {
  user_id: string | null;
  courses: { price: number } | null;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { courses, updateCourseStatus } = useCourseStore();
  const [view, setView] = useState<AdminView>('home');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
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
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      const [enRes, crRes, coursesCountRes] = await Promise.all([
        supabase.from('enrollments').select('user_id, courses(price)'),
        supabase.from('courses').select('creator_id'),
        supabase.from('courses').select('*', { count: 'exact', head: true })
      ]);

      const enrollments = (enRes.data as unknown as EnrollmentWithCourse[]) || [];
      const ownedCourses = crRes.data || [];
      const totalCourses = coursesCountRes.count || 0;

      const revenue = enrollments.reduce((acc: number, curr: EnrollmentWithCourse) => acc + (Number(curr.courses?.price) || 0), 0);
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

      const mapUser = (p: Profile) => {
        let count = 0;
        if (p.role === 'creator') {
          count = ownedCourses.filter((c: { creator_id: string | null }) => c.creator_id === p.id).length;
        } else {
          count = enrollments.filter((e: EnrollmentWithCourse) => e.user_id === p.id).length;
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

      setAdminUsers((allProfiles as Profile[])?.map(mapUser) || []);
      
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

  const sidebarItems = [
    { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'students', label: 'Students', icon: <SchoolIcon /> },
    { id: 'creators', label: 'Creators', icon: <PersonIcon /> },
    { id: 'courses', label: 'All Courses', icon: <MenuBookIcon /> },
    { id: 'approvals', label: 'Requests', icon: <FactCheckIcon />, badge: pendingCourses.length },
  ];

  const UserTable = ({ users, type }: { users: AdminUser[], type: 'Student' | 'Creator' }) => (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
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
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: 70, md: 240 },
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            zIndex: 10,
          }}
        >
          <Box sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <AdminPanelSettingsIcon color="secondary" />
              <Typography variant="subtitle1" fontWeight={700}>Admin Console</Typography>
            </Box>
            <Divider />
          </Box>
          
          <List sx={{ px: 1 }}>
            {sidebarItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={view === item.id}
                  onClick={() => setView(item.id as AdminView)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(14,91,68,0.08)',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'rgba(14,91,68,0.12)' },
                      '& .MuiListItemIcon-root': { color: 'primary.main' }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 40, md: 40 } }}>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    sx={{ display: { xs: 'none', md: 'block' } }}
                    primaryTypographyProps={{ fontWeight: view === item.id ? 700 : 500, variant: 'body2' }} 
                  />
                  {item.badge ? (
                    <Box sx={{ 
                      ml: 1, px: 0.8, py: 0.2, borderRadius: 10, 
                      bgcolor: 'error.main', color: 'white', fontSize: '0.65rem', fontWeight: 700 
                    }}>
                      {item.badge}
                    </Box>
                  ) : null}
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 'auto', p: 2, display: { xs: 'none', md: 'block' } }}>
            <Button 
              fullWidth 
              startIcon={<RefreshIcon />} 
              onClick={fetchData} 
              variant="outlined" 
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, bgcolor: '#F8FAFC', p: { xs: 2, md: 4 } }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box>
                  {/* Home View */}
                  {view === 'home' && (
                    <>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>Platform Overview</Typography>
                        <Typography variant="body2" color="text.secondary">Real-time statistics and platform performance.</Typography>
                      </Box>
                      
                      {debugInfo && (
                        <Alert severity="warning" sx={{ mb: 3 }}>{debugInfo}</Alert>
                      )}

                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        {platformStats.map((stat, i) => (
                          <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                              <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} gutterBottom>{stat.label}</Typography>
                                    <Typography variant="h4" fontWeight={800}>{stat.value}</Typography>
                                  </Box>
                                  <Box sx={{ p: 1.5, bgcolor: 'rgba(14,91,68,0.06)', borderRadius: 2, fontSize: '1.5rem' }}>
                                    {stat.icon}
                                  </Box>
                                </Box>
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Chip label={stat.change} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                  <Typography variant="caption" color="text.secondary">status</Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <CardContent>
                              <Typography variant="h6" fontWeight={700} mb={2}>Pending Approvals</Typography>
                              {pendingCourses.length === 0 ? (
                                <Box sx={{ py: 6, textAlign: 'center', opacity: 0.6 }}>
                                  <FactCheckIcon sx={{ fontSize: 48, mb: 1, color: 'divider' }} />
                                  <Typography variant="body2">All courses are up to date.</Typography>
                                </Box>
                              ) : (
                                <List dense>
                                  {pendingCourses.slice(0, 5).map((c) => (
                                    <ListItem key={c.id} divider>
                                      <ListItemText 
                                        primary={c.title} 
                                        secondary={`by ${c.instructor} • ${c.subject}`} 
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                      />
                                      <Button size="small" onClick={() => setView('approvals')}>Review</Button>
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
                            <CardContent>
                              <Typography variant="h6" fontWeight={700} mb={2}>Platform Activity</Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {[
                                  { label: 'New Student Signup', time: '2 mins ago', icon: '👤' },
                                  { label: 'Course Purchased', time: '15 mins ago', icon: '💰' },
                                  { label: 'Course Submitted', time: '1 hour ago', icon: '📝' },
                                ].map((act, i) => (
                                  <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box sx={{ fontSize: '1.2rem' }}>{act.icon}</Box>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>{act.label}</Typography>
                                      <Typography variant="caption" color="text.secondary">{act.time}</Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </>
                  )}

                  {/* Students View */}
                  {view === 'students' && (
                    <>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h4" fontWeight={700} gutterBottom>Students</Typography>
                          <Typography variant="body2" color="text.secondary">Manage all registered learners on the platform.</Typography>
                        </Box>
                      </Box>
                      <UserTable users={students} type="Student" />
                    </>
                  )}

                  {/* Creators View */}
                  {view === 'creators' && (
                    <>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h4" fontWeight={700} gutterBottom>Creators</Typography>
                          <Typography variant="body2" color="text.secondary">Manage educators and content contributors.</Typography>
                        </Box>
                      </Box>
                      <UserTable users={creators} type="Creator" />
                    </>
                  )}

                  {/* Courses View */}
                  {view === 'courses' && (
                    <>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h4" fontWeight={700} gutterBottom>All Courses</Typography>
                          <Typography variant="body2" color="text.secondary">Monitor and manage course inventory.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip label={`${publishedCourses.length} Published`} color="success" size="small" />
                          <Chip label={`${pendingCourses.length} Pending`} color="warning" size="small" />
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {courses.map((course) => (
                          <Card key={course.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                                🌿
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Typography variant="subtitle1" fontWeight={700}>{course.title}</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">by {course.instructor} • {course.subject}</Typography>
                                <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>⭐ {course.rating}</Typography>
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>👥 {course.students}</Typography>
                                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>💰 {course.free ? 'Free' : `₹${course.price}`}</Typography>
                                </Box>
                              </Box>
                              <Chip 
                                label={course.status} 
                                color={course.status === 'published' ? 'success' : course.status === 'pending' ? 'warning' : 'default'}
                                size="small"
                                sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton onClick={() => navigate(`/courses/${course.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                                {course.status === 'pending' && (
                                  <Button variant="contained" size="small" onClick={() => setSelectedCourse(course)}>Review</Button>
                                )}
                                {course.status === 'published' && (
                                  <Button variant="outlined" color="error" size="small" onClick={() => handleReject(course.id, course.title)}>Unpublish</Button>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Approvals View */}
                  {view === 'approvals' && (
                    <>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>Review Requests</Typography>
                        <Typography variant="body2" color="text.secondary">Approve or reject newly submitted course content.</Typography>
                      </Box>
                      
                      {pendingCourses.length === 0 ? (
                        <Box sx={{ py: 10, textAlign: 'center', opacity: 0.5 }}>
                          <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                          <Typography variant="h6">No pending requests!</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {pendingCourses.map((course) => (
                            <Card key={course.id} elevation={0} sx={{ border: '2px solid', borderColor: 'warning.light', borderRadius: 4, overflow: 'hidden' }}>
                              <Box sx={{ bgcolor: 'warning.light', px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" fontWeight={800} color="warning.dark" sx={{ textTransform: 'uppercase' }}>Awaiting Approval</Typography>
                                <Typography variant="caption" color="text.secondary">Submitted: {new Date().toLocaleDateString()}</Typography>
                              </Box>
                              <CardContent sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                  <Grid size={{ xs: 12, md: 8 }}>
                                    <Typography variant="h5" fontWeight={700} gutterBottom>{course.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>{course.subtitle}</Typography>
                                    
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                      {[
                                        { label: 'Category', val: course.subject },
                                        { label: 'Level', val: course.level },
                                        { label: 'Language', val: course.language },
                                        { label: 'Lessons', val: course.totalLessons },
                                      ].map(b => (
                                        <Chip key={b.label} label={`${b.label}: ${b.val}`} size="small" variant="outlined" />
                                      ))}
                                    </Box>

                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Instructor Details</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                      <Avatar sx={{ bgcolor: 'secondary.main' }}>{course.instructor[0]}</Avatar>
                                      <Box>
                                        <Typography variant="body2" fontWeight={700}>{course.instructor}</Typography>
                                        <Typography variant="caption" color="text.secondary">{course.instructorBio}</Typography>
                                      </Box>
                                    </Box>
                                  </Grid>
                                  <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <Typography variant="h6" fontWeight={700} textAlign="center" color="primary.main">
                                        {course.free ? 'Free Course' : `₹${course.price}`}
                                      </Typography>
                                      <Divider />
                                      <Button fullWidth variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleApprove(course.id, course.title)}>Approve & Publish</Button>
                                      <Button fullWidth variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleReject(course.id, course.title)}>Reject Request</Button>
                                      <Button fullWidth variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setSelectedCourse(course)}>Details</Button>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        {selectedCourse && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Course Details Review</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Description</Typography>
                <Typography variant="body2">{selectedCourse.description}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>Learning Outcomes</Typography>
                <List dense>
                  {selectedCourse.whatYouLearn.map((l: string, i: number) => (
                    <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 30 }}><CheckCircleIcon color="success" sx={{ fontSize: 16 }} /></ListItemIcon>
                      <ListItemText primary={l} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setSelectedCourse(null)}>Close</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" color="success" onClick={() => handleApprove(selectedCourse.id, selectedCourse.title)}>Approve</Button>
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
