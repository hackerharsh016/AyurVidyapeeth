import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { supabase } from '../../supabase/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import type { Course, Section, Lesson } from '../../data/courses';
import { SUBJECTS } from '../../constants/subjects';

const steps = ['Basic Info', 'Course Details', 'Curriculum', 'Review & Submit'];

export default function UploadCoursePage() {
  const navigate = useNavigate();
  const { addCourse } = useCourseStore();
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    price: '',
    level: '1st Professional' as '1st Professional' | '2nd Professional' | '3rd Professional',
    subject: SUBJECTS[0],
    category: 'Pharmacology',
    language: 'English',
    description: '',
    whatYouLearn: ['', '', '', ''],
    hasCertificate: true,
    validityMonths: 12,
    thumbnail: '',
  });

  const [sections, setSections] = useState<(Omit<Section, 'lessons'> & { lessons: (Omit<Lesson, never> & { videoUrl?: string })[] })[]>([
    { id: 's1', title: 'Introduction', lessons: [{ id: 'l1', title: '', duration: '10:00', type: 'video', videoUrl: '' }] },
  ]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [abortControllers, setAbortControllers] = useState<{ [key: string]: AbortController }>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUpload, setCurrentUpload] = useState<{ sectionId: string, lessonId: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ sectionId: string, lessonId: string } | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const addSection = () => {
    const id = `s${Date.now()}`;
    setSections(s => [...s, { id, title: 'New Section', lessons: [{ id: `l${Date.now()}`, title: '', duration: '10:00', type: 'video' }] }]);
  };



  const addLesson = (sectionId: string) => {
    setSections(s => s.map(sec => sec.id === sectionId
      ? { ...sec, lessons: [...sec.lessons, { id: `l${Date.now()}`, title: '', duration: '10:00', type: 'video' as const }] }
      : sec
    ));
  };

  const updateLesson = (sectionId: string, lessonId: string, key: string, value: string) => {
    setSections(s => s.map(sec => sec.id === sectionId
      ? { ...sec, lessons: sec.lessons.map(l => l.id === lessonId ? { ...l, [key]: value } : l) }
      : sec
    ));
  };

  const removeLesson = async (sectionId: string, lessonId: string) => {
    // 1. Stop upload if in progress
    if (abortControllers[lessonId]) {
      abortControllers[lessonId].abort();
      setAbortControllers(prev => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
    
    // 2. Delete from storage if already uploaded
    const section = sections.find(s => s.id === sectionId);
    const lesson = section?.lessons.find(l => l.id === lessonId);
    if (lesson?.videoUrl) {
      const urlParts = lesson.videoUrl.split('/course_videos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('course_videos').remove([filePath]);
      }
    }

    // 3. Clear progress
    setUploadProgress(prev => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });

    setSections(s => s.map(sec => sec.id === sectionId
      ? { ...sec, lessons: sec.lessons.filter(l => l.id !== lessonId) }
      : sec
    ));
  };

  const removeSection = async (id: string) => {
    // Delete all videos in this section from storage
    const section = sections.find(s => s.id === id);
    if (section) {
      const filesToRemove = section.lessons
        .filter(l => l.videoUrl)
        .map(l => {
          const parts = l.videoUrl!.split('/course_videos/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean) as string[];
      
      if (filesToRemove.length > 0) {
        await supabase.storage.from('course_videos').remove(filesToRemove);
      }
    }
    setSections(s => s.filter(sec => sec.id !== id));
  };

  const handleUploadClick = (sectionId: string, lessonId: string) => {
    setCurrentUpload({ sectionId, lessonId });
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUpload) return;

    const { sectionId, lessonId } = currentUpload;

    try {
      const controller = new AbortController();
      setAbortControllers(prev => ({ ...prev, [lessonId]: controller }));
      setUploadProgress(prev => ({ ...prev, [lessonId]: 10 }));

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `temp/${Date.now()}_${lessonId}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('course_videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          // @ts-ignore - Some versions of supabase-js might not type this, but it accepts it
          abortSignal: controller.signal
        });

      if (uploadError) throw uploadError;

      setUploadProgress(prev => ({ ...prev, [lessonId]: 80 }));

      const { data: { publicUrl } } = supabase.storage
        .from('course_videos')
        .getPublicUrl(fileName);

      // Update local state
      updateLesson(sectionId, lessonId, 'videoUrl', publicUrl);
      
      setUploadProgress(prev => ({ ...prev, [lessonId]: 100 }));
      setToast({ open: true, message: 'Video uploaded to curriculum!', severity: 'success' });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Upload aborted');
        return;
      }
      console.error(err);
      setToast({ open: true, message: err.message || 'Upload failed', severity: 'error' });
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    } finally {
      setAbortControllers(prev => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      setCurrentUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setThumbnailUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, thumbnail: publicUrl }));
      setToast({ open: true, message: 'Course thumbnail uploaded!', severity: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, message: err.message || 'Upload failed', severity: 'error' });
    } finally {
      setThumbnailUploading(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!form.title || !form.description) {
      setToast({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    const newCourse: Course = {
      id: `c${Date.now()}`,
      title: form.title,
      subtitle: form.subtitle,
      instructor: user?.name || 'Unknown',
      instructorBio: user?.bio || '',
      instructorAvatar: user?.avatar || 'AV',
      thumbnail: form.thumbnail || '/api/placeholder/400/225',
      price: parseFloat(form.price) || 0,
      originalPrice: parseFloat(form.price) * 1.5 || 0,
      rating: 0,
      students: 0,
      duration: '0 hrs',
      level: form.level,
      language: form.language,
      subject: form.subject,
      tags: [form.subject.toLowerCase()],
      description: form.description,
      whatYouLearn: form.whatYouLearn.filter(Boolean),
      curriculum: sections.map(s => ({
        id: s.id,
        title: s.title,
        lessons: s.lessons as Lesson[],
      })),
      reviews: [],
      category: form.category,
      free: parseFloat(form.price) === 0,
      certificate: form.hasCertificate,
      validityMonths: form.validityMonths,
      totalLessons: sections.reduce((sum, s) => sum + s.lessons.length, 0),
      totalPdfs: 0,
      status: 'pending',
      creatorId: user?.id || '',
    };

    addCourse(newCourse);
    setToast({ open: true, message: '🎉 Course submitted for review! Status: Pending Approval', severity: 'success' });
    setTimeout(() => navigate('/creator'), 2000);
  };

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/creator')} sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Creator Dashboard
          </Button>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>Create New Course</Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>Share your Ayurveda expertise with thousands of students</Typography>
        </Container>
      </Box>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="video/*,application/pdf"
        onChange={handleFileChange}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stepper activeStep={activeStep} sx={{ mb: 5, display: { xs: 'none', sm: 'flex' } }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Typography variant="body2" sx={{ mb: 3, display: { sm: 'none' }, color: 'primary.main', fontWeight: 600 }}>
          Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
        </Typography>

        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>Basic Information</Typography>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <TextField label="Course Title *" value={form.title} onChange={e => updateField('title', e.target.value)} fullWidth helperText="e.g. Comprehensive Dravyaguna for BAMS Students" />
                    </Grid>
                    <Grid size={12}>
                      <TextField label="Course Subtitle *" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)} fullWidth helperText="A brief one-liner about your course" />
                    </Grid>
                    
                    <Grid size={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={1}>Course Thumbnail *</Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' }, 
                        gap: 3, 
                        alignItems: 'center',
                        p: 2,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.01)'
                      }}>
                        <Box sx={{ 
                          width: { xs: '100%', sm: 240 }, 
                          height: 135, 
                          borderRadius: 2, 
                          overflow: 'hidden', 
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          {form.thumbnail ? (
                            <img src={form.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">No thumbnail uploaded</Typography>
                          )}
                        </Box>
                        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                          <input
                            type="file"
                            accept="image/*"
                            ref={thumbnailInputRef}
                            style={{ display: 'none' }}
                            onChange={handleThumbnailUpload}
                          />
                          <Button 
                            variant="outlined" 
                            startIcon={thumbnailUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                            onClick={() => thumbnailInputRef.current?.click()}
                            disabled={thumbnailUploading}
                            sx={{ mb: 1, borderRadius: 2 }}
                          >
                            {form.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                          </Button>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Recommended size: 1280x720 (16:9 ratio). Max 2MB.
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select value={form.subject} onChange={e => updateField('subject', e.target.value)} label="Subject">
                          {SUBJECTS.map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Professional Year</InputLabel>
                        <Select value={form.level} onChange={e => updateField('level', e.target.value as '1st Professional' | '2nd Professional' | '3rd Professional')} label="Professional Year">
                          {['1st Professional', '2nd Professional', '3rd Professional'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Course Price (₹)"
                        type="number"
                        value={form.price}
                        onChange={e => updateField('price', e.target.value)}
                        fullWidth
                        helperText="Enter 0 for free course"
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Language</InputLabel>
                        <Select value={form.language} onChange={e => updateField('language', e.target.value)} label="Language">
                          {['English', 'Hindi', 'Hindi + English', 'Sanskrit + English', 'Tamil', 'Malayalam'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Course Validity</InputLabel>
                        <Select value={form.validityMonths} onChange={e => setForm(f => ({ ...f, validityMonths: Number(e.target.value) }))} label="Course Validity">
                          {[6, 12, 24].map(v => <MenuItem key={v} value={v}>{v} Months</MenuItem>)}
                        </Select>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>Course cannot be deleted if active students exist within this period.</Typography>
                      </FormControl>
                    </Grid>
                    <Grid size={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(14,91,68,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'rgba(14,91,68,0.1)' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>Enable Course Certificate</Typography>
                          <Typography variant="caption" color="text.secondary">Students will receive a professional certificate upon 100% completion of this course.</Typography>
                        </Box>
                        <Button 
                          variant={form.hasCertificate ? "contained" : "outlined"}
                          onClick={() => setForm(f => ({ ...f, hasCertificate: !f.hasCertificate }))}
                          sx={{ borderRadius: 2 }}
                        >
                          {form.hasCertificate ? "Enabled" : "Disabled"}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>Course Details</Typography>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <TextField
                        label="Course Description *"
                        value={form.description}
                        onChange={e => updateField('description', e.target.value)}
                        fullWidth
                        multiline
                        rows={5}
                        helperText="Describe what students will learn and who this course is for"
                      />
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="subtitle2" fontWeight={700} mb={2}>
                        What Students Will Learn (add 4+ points)
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {form.whatYouLearn.map((item, i) => (
                          <TextField
                            key={i}
                            label={`Learning Outcome ${i + 1}`}
                            value={item}
                            onChange={e => {
                              const updated = [...form.whatYouLearn];
                              updated[i] = e.target.value;
                              setForm(f => ({ ...f, whatYouLearn: updated }));
                            }}
                            fullWidth
                            size="small"
                            placeholder={i === 0 ? 'e.g. Understand all 20 Gunas of Dravya' : ''}
                          />
                        ))}
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => setForm(f => ({ ...f, whatYouLearn: [...f.whatYouLearn, ''] }))}
                          variant="outlined"
                          size="small"
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          Add More
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>Course Curriculum</Typography>
                  <Button startIcon={<AddIcon />} variant="contained" color="primary" onClick={addSection} size="small">
                    Add Section
                  </Button>
                </Box>

                {sections.map((section, si) => (
                  <Card key={section.id} sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>{si + 1}</Typography>
                        </Box>
                        <TextField
                          size="small"
                          placeholder="Section Title"
                          value={section.title}
                          onChange={e => setSections(s => s.map(sec => sec.id === section.id ? { ...sec, title: e.target.value } : sec))}
                          sx={{ flex: 1 }}
                        />
                        <IconButton size="small" color="error" onClick={() => removeSection(section.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {section.lessons.map((lesson, li) => (
                        <Box key={lesson.id}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, pl: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ width: 20 }}>{li + 1}.</Typography>
                            <TextField
                              size="small"
                              placeholder="Lesson title"
                              value={lesson.title}
                              onChange={e => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                              sx={{ flex: 1, minWidth: 150 }}
                            />
                            <TextField
                              size="small"
                              placeholder="Duration"
                              value={lesson.duration}
                              onChange={e => updateLesson(section.id, lesson.id, 'duration', e.target.value)}
                              sx={{ width: 80 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {lesson.videoUrl ? (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => {
                                    setEditingLesson({ sectionId: section.id, lessonId: lesson.id });
                                    setEditDialogOpen(true);
                                  }}
                                  sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                                >
                                  Edit
                                </Button>
                              ) : uploadProgress[lesson.id] > 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                  <CircularProgress size={16} variant="determinate" value={uploadProgress[lesson.id]} />
                                  <Typography variant="caption">{uploadProgress[lesson.id]}%</Typography>
                                </Box>
                              ) : (
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  startIcon={<CloudUploadIcon />}
                                  onClick={() => handleUploadClick(section.id, lesson.id)}
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  Upload
                                </Button>
                              )}
                            </Box>

                            <IconButton size="small" color="error" onClick={() => removeLesson(section.id, lesson.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          {uploadProgress[lesson.id] > 0 && uploadProgress[lesson.id] < 100 && (
                            <LinearProgress 
                              variant="determinate" 
                              value={uploadProgress[lesson.id]} 
                              sx={{ ml: 4, mb: 2, height: 4, borderRadius: 2 }} 
                            />
                          )}
                        </Box>
                      ))}

                      <Button
                        startIcon={<AddIcon />}
                        size="small"
                        onClick={() => addLesson(section.id)}
                        sx={{ ml: 4, mt: 1, color: 'primary.main' }}
                      >
                        Add Lecture
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} mb={3}>Review & Submit</Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[
                      { label: 'Course Title', value: form.title || 'Not set' },
                      { label: 'Subject', value: form.subject },
                      { label: 'Level', value: form.level },
                      { label: 'Price', value: form.price ? `₹${form.price}` : 'Free' },
                      { label: 'Language', value: form.language },
                      { label: 'Certificate', value: form.hasCertificate ? 'Yes' : 'No' },
                      { label: 'Validity', value: `${form.validityMonths} Months` },
                      { label: 'Total Sections', value: sections.length.toString() },
                      { label: 'Total Lessons', value: sections.reduce((sum, s) => sum + s.lessons.length, 0).toString() },
                    ].map(item => (
                      <Box key={item.label} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 3, p: 2.5, bgcolor: '#FEF3C7', borderRadius: 2, border: '1px solid #FDE68A' }}>
                    <Typography variant="subtitle2" fontWeight={700} color="warning.dark" mb={1}>
                      ⚠️ Before Submitting
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your course will be submitted for review. Our editorial team will verify the content quality
                      and Ayurvedic accuracy before publishing. This typically takes 2-3 business days.
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Chip label="Status after submission: Pending Review" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => activeStep === 0 ? navigate('/creator') : setActiveStep(s => s - 1)}
            sx={{ borderRadius: 2 }}
            disabled={Object.values(uploadProgress).some(p => p > 0 && p < 100)}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="contained"
            color={activeStep === steps.length - 1 ? 'success' : 'primary'}
            disabled={Object.values(uploadProgress).some(p => p > 0 && p < 100)}
            onClick={() => activeStep === steps.length - 1 ? handleSubmit() : setActiveStep(s => s + 1)}
            sx={{ borderRadius: 2, px: 4, bgcolor: activeStep === steps.length - 1 ? '#16A34A' : undefined }}
          >
            {Object.values(uploadProgress).some(p => p > 0 && p < 100) 
              ? <CircularProgress size={24} color="inherit" />
              : activeStep === steps.length - 1 ? '🚀 Submit for Review' : 'Next →'
            }
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
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
                  if (editingLesson) handleUploadClick(editingLesson.sectionId, editingLesson.lessonId);
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
                  if (editingLesson) updateLesson(editingLesson.sectionId, editingLesson.lessonId, 'videoUrl', '');
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
