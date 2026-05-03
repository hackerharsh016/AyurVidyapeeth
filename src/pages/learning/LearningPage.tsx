import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/supabase';
import { generateCertificate } from '../../utils/certificateGenerator';
import PageLayout from '../../components/PageLayout';
import { useCourseStore } from '../../stores/courseStore';
import { useProgressStore } from '../../stores/progressStore';
import { useAuthStore } from '../../stores/authStore';

export default function LearningPage() {
  const navigate = useNavigate();
  const { enrolledCourses, courses, wishlist } = useCourseStore();
  const { getCourseProgress, fetchProgress } = useProgressStore();
  const { isAuthenticated, user } = useAuthStore();
  const [tab, setTab] = useState(0);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const enrolledCourseData = enrolledCourses
    .map(e => ({ ...e, course: courses.find(c => c.id === e.courseId) }))
    .filter(e => e.course);

  const wishlistCourses = courses.filter(c => wishlist.includes(c.id));

  const handleDownloadCertificate = async (course: any) => {
    if (!user) return;
    
    setDownloadingCert(course.id);
    try {
      // 1. Get Template URL
      const { data: certSettings } = await supabase
        .from('certificate_settings')
        .select('template_url')
        .single();
        
      if (!certSettings?.template_url) {
        alert("Certificate template not configured by admin yet.");
        return;
      }

      // 2. Generate PDF
      const pdfBytes = await generateCertificate(certSettings.template_url, {
        studentName: user.name || "Student",
        courseName: course.title,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        certificateId: `CERT-${course.id.substring(0, 8)}-${user.id.substring(0, 4)}`.toUpperCase(),
        creatorName: course.instructor || "Srotaayurveda Expert"
      });

      // 3. Trigger Download
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Certificate_${course.title.replace(/\s+/g, '_')}.pdf`;
      link.click();
    } catch (error) {
      console.error(error);
      alert("Failed to generate certificate.");
    } finally {
      setDownloadingCert(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🎓</Typography>
          <Typography variant="h5" fontWeight={700} mb={1}>Sign in to access your learning</Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Enroll in courses and track your progress here.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/courses')} size="large">
            Browse Courses
          </Button>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>My Learning</Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#D4A017', fontWeight: 700 }}>{enrolledCourseData.length}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Enrolled</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#D4A017', fontWeight: 700 }}>
                  {enrolledCourseData.filter(e => e.course && getCourseProgress(e.courseId, e.course.totalLessons) === 100).length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Completed</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#D4A017', fontWeight: 700 }}>{wishlistCourses.length}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Wishlisted</Typography>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label={`My Courses (${enrolledCourseData.length})`} />
          <Tab label={`Wishlist (${wishlistCourses.length})`} />
        </Tabs>

        {tab === 0 && (
          <Box>
            {enrolledCourseData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>📚</Typography>
                <Typography variant="h6" color="text.secondary">No courses enrolled yet</Typography>
                <Button variant="contained" color="primary" onClick={() => navigate('/courses')} sx={{ mt: 3 }}>
                  Browse Courses
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {enrolledCourseData.map(({ course, courseId, enrolledAt }, i) => {
                  if (!course) return null;
                  const progress = getCourseProgress(courseId, course.totalLessons);
                  return (
                    <Grid key={courseId} size={{ xs: 12, sm: 6, md: 4 }}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } }}>
                          {/* Thumbnail */}
                          <Box
                            sx={{
                              height: 140,
                              background: `linear-gradient(135deg, #0E5B44, ${progress === 100 ? '#16A34A' : '#D4A017'})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2.5rem',
                              position: 'relative',
                            }}
                          >
                             <img src="/srotoayurveda_logo.jpeg" alt="Logo" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                            {progress === 100 && (
                              <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: '#16A34A', borderRadius: 2, px: 1, py: 0.25 }}>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 700 }}>✓ Complete</Typography>
                              </Box>
                            )}
                            {course.certificate && (
                              <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
                                <Chip 
                                  label="Certificate of Completion" 
                                  size="small" 
                                  sx={{ bgcolor: 'rgba(212,160,23,0.9)', color: 'white', fontWeight: 600, fontSize: '0.6rem', height: 18 }} 
                                />
                              </Box>
                            )}
                          </Box>

                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
                              {course.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 20, height: 20, fontSize: '0.6rem' }}>
                                {course.instructorAvatar}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">{course.instructor}</Typography>
                            </Box>

                            {/* Progress */}
                            <Box sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Progress</Typography>
                                <Typography variant="caption" fontWeight={700} color="primary.main">{progress}%</Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                              <Chip label={course.level} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                • Enrolled {new Date(enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </Typography>
                            </Box>

                            <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              size="small"
                              onClick={() => navigate(`/learning/${courseId}`)}
                            >
                              {progress === 0 ? '▶ Start Learning' : progress === 100 ? '🔁 Review' : '▶ Continue'}
                            </Button>

                            {progress === 100 && course.certificate && (
                              <Button
                                variant="outlined"
                                color="secondary"
                                fullWidth
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={(e) => { e.stopPropagation(); handleDownloadCertificate(course); }}
                                disabled={downloadingCert === course.id}
                              >
                                {downloadingCert === course.id ? 'Generating...' : '🎓 Download Certificate'}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {wishlistCourses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>❤️</Typography>
                <Typography variant="h6" color="text.secondary">Your wishlist is empty</Typography>
                <Button variant="contained" color="primary" onClick={() => navigate('/courses')} sx={{ mt: 3 }}>
                  Discover Courses
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {wishlistCourses.map((course, i) => (
                  <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <Card sx={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${course.id}`)}>
                        <Box sx={{ height: 120, background: 'linear-gradient(135deg, #0E5B44, #1A8060)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                           <img src="/srotoayurveda_logo.jpeg" alt="Logo" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                        </Box>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle2" fontWeight={700}>{course.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{course.instructor}</Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                              {course.free ? 'Free' : `₹${course.price.toLocaleString()}`}
                            </Typography>
                            <Button size="small" variant="contained" color="primary" onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}>
                              Enroll
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>
    </PageLayout>
  );
}
