import { useState } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import type { Course, Section, Lesson } from '../../data/courses';

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
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    subject: 'Dravyaguna',
    category: 'Pharmacology',
    language: 'English',
    description: '',
    whatYouLearn: ['', '', '', ''],
  });

  const [sections, setSections] = useState<(Omit<Section, 'lessons'> & { lessons: Omit<Lesson, never>[] })[]>([
    { id: 's1', title: 'Introduction', lessons: [{ id: 'l1', title: '', duration: '10:00', type: 'video' }] },
  ]);

  const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const addSection = () => {
    const id = `s${Date.now()}`;
    setSections(s => [...s, { id, title: 'New Section', lessons: [{ id: `l${Date.now()}`, title: '', duration: '10:00', type: 'video' }] }]);
  };

  const removeSection = (id: string) => setSections(s => s.filter(sec => sec.id !== id));

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

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections(s => s.map(sec => sec.id === sectionId
      ? { ...sec, lessons: sec.lessons.filter(l => l.id !== lessonId) }
      : sec
    ));
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
      thumbnail: '/api/placeholder/400/225',
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
      certificate: true,
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

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Stepper */}
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
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select value={form.subject} onChange={e => updateField('subject', e.target.value)} label="Subject">
                          {['Dravyaguna', 'Panchakarma', 'Sharir Rachana', 'Nadi Pariksha', 'Ahara', 'Samhita', 'Kriya Sharira', 'Roga Nidana'].map(s => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Level</InputLabel>
                        <Select value={form.level} onChange={e => updateField('level', e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')} label="Level">
                          {['Beginner', 'Intermediate', 'Advanced'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
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
                        <Box key={lesson.id} sx={{ display: 'flex', gap: 1, mb: 1, pl: 4, alignItems: 'center', flexWrap: 'wrap' }}>
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
                          <FormControl size="small" sx={{ width: 90 }}>
                            <Select value={lesson.type} onChange={e => updateLesson(section.id, lesson.id, 'type', e.target.value)}>
                              <MenuItem value="video">📹 Video</MenuItem>
                              <MenuItem value="pdf">📄 PDF</MenuItem>
                              <MenuItem value="quiz">❓ Quiz</MenuItem>
                            </Select>
                          </FormControl>
                          <IconButton size="small" color="error" onClick={() => removeLesson(section.id, lesson.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            variant="contained"
            color={activeStep === steps.length - 1 ? 'success' : 'primary'}
            onClick={() => activeStep === steps.length - 1 ? handleSubmit() : setActiveStep(s => s + 1)}
            sx={{ borderRadius: 2, px: 4, bgcolor: activeStep === steps.length - 1 ? '#16A34A' : undefined }}
          >
            {activeStep === steps.length - 1 ? '🚀 Submit for Review' : 'Next →'}
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
    </PageLayout>
  );
}
