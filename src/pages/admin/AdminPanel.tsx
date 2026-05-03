import { useState, useEffect, useRef } from 'react';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import RichTextEditor from '../../components/RichTextEditor';

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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LinearProgress from '@mui/material/LinearProgress';

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
  subtitle: string | null;
  year: string | null;
  pdf_url: string | null;
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
  excerpt: string;
  content: string;
  reading_time: number;
  author: string;
  created_at?: string;
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
  const [topicForm, setTopicForm] = useState<Topic>({ label: '', slug: '', icon: '📄', description: '', sort_order: 0, subtitle: '', year: '', pdf_url: null });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Directory entries state
  const [directoryEntries, setDirectoryEntries] = useState<DirectoryEntry[]>([]);
  const [directoryDialogOpen, setDirectoryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const emptyDirectoryForm: DirectoryEntry = { type: 'Srotas', title: '', slug: '', excerpt: '', content: '', reading_time: 5, author: 'Editorial Team' };
  const [directoryForm, setDirectoryForm] = useState<DirectoryEntry>(emptyDirectoryForm);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');

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
      setPdfUploading(true);
      let pdfUrl = topicForm.pdf_url;

      // Upload PDF if a new file was selected
      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${topicForm.slug || Date.now()}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('topic_pdfs')
          .upload(fileName, pdfFile, { cacheControl: '3600', upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('topic_pdfs').getPublicUrl(fileName);
        pdfUrl = publicUrl;
      }

      const { id, created_at, ...topicData } = topicForm;
      const dataToSave = { ...topicData, pdf_url: pdfUrl };

      if (editingTopic && editingTopic.id) {
        const { error } = await supabase.from('homepage_topics').update(dataToSave).eq('id', editingTopic.id);
        if (error) throw error;
        setToast({ open: true, message: 'Topic updated successfully!', severity: 'success' });
      } else {
        const { error } = await supabase.from('homepage_topics').insert(dataToSave);
        if (error) throw error;
        setToast({ open: true, message: 'Topic created successfully!', severity: 'success' });
      }
      setTopicDialogOpen(false);
      setPdfFile(null);
      fetchData();
    } catch (err: any) {
      setToast({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    } finally {
      setPdfUploading(false);
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
      { label: 'Kriya Sharir Notes', slug: 'kriya-sharir-notes', icon: '📄', description: 'Physiology study material', sort_order: 1, subtitle: 'Complete BAMS Physiology', year: '2025' },
      { label: 'Rachana Sharir Notes', slug: 'rachana-sharir-notes', icon: '📄', description: 'Anatomy study material', sort_order: 2, subtitle: 'Detailed Anatomy Reference', year: '2025' },
      { label: 'Dravyaguna Notes', slug: 'dravyaguna-notes', icon: '📄', description: 'Pharmacology study material', sort_order: 3, subtitle: 'Herbal Drug Reference', year: '2024' },
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
      const { id, created_at, ...rest } = directoryForm as DirectoryEntry & { created_at?: string };
      if (editingEntry && editingEntry.id) {
        const { error } = await supabase.from('directory_entries').update(rest).eq('id', editingEntry.id);
        if (error) throw error;
        setToast({ open: true, message: 'Article updated successfully!', severity: 'success' });
      } else {
        const { error } = await supabase.from('directory_entries').insert(rest);
        if (error) throw error;
        setToast({ open: true, message: 'Article created successfully!', severity: 'success' });
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
                              setPdfFile(null);
                              setTopicForm({ label: '', slug: '', icon: '📄', description: '', sort_order: homepageTopics.length + 1, subtitle: '', year: '', pdf_url: null });
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
                              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: topic.pdf_url ? 'rgba(220,38,38,0.1)' : 'rgba(14,91,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <PictureAsPdfIcon sx={{ color: topic.pdf_url ? '#DC2626' : 'text.secondary' }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle1" fontWeight={700} noWrap>{topic.label}</Typography>
                                  {topic.subtitle && <Typography variant="caption" color="text.secondary" display="block" noWrap>{topic.subtitle}</Typography>}
                                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    {topic.year && <Chip label={topic.year} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                    <Chip label={topic.pdf_url ? 'PDF Attached' : 'No PDF'} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: topic.pdf_url ? '#D1FAE5' : '#FEF3C7', color: topic.pdf_url ? '#065F46' : '#92400E' }} />
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <IconButton size="small" onClick={() => {
                                    setEditingTopic(topic);
                                    setTopicForm(topic);
                                    setPdfFile(null);
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
                          <Typography variant="body2" color="text.secondary">Manage the single, comprehensive encyclopedia page content. Supports rich HTML with multiple sections.</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {directoryEntries.length === 0 ? (
                          <Box sx={{ py: 12, textAlign: 'center', opacity: 0.5, border: '2px dashed', borderColor: 'divider', borderRadius: 4 }}>
                            <MenuBookIcon sx={{ fontSize: 56, mb: 2, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">Encyclopedia Not Initialized</Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>Click below to create the main encyclopedia page.</Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => { setEditingEntry(null); setDirectoryForm(emptyDirectoryForm); setDirectoryDialogOpen(true); }}
                            >
                              Initialize Content
                            </Button>
                          </Box>
                        ) : (
                          <Card elevation={0} sx={{ border: '2px solid', borderColor: 'primary.main', borderRadius: 3, p: 2 }}>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(14,91,68,0.08)', borderRadius: 3 }}>
                                <MenuBookIcon color="primary" sx={{ fontSize: 40 }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Main Encyclopedia Page</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  This content acts as the single, authoritative page for the entire directory.
                                </Typography>
                                <Typography variant="caption" color="text.disabled">{directoryEntries[0].reading_time} min read • Updated recently</Typography>
                              </Box>
                              <Box>
                                <Button
                                  size="large"
                                  startIcon={<EditIcon />}
                                  variant="contained"
                                  onClick={() => { setEditingEntry(directoryEntries[0]); setDirectoryForm(directoryEntries[0]); setDirectoryDialogOpen(true); }}
                                >
                                  Edit Content
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
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
      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingTopic ? 'Edit Study Material' : 'Add New Study Material'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField 
              label="Title" 
              value={topicForm.label} 
              onChange={e => {
                const label = e.target.value;
                const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                setTopicForm({...topicForm, label, slug });
              }} 
              fullWidth size="small" placeholder="e.g. Kriya Sharir Complete Notes"
            />
            <TextField 
              label="Subtitle" 
              value={topicForm.subtitle || ''} 
              onChange={e => setTopicForm({...topicForm, subtitle: e.target.value})} 
              fullWidth size="small" placeholder="e.g. BAMS 1st Year Physiology"
            />
            <TextField 
              label="Year" 
              value={topicForm.year || ''} 
              onChange={e => setTopicForm({...topicForm, year: e.target.value})} 
              fullWidth size="small" placeholder="e.g. 2025"
            />

            {/* PDF Upload */}
            <Box>
              <input
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                ref={pdfInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPdfFile(file);
                }}
              />
              <Box sx={{ border: '2px dashed', borderColor: pdfFile || topicForm.pdf_url ? 'success.main' : 'divider', borderRadius: 3, p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(14,91,68,0.02)' } }} onClick={() => pdfInputRef.current?.click()}>
                <PictureAsPdfIcon sx={{ fontSize: 40, color: pdfFile || topicForm.pdf_url ? '#DC2626' : 'text.disabled', mb: 1 }} />
                {pdfFile ? (
                  <>
                    <Typography variant="body2" fontWeight={600} color="success.main">New file selected</Typography>
                    <Typography variant="caption" color="text.secondary">{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</Typography>
                  </>
                ) : topicForm.pdf_url ? (
                  <>
                    <Typography variant="body2" fontWeight={600} color="success.main">PDF already uploaded</Typography>
                    <Typography variant="caption" color="text.secondary">Click to replace with a new file</Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" fontWeight={600}>Click to upload PDF</Typography>
                    <Typography variant="caption" color="text.secondary">Supported: PDF files up to 50MB</Typography>
                  </>
                )}
              </Box>
            </Box>

            {pdfUploading && <LinearProgress sx={{ borderRadius: 2 }} />}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => { setTopicDialogOpen(false); setPdfFile(null); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTopic} disabled={pdfUploading || !topicForm.label}>
            {pdfUploading ? 'Uploading...' : editingTopic ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Editor Dialog */}
      <Dialog
        open={directoryDialogOpen}
        onClose={() => setDirectoryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, height: '90vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(14,91,68,0.08)', borderRadius: 2, display: 'flex' }}>
              <MenuBookIcon color="primary" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>{editingEntry ? 'Edit Article' : 'Write New Article'}</Typography>
              
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Grid container sx={{ height: '100%' }}>
            {/* Left: Metadata panel */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ borderRight: '1px solid', borderColor: 'divider', p: 3, overflowY: 'auto', bgcolor: '#FAFAF8' }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.disabled', letterSpacing: 2, display: 'block', mb: 2 }}>Article Metadata</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  select
                  label="Category"
                  value={directoryForm.type}
                  onChange={e => setDirectoryForm({ ...directoryForm, type: e.target.value })}
                  fullWidth size="small"
                  SelectProps={{ native: true }}
                >
                  <option value="Srotas">🌊 Srotas</option>
                  <option value="Dosha">⚡ Dosha</option>
                  <option value="Dhatu">💎 Dhatu</option>
                  <option value="Herbs">🌱 Herbs</option>
                  <option value="Disease">🩺 Disease</option>
                </TextField>

                <TextField
                  label="Article Title"
                  value={directoryForm.title}
                  onChange={e => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setDirectoryForm({ ...directoryForm, title, slug });
                  }}
                  fullWidth size="small"
                  placeholder="e.g. Srotas Sharir"
                />

                <TextField
                  label="URL Slug"
                  value={directoryForm.slug}
                  onChange={e => setDirectoryForm({ ...directoryForm, slug: e.target.value })}
                  fullWidth size="small"
                  placeholder="srotas-sharir"
                  InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
                  helperText="/directory/[slug]"
                />

                <TextField
                  label="Excerpt (summary for cards)"
                  value={directoryForm.excerpt}
                  onChange={e => setDirectoryForm({ ...directoryForm, excerpt: e.target.value })}
                  fullWidth size="small"
                  multiline rows={4}
                  placeholder="2-3 sentence summary shown on the blog listing page..."
                />

                <TextField
                  label="Reading Time (minutes)"
                  type="number"
                  value={directoryForm.reading_time}
                  onChange={e => setDirectoryForm({ ...directoryForm, reading_time: parseInt(e.target.value) || 5 })}
                  fullWidth size="small"
                  inputProps={{ min: 1, max: 120 }}
                />

                <TextField
                  label="Author"
                  value={directoryForm.author}
                  onChange={e => setDirectoryForm({ ...directoryForm, author: e.target.value })}
                  fullWidth size="small"
                  placeholder="Editorial Team"
                />

                <Divider />
                <Box sx={{ p: 2, bgcolor: 'rgba(14,91,68,0.04)', borderRadius: 2, border: '1px solid rgba(14,91,68,0.1)' }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" display="block" mb={1}>Quick HTML Tags</Typography>
                  {[
                    ['&lt;h2&gt;', 'Section heading'],
                    ['&lt;h3&gt;', 'Sub-heading'],
                    ['&lt;p&gt;', 'Paragraph'],
                    ['&lt;blockquote&gt;', 'Sanskrit quote'],
                    ['&lt;ul&gt;&lt;li&gt;', 'Bullet list'],
                    ['&lt;ol&gt;&lt;li&gt;', 'Numbered list'],
                    ['&lt;strong&gt;', 'Bold'],
                    ['&lt;em&gt;', 'Highlight (green)'],
                  ].map(([tag, desc]) => (
                    <Box key={tag} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0E5B44', fontSize: '0.7rem' }} dangerouslySetInnerHTML={{ __html: tag }} />
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>{desc}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Right: Content editor with tabs */}
            <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Tab switcher */}
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
                <Tabs
                  value={editorMode}
                  onChange={(_e, v) => setEditorMode(v)}
                  sx={{
                    minHeight: 44,
                    '& .MuiTab-root': { minHeight: 44, fontWeight: 700, fontSize: '0.8rem', textTransform: 'none', px: 2 },
                    '& .MuiTabs-indicator': { bgcolor: 'primary.main', height: 3, borderRadius: '3px 3px 0 0' },
                  }}
                >
                  <Tab value="visual" label="✏️  Visual Editor" />
                  <Tab value="html" label="</> HTML Editor" />
                </Tabs>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={editorMode === 'visual' ? 'WYSIWYG Mode' : 'Raw HTML Mode'}
                    size="small"
                    sx={{ bgcolor: editorMode === 'visual' ? '#E8F5EF' : '#EDE9FE', color: editorMode === 'visual' ? '#065F46' : '#5B21B6', fontSize: '0.65rem', fontWeight: 700 }}
                  />
                  <Typography variant="caption" color="text.disabled">{directoryForm.content?.length || 0} chars</Typography>
                </Box>
              </Box>

              {/* Visual Editor */}
              <Box sx={{ flex: 1, overflow: 'hidden', display: editorMode === 'visual' ? 'flex' : 'none', flexDirection: 'column' }}>
                <RichTextEditor
                  value={directoryForm.content || ''}
                  onChange={(html) => setDirectoryForm(f => ({ ...f, content: html }))}
                  placeholder="Start writing your article... Use the toolbar above for formatting."
                />
              </Box>

              {/* HTML Editor */}
              <Box sx={{ flex: 1, overflow: 'hidden', display: editorMode === 'html' ? 'flex' : 'none', flexDirection: 'column' }}>
                <textarea
                  value={directoryForm.content}
                  onChange={e => setDirectoryForm({ ...directoryForm, content: e.target.value })}
                  placeholder={`<h1>Article Title</h1>\n\n<h2>Introduction</h2>\n<p>Write your introduction here...</p>\n\n<h2>Definition</h2>\n<blockquote>Sanskrit verse here (च.सू.)</blockquote>\n<p>Explanation...</p>`}
                  style={{
                    flex: 1,
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    padding: '24px',
                    fontSize: '13px',
                    fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
                    lineHeight: '1.8',
                    color: '#1f2937',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                    tabSize: 2,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={() => setDirectoryDialogOpen(false)} variant="outlined" color="inherit">Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            onClick={handleSaveDirectoryEntry}
            disabled={!directoryForm.title || !directoryForm.slug}
            size="large"
            sx={{ px: 4 }}
          >
            {editingEntry ? '✓ Update Article' : '✓ Publish Article'}
          </Button>
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
