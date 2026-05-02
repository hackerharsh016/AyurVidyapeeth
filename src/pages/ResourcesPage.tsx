import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
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
}

export default function ResourcesPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('homepage_topics')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (data) {
        setTopics(data);
      }
      setLoading(false);
    };
    fetchTopics();
  }, []);

  return (
    <PageLayout>
      <Box sx={{ bgcolor: '#F5E8C7', py: { xs: 8, md: 10 }, minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                Study Materials
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>
                Ayurveda Resources
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
                Access our complete collection of curated study notes, references, and subject-wise PDFs for your BAMS preparation.
              </Typography>
            </Box>
          </motion.div>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : topics.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
              <PictureAsPdfIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" color="text.secondary">No resources available yet.</Typography>
            </Box>
          ) : (
            <Grid container spacing={4}>
              {topics.map((topic, i) => (
                <Grid key={topic.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }} 
                    whileTap={{ scale: 0.98 }}
                    style={{ height: '100%' }}
                  >
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
                      <Box sx={{ height: 6, background: topic.pdf_url ? 'linear-gradient(90deg, #0E5B44, #D4A017)' : '#ccc' }} />
                      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 'auto' }}>
                          <Box sx={{
                            width: 56, height: 56, borderRadius: 3,
                            bgcolor: topic.pdf_url ? 'rgba(220,38,38,0.08)' : 'grey.100',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <PictureAsPdfIcon sx={{ fontSize: 32, color: topic.pdf_url ? '#DC2626' : 'text.disabled' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.5 }}>
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
                              icon={<CalendarTodayIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={topic.year}
                              size="small"
                              variant="outlined"
                              sx={{ height: 26, fontSize: '0.75rem', borderColor: 'rgba(14,91,68,0.3)', color: 'primary.main', fontWeight: 600 }}
                            />
                          )}
                          <Chip
                            label={topic.pdf_url ? 'View PDF' : 'Coming Soon'}
                            size="small"
                            sx={{
                              height: 26, fontSize: '0.75rem', fontWeight: 700,
                              bgcolor: topic.pdf_url ? 'rgba(14,91,68,0.1)' : 'rgba(0,0,0,0.06)',
                              color: topic.pdf_url ? 'primary.main' : 'text.disabled',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </PageLayout>
  );
}
