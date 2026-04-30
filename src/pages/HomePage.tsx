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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setTopicsLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('homepage_topics')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (data && data.length > 0) {
        setTopics(data);
      } else {
        // Fallback to template data if DB is empty
        setTopics([
          {
            id: '1', label: 'Pranavaha Srotas', slug: 'pranavaha-srotas', icon: '💨', description: 'Respiratory channels',
            sort_order: null,
            created_at: null
          },
          {
            id: '2', label: 'Rasavaha Srotas', slug: 'rasavaha-srotas', icon: '💧', description: 'Nutritive channels',
            sort_order: null,
            created_at: null
          },
          {
            id: '3', label: 'Vata Dosha', slug: 'vata-dosha', icon: '🌬️', description: 'Kinetic force',
            sort_order: null,
            created_at: null
          },
          {
            id: '4', label: 'Pitta Dosha', slug: 'pitta-dosha', icon: '🔥', description: 'Metabolic force',
            sort_order: null,
            created_at: null
          },
          {
            id: '5', label: 'Kapha Dosha', slug: 'kapha-dosha', icon: '🌊', description: 'Structural force',
            sort_order: null,
            created_at: null
          },
          {
            id: '6', label: 'Ashwagandha', slug: 'ashwagandha', icon: '🌿', description: 'King of herbs',
            sort_order: null,
            created_at: null
          },
        ]);
      }
      setTopicsLoading(false);
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

      {/* Popular Topics */}
      <Box sx={{ bgcolor: '#F5E8C7', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <FadeInSection>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                Explore Topics
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                Popular Ayurveda Topics
              </Typography>
            </Box>
          </FadeInSection>
          <Grid container spacing={2}>
            {topics.map((topic, i) => (
              <Grid key={topic.slug} size={{ xs: 6, sm: 4, md: 2 }}>
                <FadeInSection delay={i * 0.08}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      onClick={() => navigate(`/topic/${topic.slug}`)}
                      sx={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        p: 2,
                        height: '100%',
                        border: '2px solid transparent',
                        '&:hover': {
                          border: '2px solid',
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(14,91,68,0.04)',
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: '2rem', mb: 1 }}>{topic.icon}</Typography>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3, fontSize: '0.8rem' }}>
                        {topic.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {topic.description}
                      </Typography>
                    </Card>
                  </motion.div>
                </FadeInSection>
              </Grid>
            ))}
          </Grid>
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
