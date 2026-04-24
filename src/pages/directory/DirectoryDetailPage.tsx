import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import CourseCard from '../../components/CourseCard';
import { directoryEntries } from '../../data/directory';
import { courses } from '../../data/courses';

const sectionColors: Record<string, string> = {
  Srotas: '#0E5B44',
  Dosha: '#D4A017',
  Dhatu: '#7C3AED',
  Herbs: '#16A34A',
  Disease: '#DC2626',
};

export default function DirectoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const entry = directoryEntries.find(e => e.slug === slug);

  if (!entry) {
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔍</Typography>
          <Typography variant="h5">Entry not found</Typography>
          <Button onClick={() => navigate('/directory')} sx={{ mt: 3 }}>Back to Directory</Button>
        </Container>
      </PageLayout>
    );
  }

  const relatedCourses = courses.filter(c => entry.relatedCourseIds.includes(c.id));
  const accentColor = sectionColors[entry.category] || '#0E5B44';

  const tocItems = [
    'Definition',
    entry.moolasthana ? 'Moolasthana' : null,
    'Functions',
    'Disorders',
    'Treatment Principles',
    entry.properties ? 'Properties' : null,
    entry.subtypes || entry.characteristics ? 'Classifications' : null,
    'Related Courses',
  ].filter(Boolean) as string[];

  return (
    <PageLayout>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, ${accentColor}EE 0%, ${accentColor} 100%)`, py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/directory')}
              sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back to Directory
            </Button>

            <Chip
              label={entry.category}
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
              {entry.sanskritName}
            </Typography>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              {entry.englishName}
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 400, fontStyle: 'italic', mb: 2 }}>
              "{entry.meaning}"
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 700, lineHeight: 1.7 }}>
              {entry.shortDescription}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

              {/* Definition */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Section title="Definition" icon="📖">
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    {entry.definition}
                  </Typography>
                </Section>
              </motion.div>

              {/* Moolasthana */}
              {entry.moolasthana && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Section title="Moolasthana (Origin)" icon="🎯">
                    <Box sx={{ p: 2.5, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                        {entry.moolasthana}
                      </Typography>
                    </Box>
                  </Section>
                </motion.div>
              )}

              {/* Functions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
              </motion.div>

              <Divider />

              {/* Disorders */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
              </motion.div>

              {/* Treatment Principles */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Section title="Treatment Principles (Chikitsa Sutra)" icon="💊">
                  <List dense sx={{ p: 0 }}>
                    {entry.treatmentPrinciples.map((t, i) => (
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
              </motion.div>

              {/* Properties (for Herbs) */}
              {entry.properties && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <Section title="Properties (Gunadharma)" icon="🔬">
                    <Grid container spacing={2}>
                      {Object.entries(entry.properties).map(([key, value]) => (
                        <Grid key={key} size={{ xs: 6, sm: 4 }}>
                          <Box sx={{ p: 2, bgcolor: 'rgba(14,91,68,0.04)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                              {key}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Section>
                </motion.div>
              )}

              {/* Subtypes / Characteristics */}
              {(entry.subtypes || entry.characteristics) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Section title={entry.subtypes ? 'Types (Bheda)' : 'Characteristics (Guna)'} icon="📂">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(entry.subtypes || entry.characteristics || []).map((item, i) => (
                        <Chip
                          key={i}
                          label={item}
                          sx={{ bgcolor: 'rgba(14,91,68,0.06)', color: 'primary.main', fontWeight: 500 }}
                        />
                      ))}
                    </Box>
                  </Section>
                </motion.div>
              )}

              {/* Quick Quiz */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                <Box
                  sx={{
                    p: 3,
                    bgcolor: '#F0FDF4',
                    borderRadius: 3,
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color="primary.main" mb={1}>
                    🧠 Quick Knowledge Check
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    What is the primary Moolasthana of {entry.englishName.split('(')[0].trim()}?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[entry.moolasthana || entry.functions[0], 'Pakwashaya', 'Nabhi', 'Hridaya'].slice(0, 4).map((opt, i) => (
                      <Chip
                        key={i}
                        label={opt?.split('(')[0].trim().slice(0, 30) + (opt && opt.length > 30 ? '...' : '')}
                        onClick={() => {}}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: i === 0 ? '#BBF7D0' : '#FEE2E2' },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </motion.div>

              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Section title="Related Courses" icon="🎓">
                    <Grid container spacing={2}>
                      {relatedCourses.map((course, i) => (
                        <Grid key={course.id} size={{ xs: 12, sm: 6 }}>
                          <CourseCard course={course} index={i} />
                        </Grid>
                      ))}
                    </Grid>
                  </Section>
                </motion.div>
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
