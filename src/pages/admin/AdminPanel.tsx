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
import TextField from '@mui/material/TextField';

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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import WebIcon from '@mui/icons-material/Web';

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

interface Topic {
  id?: string;
  label: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number | null;
  created_at?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  college: string | null;
  year: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface EnrollmentWithCourse {
  user_id: string;
  courses: {
    price: number;
  } | null;
}

type AdminView = 'home' | 'homepage' | 'students' | 'creators' | 'courses' | 'approvals' | 'directory';

interface DirectoryEntry {
  id?: string;
  type: string;
  title: string;
  slug: string;
  sanskrit_name: string;
  english_name: string;
  meaning: string;
  summary: string;
  definition: string;
  introduction: string;
  etiology: string;
  synonyms: string[] | string;
  origin: string;
  panchabhautikatva: string;
  swaroop: string;
  characteristics: string[] | string;
  types_description: string;
  sankhya: string;
  prakar_charak: string;
  prakar_sushruta: string;
  moolasthana: string;
  viddha_lakshan: string;
  dushti: string;
  functions: string[] | string;
  disorders: string[] | string;
  treatment_principles: string[] | string;
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

  // Homepage topics state
  const [homepageTopics, setHomepageTopics] = useState<Topic[]>([]);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState<Topic>({ label: '', slug: '', icon: '', description: '', sort_order: 0 });

  // Directory entries state
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [directoryDialogOpen, setDirectoryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [directoryForm, setDirectoryForm] = useState<DirectoryEntry>({
    type: 'Srotas', title: '', slug: '', sanskrit_name: '', english_name: '', meaning: '',
    summary: '', definition: '', introduction: '', etiology: '', synonyms: [],
    origin: '', panchabhautikatva: '', swaroop: '', characteristics: [],
    types_description: '', sankhya: '', prakar_charak: '', prakar_sushruta: '',
    moolasthana: '', viddha_lakshan: '', dushti: '', functions: [],
    disorders: [], treatment_principles: []
  });

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

      const [enRes, crRes, coursesCountRes, topicsRes, directoryRes] = await Promise.all([
        supabase.from('enrollments').select('user_id, courses(price)'),
        supabase.from('courses').select('creator_id'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('homepage_topics').select('*').order('sort_order', { ascending: true }),
        supabase.from('directory_entries').select('*').order('created_at', { ascending: false })
      ]);

      const enrollments = (enRes.data as unknown as EnrollmentWithCourse[]) || [];
      const ownedCourses = crRes.data || [];
      const totalCourses = coursesCountRes.count || 0;
      setHomepageTopics(topicsRes.data || []);
      
      const mappedDirectory = (directoryRes.data || []).map((entry: any) => ({
        ...entry,
        ...(typeof entry.content === 'object' && entry.content !== null ? entry.content : {})
      })) as DirectoryEntry[];
      setDirectoryEntries(mappedDirectory);

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

  // Topic management
  const handleSaveTopic = async () => {
    try {
      const { id, ...topicData } = topicForm;
      if (editingTopic && editingTopic.id) {
        const { error } = await supabase.from('homepage_topics').update(topicData).eq('id', editingTopic.id);
        if (error) throw error;
        setToast({ open: true, message: 'Topic updated successfully!', severity: 'success' });
      } else {
        const { error } = await supabase.from('homepage_topics').insert(topicData);
        if (error) throw error;
        setToast({ open: true, message: 'Topic created successfully!', severity: 'success' });
      }
      setTopicDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      const { error } = await supabase.from('homepage_topics').delete().eq('id', id);
      if (error) throw error;
      setToast({ open: true, message: 'Topic deleted!', severity: 'info' });
      fetchData();
    } catch (err: any) {
      setToast({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    }
  };

  const seedTopics = async () => {
    const templates = [
      { label: 'Pranavaha Srotas', slug: 'pranavaha-srotas', icon: '💨', description: 'Respiratory channels', sort_order: 1 },
      { label: 'Rasavaha Srotas', slug: 'rasavaha-srotas', icon: '💧', description: 'Nutritive channels', sort_order: 2 },
      { label: 'Vata Dosha', slug: 'vata-dosha', icon: '🌬️', description: 'Kinetic force', sort_order: 3 },
      { label: 'Pitta Dosha', slug: 'pitta-dosha', icon: '🔥', description: 'Metabolic force', sort_order: 4 },
      { label: 'Kapha Dosha', slug: 'kapha-dosha', icon: '🌊', description: 'Structural force', sort_order: 5 },
      { label: 'Ashwagandha', slug: 'ashwagandha', icon: '🌿', description: 'King of herbs', sort_order: 6 },
    ];
    const { error } = await supabase.from('homepage_topics').insert(templates);
    if (error) throw error;
    setToast({ open: true, message: 'Template topics seeded!', severity: 'success' });
    fetchData();
  };

  const sidebarItems = [
    { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'homepage', label: 'Homepage', icon: <WebIcon /> },
    { id: 'directory', label: 'Encyclopedia', icon: <MenuBookIcon /> },
    { id: 'students', label: 'Students', icon: <SchoolIcon /> },
    { id: 'creators', label: 'Creators', icon: <PersonIcon /> },
    { id: 'courses', label: 'All Courses', icon: <MenuBookIcon /> },
    { id: 'approvals', label: 'Requests', icon: <FactCheckIcon />, badge: pendingCourses.length },
  ];

  const handleSaveDirectoryEntry = async () => {
    try {
      const {
        id,
        ...rest
      } = directoryForm;

      const dataToSave = {
        ...rest,
        // Ensure arrays are handled correctly
        synonyms: typeof directoryForm.synonyms === 'string' ? (directoryForm.synonyms as string).split(',').map(s => s.trim()).filter(Boolean) : (directoryForm.synonyms || []),
        characteristics: typeof directoryForm.characteristics === 'string' ? (directoryForm.characteristics as string).split(',').map(s => s.trim()).filter(Boolean) : (directoryForm.characteristics || []),
        functions: typeof directoryForm.functions === 'string' ? (directoryForm.functions as string).split(',').map(s => s.trim()).filter(Boolean) : (directoryForm.functions || []),
        disorders: typeof directoryForm.disorders === 'string' ? (directoryForm.disorders as string).split(',').map(s => s.trim()).filter(Boolean) : (directoryForm.disorders || []),
        treatment_principles: typeof directoryForm.treatment_principles === 'string' ? (directoryForm.treatment_principles as string).split(',').map(s => s.trim()).filter(Boolean) : (directoryForm.treatment_principles || []),
      };

      if (editingEntry && editingEntry.id) {
        const { error } = await supabase.from('directory_entries').update(dataToSave).eq('id', editingEntry.id);
        if (error) throw error;
        setToast({ open: true, message: 'Entry updated successfully!', severity: 'success' });
      } else {
        const { error } = await supabase.from('directory_entries').insert(dataToSave);
        if (error) throw error;
        setToast({ open: true, message: 'Entry created successfully!', severity: 'success' });
      }
      setDirectoryDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this encyclopedia entry?')) return;
    try {
      const { error } = await supabase.from('directory_entries').delete().eq('id', id);
      if (error) throw error;
      setToast({ open: true, message: 'Entry deleted!', severity: 'info' });
      fetchData();
    } catch (err: any) {
      setToast({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    }
  };

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

                  {/* Homepage View */}
                  {view === 'homepage' && (
                    <>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h4" fontWeight={700} gutterBottom>Homepage Settings</Typography>
                          <Typography variant="body2" color="text.secondary">Manage topics and content shown on the landing page.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {homepageTopics.length === 0 && (
                            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={seedTopics}>Seed Templates</Button>
                          )}
                          <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => {
                              setEditingTopic(null);
                              setTopicForm({ label: '', slug: '', icon: '', description: '', sort_order: homepageTopics.length + 1 });
                              setTopicDialogOpen(true);
                            }}
                          >
                            Add Topic
                          </Button>
                        </Box>
                      </Box>

                      <Typography variant="h6" fontWeight={700} mb={2}>Explore Topics Section</Typography>
                      <Grid container spacing={2}>
                        {homepageTopics.map((topic) => (
                          <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ fontSize: '2rem' }}>{topic.icon}</Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={700}>{topic.label}</Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">slug: {topic.slug}</Typography>
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">{topic.description}</Typography>
                                </Box>
                                <Box>
                                  <IconButton size="small" onClick={() => {
                                    setEditingTopic(topic);
                                    setTopicForm(topic);
                                    setTopicDialogOpen(true);
                                  }}><EditIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => topic.id && handleDeleteTopic(topic.id)}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}

                  {/* Encyclopedia View */}
                  {view === 'directory' && (
                    <>
                      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h4" fontWeight={700} gutterBottom>Ayurveda Encyclopedia</Typography>
                          <Typography variant="body2" color="text.secondary">Manage the central directory of Srotas, Doshas, Herbs, and Diseases.</Typography>
                        </Box>
                        <Button 
                          variant="contained" 
                          startIcon={<AddIcon />} 
                          onClick={() => {
                            setEditingEntry(null);
                            setDirectoryForm({
                              type: 'Srotas', title: '', slug: '', sanskrit_name: '', english_name: '', meaning: '',
                              summary: '', definition: '', introduction: '', etiology: '', synonyms: [],
                              origin: '', panchabhautikatva: '', swaroop: '', characteristics: [],
                              types_description: '', sankhya: '', prakar_charak: '', prakar_sushruta: '',
                              moolasthana: '', viddha_lakshan: '', dushti: '', functions: [],
                              disorders: [], treatment_principles: []
                            });
                            setDirectoryDialogOpen(true);
                          }}
                        >
                          Add New Entry
                        </Button>
                      </Box>

                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(14,91,68,0.04)' }}>
                              <TableCell sx={{ fontWeight: 700 }}>Entry Name</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Slug</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {directoryEntries.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                  <Box sx={{ opacity: 0.5 }}>
                                    <MenuBookIcon sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="h6">No entries found</Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ) : (
                              directoryEntries.map((entry) => (
                                <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: 'rgba(14,91,68,0.02)' } }}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{entry.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">{entry.sanskrit_name}</Typography>
                                  </TableCell>
                                  <TableCell><Chip label={entry.type} size="small" variant="outlined" /></TableCell>
                                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{entry.slug}</Typography></TableCell>
                                  <TableCell><Typography variant="body2" color="text.secondary">Live</Typography></TableCell>
                                  <TableCell>
                                    <IconButton size="small" onClick={() => {
                                      setEditingEntry(entry);
                                      setDirectoryForm(entry);
                                      setDirectoryDialogOpen(true);
                                    }}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => entry.id && handleDeleteEntry(entry.id)}><DeleteIcon fontSize="small" /></IconButton>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
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

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingTopic ? 'Edit Topic' : 'Add New Topic'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              label="Label (Display Name)" 
              value={topicForm.label} 
              onChange={e => setTopicForm({...topicForm, label: e.target.value})} 
              fullWidth size="small" placeholder="e.g. Pranavaha Srotas"
            />
            <TextField 
              label="Slug (URL identifier)" 
              value={topicForm.slug} 
              onChange={e => setTopicForm({...topicForm, slug: e.target.value})} 
              fullWidth size="small" placeholder="e.g. pranavaha-srotas"
            />
            <TextField 
              label="Icon (Emoji)" 
              value={topicForm.icon} 
              onChange={e => setTopicForm({...topicForm, icon: e.target.value})} 
              fullWidth size="small" placeholder="e.g. 🌬️"
            />
            <TextField 
              label="Description (Short)" 
              value={topicForm.description} 
              onChange={e => setTopicForm({...topicForm, description: e.target.value})} 
              fullWidth size="small" placeholder="e.g. Respiratory channels"
            />
            <TextField 
              label="Sort Order" 
              type="number"
              value={topicForm.sort_order} 
              onChange={e => setTopicForm({...topicForm, sort_order: parseInt(e.target.value) || 0})} 
              fullWidth size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTopicDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTopic}>{editingTopic ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Directory Entry Dialog */}
      <Dialog 
        open={directoryDialogOpen} 
        onClose={() => setDirectoryDialogOpen(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{editingEntry ? 'Edit Encyclopedia Entry' : 'Add New Encyclopedia Entry'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                select
                label="Category / Type" 
                value={directoryForm.type} 
                onChange={e => setDirectoryForm({...directoryForm, type: e.target.value})} 
                fullWidth size="small"
                SelectProps={{ native: true }}
              >
                <option value="Srotas">Srotas</option>
                <option value="Dosha">Dosha</option>
                <option value="Dhatu">Dhatu</option>
                <option value="Herbs">Herbs</option>
                <option value="Disease">Disease</option>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Entry Title (English Name)" 
                value={directoryForm.title} 
                onChange={e => setDirectoryForm({...directoryForm, title: e.target.value, english_name: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Sanskrit Name" 
                value={directoryForm.sanskrit_name} 
                onChange={e => setDirectoryForm({...directoryForm, sanskrit_name: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Slug" 
                value={directoryForm.slug} 
                onChange={e => setDirectoryForm({...directoryForm, slug: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Meaning / Etymology Summary" 
                value={directoryForm.meaning} 
                onChange={e => setDirectoryForm({...directoryForm, meaning: e.target.value})} 
                fullWidth size="small" multiline rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Short Summary (Landing Page)" 
                value={directoryForm.summary} 
                onChange={e => setDirectoryForm({...directoryForm, summary: e.target.value})} 
                fullWidth size="small" multiline rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }}><Chip label="Detailed Content" size="small" /></Divider>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Introduction" 
                value={directoryForm.introduction} 
                onChange={e => setDirectoryForm({...directoryForm, introduction: e.target.value})} 
                fullWidth size="small" multiline rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Definition (Nirukti/Lakshan)" 
                value={directoryForm.definition} 
                onChange={e => setDirectoryForm({...directoryForm, definition: e.target.value})} 
                fullWidth size="small" multiline rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Moolasthana (Origin)" 
                value={directoryForm.moolasthana} 
                onChange={e => setDirectoryForm({...directoryForm, moolasthana: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Swaroop (Appearance/Nature)" 
                value={directoryForm.swaroop} 
                onChange={e => setDirectoryForm({...directoryForm, swaroop: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Sankhya (Number/Types)" 
                value={directoryForm.sankhya} 
                onChange={e => setDirectoryForm({...directoryForm, sankhya: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField 
                label="Synonyms (Comma separated)" 
                value={Array.isArray(directoryForm.synonyms) ? directoryForm.synonyms.join(', ') : directoryForm.synonyms} 
                onChange={e => setDirectoryForm({...directoryForm, synonyms: e.target.value})} 
                fullWidth size="small"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Functions / Karma (Comma separated)" 
                value={Array.isArray(directoryForm.functions) ? directoryForm.functions.join(', ') : directoryForm.functions} 
                onChange={e => setDirectoryForm({...directoryForm, functions: e.target.value})} 
                fullWidth size="small" multiline rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Associated Disorders / Dushti (Comma separated)" 
                value={Array.isArray(directoryForm.disorders) ? directoryForm.disorders.join(', ') : directoryForm.disorders} 
                onChange={e => setDirectoryForm({...directoryForm, disorders: e.target.value})} 
                fullWidth size="small" multiline rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField 
                label="Treatment Principles (Comma separated)" 
                value={Array.isArray(directoryForm.treatment_principles) ? directoryForm.treatment_principles.join(', ') : directoryForm.treatment_principles} 
                onChange={e => setDirectoryForm({...directoryForm, treatment_principles: e.target.value})} 
                fullWidth size="small" multiline rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDirectoryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDirectoryEntry}>{editingEntry ? 'Update Entry' : 'Create Entry'}</Button>
        </DialogActions>
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
