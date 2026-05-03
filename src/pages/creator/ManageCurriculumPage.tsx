import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../supabase/supabase';
import { useCourseStore } from '../../stores/courseStore';

export default function ManageCurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courses = useCourseStore(state => state.courses);
  const fetchCourses = useCourseStore(state => state.fetchCourses);
  const course = courses.find(c => c.id === id);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses().finally(() => setLoading(false));
  }, [fetchCourses]);

  const handleUploadClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLessonId || !course) return;

    try {
      setUploadingLessonId(selectedLessonId);
      setUploadProgress(10); // Fake initial progress

      const fileExt = file.name.split('.').pop();
      const fileName = `${course.id}/${selectedLessonId}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course_videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course_videos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ video_url: publicUrl })
        .eq('id', selectedLessonId);

      if (updateError) throw updateError;

      setUploadProgress(100);
      setToast({ open: true, message: 'Video uploaded successfully!', severity: 'success' });
      
      // Refresh course data
      await fetchCourses();

    } catch (err: any) {
      console.error(err);
      setToast({ open: true, message: err.message || 'Error uploading video', severity: 'error' });
    } finally {
      setTimeout(() => {
        setUploadingLessonId(null);
        setUploadProgress(0);
        setSelectedLessonId(null);
        setEditingLessonId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    }
  };

  const handleDeleteMedia = async (lessonId: string) => {
    try {
      // 1. Get current video URL to find the storage path
      const { data: lesson } = await supabase
        .from('lessons')
        .select('video_url')
        .eq('id', lessonId)
        .single();

      if (lesson?.video_url) {
        // Extract storage path from URL
        // URL format: .../storage/v1/object/public/course_videos/COURSE_ID/FILE_NAME
        const urlParts = lesson.video_url.split('/course_videos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('course_videos').remove([filePath]);
        }
      }

      // 2. Update database
      const { error } = await supabase
        .from('lessons')
        .update({ video_url: null })
        .eq('id', lessonId);

      if (error) throw error;

      setToast({ open: true, message: 'Media content removed!', severity: 'success' });
      await fetchCourses();
    } catch (err: any) {
      setToast({ open: true, message: err.message || 'Error removing media', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <Container sx={{ py: 10, textAlign: 'center' }}>
          <Typography>Loading curriculum...</Typography>
        </Container>
      </PageLayout>
    );
  }

  if (!course) {
    return (
      <PageLayout>
        <Container sx={{ py: 10, textAlign: 'center' }}>
          <Typography>Course not found.</Typography>
          <Button onClick={() => navigate('/creator')} sx={{ mt: 2 }}>Back to Dashboard</Button>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: 4 }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/creator')} sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Creator Dashboard
          </Button>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Manage Lectures</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Course: {course.title}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <input 
          type="file" 
          accept="video/mp4,video/x-m4v,video/*" 
          style={{ display: 'none' }} 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        {course.curriculum.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">No sections found for this course.</Typography>
          </Card>
        ) : (
          course.curriculum.map((section, sIdx) => (
            <Card key={section.id} sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Section {sIdx + 1}: {section.title}
                </Typography>
                
                {section.lessons.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No lessons in this section.</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {section.lessons.map((lesson, lIdx) => {
                      const isUploading = uploadingLessonId === lesson.id;
                      return (
                        <Box key={lesson.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {lIdx + 1}. {lesson.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {lesson.duration} | Type: {lesson.type}
                            </Typography>
                          </Box>
                          
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200, justifyContent: 'flex-end' }}>
                              {isUploading ? (
                                <Box sx={{ width: '100%' }}>
                                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3 }} />
                                  <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                                    Uploading... {uploadProgress}%
                                  </Typography>
                                </Box>
                              ) : lesson.videoUrl ? (
                                <Button 
                                  variant="outlined" 
                                  startIcon={<EditIcon />} 
                                  onClick={() => {
                                    setEditingLessonId(lesson.id);
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Edit Content
                                </Button>
                              ) : (
                                <Button 
                                  variant="contained" 
                                  startIcon={<CloudUploadIcon />} 
                                  onClick={() => handleUploadClick(lesson.id)}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Upload Video
                                </Button>
                              )}
                            </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Container>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} sx={{ borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>

      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Edit Lecture Content</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Manage the media content for this lecture.
          </Typography>
          <List sx={{ p: 0 }}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => {
                  setEditDialogOpen(false);
                  if (editingLessonId) handleUploadClick(editingLessonId);
                }}
                sx={{ borderRadius: 2, mb: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <ReplayIcon />
                </ListItemIcon>
                <ListItemText primary="Re-upload Content" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => {
                  if (editingLessonId) handleDeleteMedia(editingLessonId);
                  setEditDialogOpen(false);
                }}
                sx={{ borderRadius: 2, color: 'error.main' }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                  <DeleteIcon />
                </ListItemIcon>
                <ListItemText primary="Delete Media Content" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}
