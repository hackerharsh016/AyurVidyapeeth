import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import PageLayout from '../components/PageLayout';
import CourseCard from '../components/CourseCard';
import { useCourseStore } from '../stores/courseStore';
import { supabase } from '../supabase/supabase';

interface Topic {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number | null;
  subtitle: string | null;
  year: string | null;
  pdf_url: string | null;
  created_at: string | null;
}

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { courses, testimonials } = useCourseStore();
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('homepage_topics')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (data) {
        setTopics(data);
      }
    };
    fetchTopics();
  }, []);

  const publishedCourses = useMemo(() => courses.filter(c => c.status === 'published'), [courses]);
  const featuredCourses = useMemo(() => publishedCourses.slice(0, 6), [publishedCourses]);
  
  const stats = useMemo(() => [
    { value: `${publishedCourses.length}+`, label: 'Expert Courses' },
    { value: '50,000+', label: 'Students' },
    { value: `${new Set(courses.map(c => c.creatorId)).size}+`, label: 'Expert Educators' },
    { value: '100%', label: 'BAMS Aligned' },
  ], [publishedCourses.length, courses]);

  return (
    <PageLayout>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 40%, #093D2E 100%)',
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 6, md: 10 },
          pb: { xs: 8, md: 12 },
        }}
      >
        {/* Background pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.05,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, #F5E8C7 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, #D4A017 1px, transparent 1px),
              radial-gradient(circle at 60% 20%, white 0.5px, transparent 0.5px)
            `,
            backgroundSize: '60px 60px, 80px 80px, 40px 40px',
          }}
        />
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(212,160,23,0.08)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -150, left: -80, width: 500, height: 500, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Chip
                  label="🏆 India's Premier Ayurveda EdTech Platform"
                  sx={{
                    bgcolor: 'rgba(212,160,23,0.2)',
                    color: '#F5E8C7',
                    border: '1px solid rgba(212,160,23,0.4)',
                    fontWeight: 600,
                    mb: 3,
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    color: 'white',
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3.2rem' },
                    lineHeight: 1.2,
                    mb: 2,
                    fontFamily: '"Poppins", sans-serif',
                  }}
                >
                  Learn Ayurveda{' '}
                  <Box component="span" sx={{ color: '#D4A017' }}>the Modern Way</Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontWeight: 400, lineHeight: 1.6, fontSize: { xs: '1rem', md: '1.1rem' } }}
                >
                  Master Ayurvedic science with structured courses from India's top educators.
                  From Srotas to Samhitas — your complete learning ecosystem.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/courses')}
                    sx={{
                      bgcolor: '#D4A017',
                      color: 'white',
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 3,
                      '&:hover': { bgcolor: '#A07810' },
                    }}
                  >
                    🎓 Explore Courses
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/directory')}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.5)',
                      color: 'white',
                      px: 3,
                      py: 1.5,
                      fontSize: '1rem',
                      borderRadius: 3,
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    📚 Browse Srotas
                  </Button>
                </Box>

                {/* Social proof */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex' }}>
                    {['AK', 'PS', 'RN', 'MG', 'SK'].map((av, i) => (
                      <Avatar
                        key={i}
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          border: '2px solid #0E5B44',
                          ml: i > 0 ? -1 : 0,
                          bgcolor: ['#1A8060', '#D4A017', '#22C55E', '#0891B2', '#7C3AED'][i],
                        }}
                      >
                        {av}
                      </Avatar>
                    ))}
                  </Box>
                  <Box>
                    <Rating value={4.9} readOnly precision={0.1} size="small" sx={{ color: '#D4A017' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block' }}>
                      Trusted by 50,000+ Ayurveda students
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                {/* Stats Cards */}
                <Grid container spacing={2}>
                  {stats.map((stat, i) => (
                    <Grid key={i} size={6}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <Box
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 3,
                            p: 2.5,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h4" sx={{ color: '#D4A017', fontWeight: 700, fontSize: '1.8rem' }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Study Materials / PDF Topics */}
      <Box sx={{ bgcolor: '#F5E8C7', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                Study Materials
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                Explore Ayurveda Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 500, mx: 'auto' }}>
                Access curated study notes, references, and subject-wise PDFs for your BAMS preparation.
              </Typography>
            </Box>
          </FadeInSection>

          {topics.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
              <PictureAsPdfIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h6" color="text.secondary">No study materials available yet.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {topics.slice(0, 5).map((topic, i) => (
                <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <FadeInSection delay={i * 0.08}>
                    <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }} style={{ height: '100%' }}>
                      <Card
                        onClick={() => {
                          if (topic.pdf_url) {
                            navigate(`/topic/${topic.slug}`);
                          }
                        }}
                        sx={{
                          cursor: topic.pdf_url ? 'pointer' : 'default',
                          borderRadius: 4,
                          overflow: 'hidden',
                          height: '100%',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.3s ease',
                          opacity: topic.pdf_url ? 1 : 0.6,
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': topic.pdf_url ? {
                            borderColor: 'primary.main',
                            boxShadow: '0 12px 32px rgba(14,91,68,0.15)',
                          } : {},
                        }}
                      >
                        {/* Card Top Accent */}
                        <Box sx={{ height: 6, background: topic.pdf_url ? 'linear-gradient(90deg, #0E5B44, #D4A017)' : '#ccc' }} />
                        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 'auto' }}>
                            <Box sx={{
                              width: 52, height: 52, borderRadius: 3,
                              bgcolor: topic.pdf_url ? 'rgba(220,38,38,0.08)' : 'grey.100',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <PictureAsPdfIcon sx={{ fontSize: 28, color: topic.pdf_url ? '#DC2626' : 'text.disabled' }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.3 }}>
                                {topic.label}
                              </Typography>
                              {topic.subtitle && (
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {topic.subtitle}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 3, alignItems: 'center' }}>
                            {topic.year && (
                              <Chip
                                icon={<CalendarTodayIcon sx={{ fontSize: '0.75rem !important' }} />}
                                label={topic.year}
                                size="small"
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.7rem', borderColor: 'rgba(14,91,68,0.3)', color: 'primary.main' }}
                              />
                            )}
                            <Chip
                              label={topic.pdf_url ? 'View PDF' : 'Coming Soon'}
                              size="small"
                              sx={{
                                height: 24, fontSize: '0.7rem', fontWeight: 600,
                                bgcolor: topic.pdf_url ? 'rgba(14,91,68,0.1)' : 'rgba(0,0,0,0.06)',
                                color: topic.pdf_url ? 'primary.main' : 'text.disabled',
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </FadeInSection>
                </Grid>
              ))}

              {topics.length > 5 && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FadeInSection delay={5 * 0.08}>
                    <motion.div whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }} style={{ height: '100%' }}>
                      <Card
                        onClick={() => navigate('/resources')}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 4,
                          overflow: 'hidden',
                          height: '100%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 24px rgba(14,91,68,0.2)',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          }
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', p: 4 }}>
                          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Explore More</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.85 }}>View all {topics.length} study materials and PDFs</Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </FadeInSection>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Featured Courses */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                  Top Rated
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  Featured Courses
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/courses')}
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                View All Courses →
              </Button>
            </Box>
          </FadeInSection>

          <Grid container spacing={3}>
            {featuredCourses.map((course, i) => (
              <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <CourseCard course={course} index={i} />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4, display: { xs: 'block', sm: 'none' } }}>
            <Button variant="outlined" color="primary" onClick={() => navigate('/courses')}>
              View All Courses →
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Testimonials / Reviews Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#F5E8C7' }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                Student Stories
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                What Our Students Say
              </Typography>
            </Box>
          </FadeInSection>

          {testimonials.length > 0 ? (
            <Grid container spacing={3}>
              {testimonials.map((t, i) => (
                <Grid key={t.id} size={{ xs: 12, sm: 6, md: 3 }}>
                  <FadeInSection delay={i * 0.1}>
                    <Card sx={{ height: '100%', p: 0.5 }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Rating value={t.rating} readOnly size="small" sx={{ color: '#D4A017' }} />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: 'italic', lineHeight: 1.6, flexGrow: 1 }}
                        >
                          "{t.quote}"
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            src={t.avatar?.startsWith('http') ? t.avatar : undefined}
                            sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {!t.avatar?.startsWith('http') ? t.avatar : undefined}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                              {t.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.year} • {t.college.split(',')[0]}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </FadeInSection>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>✍️</Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={500}>
                No reviews found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Be the first to review one of our courses!
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Become Educator CTA */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0E5B44, #1A8060)',
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="md">
          <FadeInSection>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>🎓</Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                Share Your Ayurvedic Knowledge
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
                Join 200+ educators teaching Ayurveda to students across India.
                Create courses, reach thousands, and earn from your expertise.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/creator')}
                  sx={{
                    bgcolor: '#D4A017',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#A07810' },
                  }}
                >
                  Start Teaching Today
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Learn More
                </Button>
              </Box>
            </Box>
          </FadeInSection>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#093D2E', py: 4, px: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: '#1A8060', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  🌿
                </Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>AyurVidyapeeth</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                India's premier platform for Ayurveda education. Bringing classical wisdom to modern learners.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Learn</Typography>
              {['Courses', 'Directory', 'Srotas', 'Dosha', 'Herbs'].map(item => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, cursor: 'pointer', '&:hover': { color: '#D4A017' } }}>
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Platform</Typography>
              {['About', 'Blog', 'Careers', 'Contact', 'Privacy'].map(item => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 0.5, cursor: 'pointer', '&:hover': { color: '#D4A017' } }}>
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>Stay Updated</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                Get the latest Ayurveda insights and course updates.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', px: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>Enter email</Typography>
                </Box>
                <Button variant="contained" size="small" sx={{ bgcolor: '#D4A017', '&:hover': { bgcolor: '#A07810' }, borderRadius: 2, px: 2 }}>
                  Subscribe
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', mt: 4, pt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © 2024 AyurVidyapeeth. All rights reserved. Made with 🌿 for Ayurveda learners.
            </Typography>
          </Box>
        </Container>
      </Box>
    </PageLayout>
  );
}
