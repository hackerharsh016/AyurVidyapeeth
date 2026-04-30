import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import CourseCard from '../components/CourseCard';
import { supabase } from '../supabase/supabase';
import { useCourseStore } from '../stores/courseStore';

const sectionColors: Record<string, string> = {
  Srotas: '#0E5B44',
  Dosha: '#D4A017',
  Dhatu: '#7C3AED',
  Herbs: '#16A34A',
  Disease: '#DC2626',
};

interface DirectoryEntry {
  id: string;
  type: string;
  title: string;
  slug: string;
  sanskrit_name: string;
  english_name: string;
  meaning: string;
  summary: string;
  definition: string;
  introduction: string;
  etiology: string;
  synonyms: string[];
  origin: string;
  panchabhautikatva: string;
  swaroop: string;
  characteristics: string[];
  types_description: string;
  sankhya: string;
  prakar_charak: string;
  prakar_sushruta: string;
  moolasthana: string;
  viddha_lakshan: string;
  dushti: string;
  functions: string[];
  disorders: string[];
  treatment_principles: string[];
  related_course_ids: string[];
}

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { courses, fetchCourses } = useCourseStore();
  const [entry, setEntry] = useState<DirectoryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('directory_entries')
          .select('*')
          .eq('slug', slug as string)
          .single();
        
        if (error) throw error;
        setEntry(data as unknown as DirectoryEntry);
      } catch (err) {
        console.error('Error fetching topic details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchEntry();
    if (courses.length === 0) fetchCourses();
  }, [slug]);

  if (loading) {
    return (
      <PageLayout>
        <Container sx={{ py: 20, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </PageLayout>
    );
  }

  if (!entry) {
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔍</Typography>
          <Typography variant="h5">Topic not found</Typography>
          <Button onClick={() => navigate('/')} sx={{ mt: 3 }}>Back to Home</Button>
        </Container>
      </PageLayout>
    );
  }

  const relatedCourses = courses.filter(c => entry.related_course_ids?.includes(c.id));
  const accentColor = sectionColors[entry.type] || '#0E5B44';

  const tocItems = [
    'Introduction',
    entry.etiology ? 'Etiology' : null,
    entry.definition ? 'Definition' : null,
    entry.moolasthana ? 'Moolasthana' : null,
    entry.functions?.length ? 'Functions' : null,
    entry.disorders?.length ? 'Disorders' : null,
    entry.treatment_principles?.length ? 'Treatment' : null,
    relatedCourses.length ? 'Related Courses' : null,
  ].filter(Boolean) as string[];

  return (
    <PageLayout>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, ${accentColor}EE 0%, ${accentColor} 100%)`, py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back to Home
            </Button>

            <Chip
              label={entry.type}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                mb: 2,
                backdropFilter: 'blur(10px)',
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'serif', fontSize: '1.2rem', mb: 1 }}
            >
              {entry.sanskrit_name}
            </Typography>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              {entry.english_name || entry.title}
            </Typography>
            {entry.meaning && (
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, fontStyle: 'italic', mb: 2 }}>
                "{entry.meaning}"
              </Typography>
            )}
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 700, lineHeight: 1.7 }}>
              {entry.summary}
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Grid container spacing={4}>
          {/* Sticky TOC - Desktop */}
          <Grid size={{ xs: 0, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'sticky', top: 80 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
                  Contents
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {tocItems.map(item => (
                    <ListItem
                      key={item}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(14,91,68,0.06)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <FiberManualRecordIcon sx={{ fontSize: 6, color: 'primary.light' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', fontSize: '0.82rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </Grid>

          {/* Main Content */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>

              {/* Introduction */}
              {entry.introduction && (
                <Section title="Introduction" icon="📜">
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {entry.introduction}
                  </Typography>
                </Section>
              )}

              {/* Etiology */}
              {entry.etiology && (
                <Section title="Etiology (Nidana)" icon="🔬">
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {entry.etiology}
                  </Typography>
                </Section>
              )}

              {/* Synonyms */}
              {entry.synonyms?.length > 0 && (
                <Section title="Synonyms (Paryaya)" icon="🏷️">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {entry.synonyms.map((s, i) => (
                      <Chip key={i} label={s} variant="outlined" sx={{ color: 'primary.main', fontWeight: 500 }} />
                    ))}
                  </Box>
                </Section>
              )}

              {/* Origin */}
              {entry.origin && (
                <Section title="Origin (Utpatti)" icon="🌱">
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {entry.origin}
                  </Typography>
                </Section>
              )}

              {/* Definition */}
              <Section title="Definition" icon="📖">
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {entry.definition}
                </Typography>
              </Section>

              {/* Panchabhautikatva */}
              {entry.panchabhautikatva && (
                <Section title="Panchabhautikatva" icon="🌫️">
                  <Box sx={{ p: 2.5, bgcolor: 'rgba(14,91,68,0.03)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body1" color="text.secondary">
                      {entry.panchabhautikatva}
                    </Typography>
                  </Box>
                </Section>
              )}

              {/* Swaroop */}
              {entry.swaroop && (
                <Section title="Swaroop (Appearance)" icon="👁️">
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {entry.swaroop}
                  </Typography>
                </Section>
              )}

              {/* Moolasthana */}
              {entry.moolasthana && (
                <Section title="Mula Sthana & Dushti" icon="🎯">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                      <Typography variant="caption" color="primary.main" fontWeight={700} display="block" gutterBottom sx={{ textTransform: 'uppercase' }}>
                        Mula Sthana (Origin)
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="primary.dark">
                        {entry.moolasthana}
                      </Typography>
                    </Box>
                    {entry.viddha_lakshan && (
                      <Box sx={{ p: 2, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid #FECACA' }}>
                        <Typography variant="caption" color="#DC2626" fontWeight={700} display="block" gutterBottom sx={{ textTransform: 'uppercase' }}>
                          Viddha Lakshan (Injury Symptoms)
                        </Typography>
                        <Typography variant="body2" color="#991B1B">
                          {entry.viddha_lakshan}
                        </Typography>
                      </Box>
                    )}
                    {entry.dushti && (
                      <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" gutterBottom sx={{ textTransform: 'uppercase' }}>
                          Dushti (Vitiation Symptoms)
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {entry.dushti}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Section>
              )}

              {/* Functions */}
              {entry.functions?.length > 0 && (
                <Section title="Functions (Karma)" icon="⚙️">
                  <List dense sx={{ p: 0 }}>
                    {entry.functions.map((fn, i) => (
                      <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={fn} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.6 }} />
                      </ListItem>
                    ))}
                  </List>
                </Section>
              )}

              {/* Disorders */}
              {entry.disorders?.length > 0 && (
                <Section title="Associated Disorders (Vikara)" icon="🩺">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {entry.disorders.map((d, i) => (
                      <Chip
                        key={i}
                        label={d}
                        sx={{ bgcolor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', border: '1px solid' }}
                      />
                    ))}
                  </Box>
                </Section>
              )}

              {/* Treatment Principles */}
              {entry.treatment_principles?.length > 0 && (
                <Section title="Treatment Principles (Chikitsa Sutra)" icon="💊">
                  <List dense sx={{ p: 0 }}>
                    {entry.treatment_principles.map((t, i) => (
                      <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E', fontSize: '0.65rem' }}>
                              {i + 1}
                            </Typography>
                          </Box>
                        </ListItemIcon>
                        <ListItemText primary={t} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.6 }} />
                      </ListItem>
                    ))}
                  </List>
                </Section>
              )}

              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <Section title="Related Courses" icon="🎓">
                  <Grid container spacing={2}>
                    {relatedCourses.map((course, i) => (
                      <Grid key={course.id} size={{ xs: 12, sm: 6 }}>
                        <CourseCard course={course} index={i} />
                      </Grid>
                    ))}
                  </Grid>
                </Section>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </PageLayout>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'rgba(14,91,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
