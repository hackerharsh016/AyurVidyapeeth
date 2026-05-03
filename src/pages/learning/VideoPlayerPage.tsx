import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SpeedIcon from '@mui/icons-material/Speed';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useProgressStore } from '../../stores/progressStore';
import type { Lesson } from '../../data/courses';

export default function VideoPlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getCourseById, isEnrolled } = useCourseStore();
  const { updateProgress, isCompleted, getWatchedSeconds, getCourseProgress, setCurrentLesson, getCurrentLesson, fetchProgress } = useProgressStore();

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [playing, setPlaying] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '' });
  const [speed, setSpeed] = useState(1);
  const [notes, setNotes] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);

  const course = getCourseById(courseId || '');
  const enrolled = isEnrolled(courseId || '');

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (course) {
      const savedId = getCurrentLesson(courseId || '');
      let found: Lesson | null = null;
      let sectionId = '';

      if (savedId) {
        for (const section of course.curriculum) {
          const lesson = section.lessons.find(l => l.id === savedId);
          if (lesson) { found = lesson; sectionId = section.id; break; }
        }
      }

      if (!found && course.curriculum[0]?.lessons[0]) {
        found = course.curriculum[0].lessons[0];
        sectionId = course.curriculum[0].id;
      }

      setActiveLesson(found);
      setActiveSectionId(sectionId);
    }
  }, [course, courseId, getCurrentLesson]);

  // Periodic Progress Update
  useEffect(() => {
    let interval: any;
    if (playing && activeLesson) {
      interval = setInterval(() => {
        if (videoRef.current) {
          updateProgress(courseId || '', activeLesson.id, videoRef.current.currentTime);
        }
      }, 5000); // Sync every 5 seconds
    }
    return () => clearInterval(interval);
  }, [playing, activeLesson, courseId, updateProgress]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch(e => console.error('Video play error:', e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing, activeLesson]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setFakeProgress(p || 0);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    handleMarkComplete();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!course) {
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5">Course not found</Typography>
          <Button onClick={() => navigate('/learning')}>My Learning</Button>
        </Container>
      </PageLayout>
    );
  }

  if (!enrolled) {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔒</Typography>
          <Typography variant="h5" fontWeight={700} mb={2}>Enroll to access this course</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate(`/courses/${courseId}`)}>
            Go to Course Page
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const allLessons = course.curriculum.flatMap(s => s.lessons);
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const progress = getCourseProgress(courseId || '', course.totalLessons);

  const selectLesson = (lesson: Lesson, sectionId: string) => {
    setActiveLesson(lesson);
    setActiveSectionId(sectionId);
    setPlaying(false);
    setFakeProgress(isCompleted(courseId || '', lesson.id) ? 100 : 0);
    setCurrentLesson(courseId || '', lesson.id);
  };

  const handleMarkComplete = () => {
    if (!activeLesson) return;
    const currentTime = videoRef.current?.currentTime || 0;
    updateProgress(courseId || '', activeLesson.id, currentTime, true);
    setToast({ open: true, message: `✅ "${activeLesson.title}" marked as complete!` });
    if (progress >= 90) setShowCongrats(true);
    if (nextLesson) {
      const section = course.curriculum.find(s => s.lessons.some(l => l.id === nextLesson.id));
      if (section) selectLesson(nextLesson, section.id);
    }
  };

  return (
    <PageLayout noPadding>
      <Box sx={{ bgcolor: '#0A1628', minHeight: { xs: 'auto', md: '100vh' } }}>
        {/* Top bar */}
        <Box sx={{ bgcolor: '#111827', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <IconButton onClick={() => navigate('/learning')} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle2" sx={{ color: 'white', flex: 1, fontSize: '0.85rem' }} noWrap>
            {course.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ width: 80, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#D4A017' } }}
            />
            <Typography variant="caption" sx={{ color: '#D4A017', fontWeight: 600 }}>{progress}%</Typography>
          </Box>
        </Box>

        <Grid container sx={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* Video Area */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Real Video Player */}
            <Box
              sx={{
                bgcolor: '#000',
                aspectRatio: '16/9',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {activeLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeLesson.videoUrl}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onLoadedMetadata={() => {
                    if (videoRef.current && activeLesson) {
                      const savedSeconds = getWatchedSeconds(courseId || '', activeLesson.id);
                      if (savedSeconds > 0) {
                        videoRef.current.currentTime = savedSeconds;
                      }
                    }
                  }}
                  controls
                  controlsList="nodownload"
                />
              ) : (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, zIndex: 1, background: 'linear-gradient(135deg, #0E5B44 0%, #093D2E 100%)' }}>
                  <Typography sx={{ fontSize: '3rem' }}>🌿</Typography>
                  <Typography variant="h6" sx={{ color: 'white', textAlign: 'center', fontWeight: 600, px: 3 }}>
                    {activeLesson?.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>No Video Available</Typography>
                </Box>
              )}
            </Box>


            {/* Controls Below Video */}
            <Box sx={{ bgcolor: '#111827', p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    disabled={!prevLesson}
                    onClick={() => {
                      if (prevLesson) {
                        const section = course.curriculum.find(s => s.lessons.some(l => l.id === prevLesson.id));
                        if (section) selectLesson(prevLesson, section.id);
                      }
                    }}
                    sx={{ color: 'white', '&:disabled': { color: 'rgba(255,255,255,0.2)' } }}
                  >
                    <SkipPreviousIcon />
                  </IconButton>
                  <IconButton
                    disabled={!nextLesson}
                    onClick={() => {
                      if (nextLesson) {
                        const section = course.curriculum.find(s => s.lessons.some(l => l.id === nextLesson.id));
                        if (section) selectLesson(nextLesson, section.id);
                      }
                    }}
                    sx={{ color: 'white', '&:disabled': { color: 'rgba(255,255,255,0.2)' } }}
                  >
                    <SkipNextIcon />
                  </IconButton>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleMarkComplete}
                  disabled={isCompleted(courseId || '', activeLesson?.id || '')}
                  sx={{
                    bgcolor: '#D4A017',
                    '&:hover': { bgcolor: '#A07810' },
                    '&:disabled': { bgcolor: '#16A34A', color: 'white', opacity: 0.8 },
                    borderRadius: 2,
                  }}
                >
                  {isCompleted(courseId || '', activeLesson?.id || '') ? 'Completed ✓' : 'Mark Complete'}
                </Button>
              </Box>
            </Box>

            {/* Bottom Tabs */}
            <Box sx={{ bgcolor: '#111827' }}>
              <Tabs
                value={tab}
                onChange={(_e, v) => setTab(v)}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', '&.Mui-selected': { color: 'white' } },
                  '& .MuiTabs-indicator': { bgcolor: '#D4A017' },
                }}
              >
                <Tab label="Notes" />
                <Tab label="About" />
              </Tabs>

              <Box sx={{ p: 2, minHeight: 150 }}>
                {tab === 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
                      Take notes for this lesson
                    </Typography>
                    <Box
                      component="textarea"
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      placeholder="Your notes here..."
                      style={{
                        width: '100%',
                        minHeight: 120,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '12px',
                        color: 'white',
                        fontSize: '0.85rem',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </Box>
                )}
                {tab === 1 && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                    {course.description.slice(0, 300)}...
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Lesson List Sidebar */}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              bgcolor: '#111827',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              overflow: 'auto',
              maxHeight: { md: 'calc(100vh - 120px)' },
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>
                Course Contents
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {allLessons.filter(l => isCompleted(courseId || '', l.id)).length}/{allLessons.length} lessons completed
              </Typography>
            </Box>

            {course.curriculum.map(section => (
              <Accordion
                key={section.id}
                expanded={activeSectionId === section.id}
                onChange={() => setActiveSectionId(s => s === section.id ? '' : section.id)}
                sx={{ bgcolor: 'transparent', '&:before': { display: 'none' }, boxShadow: 'none' }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }} />}
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    minHeight: '48px !important',
                    '& .MuiAccordionSummary-content': { my: '8px !important' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.82rem' }}>
                      {section.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                      {section.lessons.length} lessons
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense sx={{ p: 0 }}>
                    {section.lessons.map(lesson => {
                      const completed = isCompleted(courseId || '', lesson.id);
                      const active = lesson.id === activeLesson?.id;
                      return (
                        <ListItem key={lesson.id} disablePadding>
                          <ListItemButton
                            onClick={() => selectLesson(lesson, section.id)}
                            sx={{
                              px: 2,
                              py: 1,
                              bgcolor: active ? 'rgba(212,160,23,0.15)' : 'transparent',
                              borderLeft: active ? '3px solid #D4A017' : '3px solid transparent',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              {completed ? (
                                <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A' }} />
                              ) : active ? (
                                <PlayCircleIcon sx={{ fontSize: 16, color: '#D4A017' }} />
                              ) : (
                                <LockIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={lesson.title}
                              secondary={lesson.duration}
                              primaryTypographyProps={{
                                variant: 'caption',
                                sx: { color: active ? '#D4A017' : 'rgba(255,255,255,0.7)', fontWeight: active ? 600 : 400, fontSize: '0.78rem' },
                              }}
                              secondaryTypographyProps={{
                                sx: { color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' },
                              }}
                            />
                          </ListItemButton>
                          <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                        </ListItem>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>
      </Box>

      {showCongrats && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowCongrats(false)}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 4,
                p: 4,
                textAlign: 'center',
                maxWidth: 360,
                mx: 2,
              }}
            >
              <Typography sx={{ fontSize: '3rem', mb: 1 }}>🎉</Typography>
              <Typography variant="h5" fontWeight={700} mb={1} color="primary.main">
                Amazing Progress!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                You're almost done with this course! Keep going!
              </Typography>
              <Button variant="contained" color="primary" onClick={() => setShowCongrats(false)}>
                Continue Learning
              </Button>
            </Box>
          </motion.div>
        </Box>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={2000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>
    </PageLayout>
  );
}
