import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { useCourseStore } from '../stores/courseStore';
import { useProgressStore } from '../stores/progressStore';
import { supabase } from '../supabase/supabase';
import { generateCertificate } from '../utils/certificateGenerator';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id: profileId } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, logout, updateProfile } = useAuthStore();
  const { enrolledCourses, courses, wishlist } = useCourseStore();
  const { getCourseProgress } = useProgressStore();
  
  const [profileUser, setProfileUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', college: '', year: '', bio: '' });
  const [toast, setToast] = useState({ open: false, message: '' });
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = !profileId || profileId === currentUser?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (isOwnProfile) {
        setProfileUser(currentUser);
        if (currentUser) {
          setEditForm({ 
            name: currentUser.name || '', 
            college: currentUser.college || '', 
            year: currentUser.year || '', 
            bio: currentUser.bio || '' 
          });
        }
        setLoading(false);
      } else if (profileId) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        
        if (!error && profile) {
          setProfileUser({
            id: profile.id,
            name: profile.full_name || '',
            email: profile.email || '',
            college: profile.college || '',
            year: profile.year || '',
            role: (profile.role as 'student' | 'creator' | 'admin') || 'student',
            avatar: profile.avatar_url || (profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '??'),
            bio: profile.bio || '',
          });
        }
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileId, currentUser, isOwnProfile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    console.log('Starting avatar upload for user:', currentUser.id);

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Avatar uploaded successfully. Public URL:', publicUrl);
      setTempAvatar(publicUrl);
      setToast({ open: true, message: 'Avatar uploaded! Click Save to confirm.' });
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setToast({ open: true, message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    console.log('Saving profile. tempAvatar:', tempAvatar, 'current avatar:', currentUser?.avatar);
    try {
      await updateProfile({
        ...editForm,
        avatar: tempAvatar || currentUser?.avatar
      });
      setEditOpen(false);
      setToast({ open: true, message: 'Profile updated successfully!' });
      setTempAvatar(null);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setToast({ open: true, message: 'Failed to save changes.' });
    }
  };
  const displayUser = isOwnProfile ? currentUser : profileUser;

  if (loading) {
    return (
      <PageLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (!displayUser) {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>👤</Typography>
          <Typography variant="h5" fontWeight={700} mb={2}>
            {isOwnProfile && !isAuthenticated ? 'Sign in to view your profile' : 'Profile not found'}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate(!isAuthenticated ? '/' : '/courses')}>
            {!isAuthenticated ? 'Go Home' : 'Browse Courses'}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const enrolledData = enrolledCourses
    .map(e => ({ ...e, course: courses.find(c => c.id === e.courseId) }))
    .filter(e => e.course);

  const completedCourses = enrolledData.filter(e => e.course && e.course.certificate && getCourseProgress(e.courseId, e.course.totalLessons) === 100);
  const wishlistCourses = courses.filter(c => wishlist.includes(c.id));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDownloadCertificate = async (course: any) => {
    if (!displayUser) return;
    
    setDownloadingCert(course.id);
    try {
      const { data: certSettings } = await supabase
        .from('certificate_settings')
        .select('template_url')
        .single();
        
      if (!certSettings?.template_url) {
        setToast({ open: true, message: "Certificate template not configured yet." });
        return;
      }

      const pdfBytes = await generateCertificate(certSettings.template_url, {
        studentName: displayUser.name || "Student",
        courseName: course.title,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        certificateId: `CERT-${course.id.substring(0, 8)}-${displayUser.id.substring(0, 4)}`.toUpperCase(),
        creatorName: course.instructor || "Srotaayurveda Expert"
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Certificate_${course.title.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: "Failed to generate certificate." });
    } finally {
      setDownloadingCert(null);
    }
  };

  const avatarUrl = (displayUser.avatar?.startsWith('http') || displayUser.avatar?.startsWith('/')) ? displayUser.avatar : undefined;

  return (
    <PageLayout>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!isOwnProfile && (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Back
              </Button>
            )}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: { xs: 72, md: 96 },
                    height: { xs: 72, md: 96 },
                    bgcolor: displayUser.role === 'creator' ? '#D1FAE5' : '#D4A017',
                    color: displayUser.role === 'creator' ? '#065F46' : 'white',
                    fontSize: { xs: '1.8rem', md: '2.4rem' },
                    fontWeight: 700,
                    border: '4px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {displayUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Chip
                  label={displayUser.role}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: displayUser.role === 'admin' ? '#FEF3C7' : displayUser.role === 'creator' ? '#D1FAE5' : '#E0E7FF',
                    color: displayUser.role === 'admin' ? '#92400E' : displayUser.role === 'creator' ? '#065F46' : '#3730A3',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, mt: 1 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {displayUser.name}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
                  🏫 {displayUser.college} • {displayUser.year}
                </Typography>
                {displayUser.bio && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                    {displayUser.bio}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  📧 {displayUser.email}
                </Typography>
              </Box>

              {isOwnProfile && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => { setEditForm({ name: displayUser.name, college: displayUser.college, year: displayUser.year, bio: displayUser.bio }); setEditOpen(true); }}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', border: '1px solid', bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,0,0,0.1)', color: '#FCA5A5' } }}
                  >
                    Sign Out
                  </Button>
                </Box>
              )}
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, mt: 4, flexWrap: 'wrap' }}>
              {[
                { value: isOwnProfile ? enrolledData.length : 0, label: 'Enrolled', icon: '📚' },
                { value: isOwnProfile ? completedCourses.length : 0, label: 'Completed', icon: '✅' },
                { value: isOwnProfile ? wishlistCourses.length : 0, label: 'Wishlisted', icon: '❤️' },
              ].map((stat, i) => (
                <Box key={i} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.25 }}>{stat.icon}</Typography>
                  <Typography variant="h5" sx={{ color: '#D4A017', fontWeight: 700 }}>{stat.value}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{stat.label}</Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {/* My Courses */}
          <Grid size={{ xs: 12, md: 8 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ color: 'primary.main' }} /> {isOwnProfile ? 'My Courses' : 'Courses'} ({isOwnProfile ? enrolledData.length : 0})
              </Typography>

              {!isOwnProfile ? (
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">Enrolled courses are private.</Typography>
                </Card>
              ) : enrolledData.length === 0 ? (
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No courses enrolled yet.</Typography>
                  <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                </Card>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {enrolledData.map(({ course, courseId, enrolledAt }) => {
                    if (!course) return null;
                    const prog = getCourseProgress(courseId, course.totalLessons);
                    return (
                      <Card key={courseId} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/learning/${courseId}`)}>
                        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                            <img src="/srotoayurveda_logo.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>{course.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{course.instructor}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                              <LinearProgress variant="determinate" value={prog} sx={{ flex: 1, height: 5, borderRadius: 3 }} />
                              <Typography variant="caption" fontWeight={600} color="primary.main">{prog}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Chip
                              label={prog === 100 ? 'Complete' : prog > 0 ? 'In Progress' : 'Not Started'}
                              size="small"
                              sx={{
                                bgcolor: prog === 100 ? '#D1FAE5' : prog > 0 ? '#FEF3C7' : 'grey.100',
                                color: prog === 100 ? '#065F46' : prog > 0 ? '#92400E' : 'text.secondary',
                                fontWeight: 600,
                                fontSize: '0.65rem',
                              }}
                            />
                            <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                              {new Date(enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </motion.div>

            {/* Certificates */}
            {isOwnProfile && completedCourses.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Typography variant="h6" fontWeight={700} mt={4} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkspacePremiumIcon sx={{ color: '#D4A017' }} /> Certificates ({completedCourses.length})
                </Typography>
                <Grid container spacing={2}>
                  {completedCourses.map(({ course, courseId }) => {
                    if (!course) return null;
                    return (
                      <Grid key={courseId} size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            p: 2.5,
                            border: '2px solid #D4A017',
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #FEF3C7 0%, #FFF 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: -20, right: -20, fontSize: '5rem', opacity: 0.08 }}>🏆</Box>
                          <Chip label="Certificate" size="small" sx={{ bgcolor: '#D4A017', color: 'white', fontWeight: 700, mb: 1 }} />
                          <Typography variant="subtitle2" fontWeight={700}>{course.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{course.instructor}</Typography>
                          <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                            Completed • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </Typography>
                          <Button 
                            size="small" 
                            sx={{ mt: 1.5, color: '#92400E', borderColor: '#D4A017' }} 
                            variant="outlined"
                            onClick={() => handleDownloadCertificate(course)}
                            disabled={downloadingCert === course.id}
                          >
                            {downloadingCert === course.id ? 'Generating...' : 'Download Certificate'}
                          </Button>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </motion.div>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              {/* Wishlist */}
              {isOwnProfile && (
                <Box mb={4}>
                  <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FavoriteIcon sx={{ color: '#DC2626' }} /> Wishlist ({wishlistCourses.length})
                  </Typography>
                  {wishlistCourses.slice(0, 3).map(c => (
                    <Box
                      key={c.id}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'center',
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(14,91,68,0.04)' },
                      }}
                      onClick={() => navigate(`/courses/${c.id}`)}
                    >
                      <Box sx={{ width: 40, height: 40, borderRadius: 1.5, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src="/srotoayurveda_logo.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} display="block" noWrap>{c.title}</Typography>
                        <Typography variant="caption" color="primary.main" fontWeight={700}>
                          {c.free ? 'Free' : `₹${c.price.toLocaleString()}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {wishlistCourses.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No wishlisted courses yet.</Typography>
                  )}
                </Box>
              )}

              {isOwnProfile && <Divider />}

              {/* Dashboard Access */}
              {isOwnProfile && (displayUser.role === 'creator' || displayUser.role === 'admin') && (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Quick Access</Typography>
                  
                  {displayUser.role === 'admin' && (
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      startIcon={<AdminPanelSettingsIcon />}
                      onClick={() => navigate('/admin')}
                      sx={{ py: 1.2, borderRadius: 2, fontWeight: 700 }}
                    >
                      Admin Panel
                    </Button>
                  )}
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate('/creator')}
                    sx={{ py: 1.2, borderRadius: 2, fontWeight: 700 }}
                  >
                    Creator Dashboard
                  </Button>
                </Box>
              )}
              
              {!isOwnProfile && displayUser.role === 'creator' && (
                <Box sx={{ p: 3, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #BBF7D0' }}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main" mb={1}>
                    Creator Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This user is a verified creator on Srotaayurveda.
                  </Typography>
                </Box>
              )}
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar 
                src={tempAvatar || ((currentUser?.avatar?.startsWith('http') || currentUser?.avatar?.startsWith('/')) ? currentUser.avatar : undefined)} 
                sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'primary.main' }}
              >
                {currentUser?.name?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  sx={{ borderRadius: 2 }}
                >
                  Change Avatar
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  JPG, PNG or GIF. Max 2MB.
                </Typography>
              </Box>
            </Box>
            <TextField label="Full Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} size="small" fullWidth />
            <TextField label="College / Institution" value={editForm.college} onChange={e => setEditForm(f => ({ ...f, college: e.target.value }))} size="small" fullWidth />
            <TextField label="Year of Study" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))} size="small" fullWidth />
            <TextField label="Bio" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} size="small" fullWidth multiline rows={3} placeholder="Tell us about yourself..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained" color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>
    </PageLayout>
  );
}
