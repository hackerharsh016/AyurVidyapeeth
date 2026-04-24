import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QuizIcon from '@mui/icons-material/Quiz';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import type { Course } from '../../data/courses';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCourseById, enroll, isEnrolled, toggleWishlist, isWishlisted } = useCourseStore();
  const { isAuthenticated } = useAuthStore();

  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'info' });
  const [enrolling, setEnrolling] = useState(false);

  const course = getCourseById(id || '');
  const enrolled = isEnrolled(id || '');
  const wishlisted = isWishlisted(id || '');

  if (!course) {
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Typography variant="h5">Course not found</Typography>
          <Button onClick={() => navigate('/courses')} sx={{ mt: 3 }}>Back to Courses</Button>
        </Container>
      </PageLayout>
    );
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setToast({ open: true, message: 'Please log in to enroll in courses', severity: 'info' });
      return;
    }
    setEnrolling(true);
    await new Promise(r => setTimeout(r, 800));
    enroll(course.id);
    setEnrolling(false);
    setToast({ open: true, message: `🎉 Enrolled in "${course.title}" successfully!`, severity: 'success' });
    setTimeout(() => navigate(`/learning/${course.id}`), 1200);
  };

  const totalLessons = course.curriculum.reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <PageLayout>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #093D2E 0%, #0E5B44 100%)', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/courses')}
              sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              All Courses
            </Button>

            <Grid container spacing={4} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 8 }}>
                <Chip label={course.category} sx={{ bgcolor: '#D4A017', color: 'white', mb: 2, fontWeight: 600 }} />
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
                  {course.title}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, fontWeight: 400, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                  {course.subtitle}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={course.rating} readOnly precision={0.1} size="small" sx={{ color: '#D4A017' }} />
                    <Typography variant="body2" sx={{ color: '#D4A017', fontWeight: 700 }}>{course.rating}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>({course.students.toLocaleString()} students)</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {[
                    `📹 ${totalLessons} lessons`,
                    `⏱ ${course.duration}`,
                    `📊 ${course.level}`,
                    `🌐 ${course.language}`,
                    course.certificate ? '🏆 Certificate' : null,
                  ].filter(Boolean).map((item, i) => (
                    <Chip key={i} label={item} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700 }}>
                    {course.instructorAvatar}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      {course.instructor}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {course.instructorBio}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Desktop Purchase Card */}
              <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                <PurchaseCard
                  course={course}
                  enrolled={enrolled}
                  wishlisted={wishlisted}
                  enrolling={enrolling}
                  onEnroll={handleEnroll}
                  onWishlist={() => toggleWishlist(course.id)}
                  onGoToLearning={() => navigate(`/learning/${course.id}`)}
                />
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Tabs */}
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="Overview" />
              <Tab label="Curriculum" />
              <Tab label="Reviews" />
            </Tabs>

            {/* Overview Tab */}
            {tab === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={700} mb={2}>About This Course</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {course.description}
                  </Typography>
                </Box>

                <Box sx={{ p: 3, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #BBF7D0', mb: 4 }}>
                  <Typography variant="h6" fontWeight={700} mb={2} color="primary.main">
                    ✅ What You'll Learn
                  </Typography>
                  <Grid container spacing={1}>
                    {course.whatYouLearn.map((item, i) => (
                      <Grid key={i} size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{item}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={700} mb={2}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {course.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'rgba(14,91,68,0.06)', color: 'primary.main' }} />
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* Curriculum Tab */}
            {tab === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Course Curriculum
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalLessons} lessons • {course.duration}
                  </Typography>
                </Box>
                {course.curriculum.map(section => (
                  <Accordion key={section.id} sx={{ mb: 1, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'rgba(14,91,68,0.03)', borderRadius: '12px' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{section.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.lessons.length} lessons
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <List dense sx={{ p: 0 }}>
                        {section.lessons.map((lesson, i) => (
                          <ListItem
                            key={lesson.id}
                            sx={{
                              px: 1,
                              py: 0.75,
                              borderRadius: 1.5,
                              '&:hover': { bgcolor: 'rgba(14,91,68,0.04)' },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {lesson.type === 'video' ? (
                                <PlayCircleOutlineIcon sx={{ fontSize: 20, color: lesson.preview ? 'primary.main' : 'text.disabled' }} />
                              ) : lesson.type === 'pdf' ? (
                                <PictureAsPdfIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                              ) : (
                                <QuizIcon sx={{ fontSize: 20, color: '#D4A017' }} />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                    {i + 1}. {lesson.title}
                                  </Typography>
                                  {lesson.preview && (
                                    <Chip label="Preview" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#D1FAE5', color: '#065F46' }} />
                                  )}
                                </Box>
                              }
                              secondary={lesson.duration}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </motion.div>
            )}

            {/* Reviews Tab */}
            {tab === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Box sx={{ display: 'flex', gap: 4, mb: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" fontWeight={700} color="primary.main">{course.rating}</Typography>
                    <Rating value={course.rating} readOnly precision={0.1} sx={{ color: '#D4A017' }} />
                    <Typography variant="caption" color="text.secondary">Course Rating</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Based on <strong>{course.reviews.length}</strong> student reviews
                    </Typography>
                  </Box>
                </Box>

                {course.reviews.map(review => (
                  <Box key={review.id} sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { border: 'none' } }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
                        {review.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>{review.user}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={review.rating} readOnly size="small" sx={{ color: '#D4A017' }} />
                          <Typography variant="caption" color="text.secondary">{review.date}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {review.comment}
                    </Typography>
                  </Box>
                ))}
              </motion.div>
            )}
          </Grid>

          {/* Mobile Purchase Card */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'block', md: 'none' } }}>
            <PurchaseCard
              course={course}
              enrolled={enrolled}
              wishlisted={wishlisted}
              enrolling={enrolling}
              onEnroll={handleEnroll}
              onWishlist={() => toggleWishlist(course.id)}
              onGoToLearning={() => navigate(`/learning/${course.id}`)}
            />
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: 2, fontWeight: 500 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
}

function PurchaseCard({ course, enrolled, wishlisted, enrolling, onEnroll, onWishlist, onGoToLearning }: {
  course: Course | undefined;
  enrolled: boolean;
  wishlisted: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  onWishlist: () => void;
  onGoToLearning: () => void;
}) {
  if (!course) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        position: { md: 'sticky' },
        top: { md: 80 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          height: 160,
          background: 'linear-gradient(135deg, #0E5B44 0%, #D4A017 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
        }}
      >
        🌿
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
          {course.free ? (
            <Typography variant="h4" fontWeight={700} sx={{ color: '#16A34A' }}>Free</Typography>
          ) : (
            <>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                ₹{course.price.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                ₹{course.originalPrice.toLocaleString()}
              </Typography>
              <Chip
                label={`${Math.round((1 - course.price / course.originalPrice) * 100)}% off`}
                size="small"
                sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
              />
            </>
          )}
        </Box>

        {enrolled ? (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={onGoToLearning}
            sx={{ mb: 1.5, py: 1.5 }}
          >
            ▶ Continue Learning
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={onEnroll}
            disabled={enrolling}
            sx={{ mb: 1.5, py: 1.5, bgcolor: course.free ? '#16A34A' : 'primary.main', '&:hover': { bgcolor: course.free ? '#15803D' : 'primary.dark' } }}
          >
            {enrolling ? 'Enrolling...' : course.free ? '🎓 Enroll Free' : '🎓 Enroll Now'}
          </Button>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={wishlisted ? <FavoriteIcon sx={{ color: '#DC2626' }} /> : <FavoriteBorderIcon />}
            onClick={onWishlist}
            sx={{ borderRadius: 2 }}
          >
            {wishlisted ? 'Wishlisted' : 'Wishlist'}
          </Button>
          <IconButton sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ fontSize: '1rem' }}>📤</Box>
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>This course includes:</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[
            `📹 ${course.totalLessons} video lessons`,
            `📄 ${course.totalPdfs} downloadable PDFs`,
            `⏱ ${course.duration} total content`,
            '📱 Access on mobile & desktop',
            '⏳ Lifetime access',
            course.certificate ? '🏆 Certificate of completion' : null,
          ].filter(Boolean).map((item, i) => (
            <Typography key={i} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
