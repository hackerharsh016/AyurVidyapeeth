import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
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

export default function TopicDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopic = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('homepage_topics')
          .select('*')
          .eq('slug', slug as string)
          .single();
        
        if (error) throw error;
        setTopic(data as Topic);
      } catch (err) {
        console.error('Error fetching topic details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchTopic();
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

  if (!topic) {
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
          <PictureAsPdfIcon sx={{ fontSize: '4rem', color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700}>Study Material not found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            The PDF or study material you are looking for does not exist.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>Back to Home</Button>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <Box sx={{ background: `linear-gradient(135deg, #111827 0%, #1f2937 100%)`, py: { xs: 5, md: 6 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Back to Study Materials
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{
                width: 72, height: 72,
                borderRadius: 4,
                bgcolor: 'rgba(220,38,38,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(220,38,38,0.3)',
              }}>
                <PictureAsPdfIcon sx={{ color: '#ef4444', fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.5px' }}>
                  {topic.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {topic.subtitle && (
                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                      {topic.subtitle}
                    </Typography>
                  )}
                  {topic.year && (
                    <Chip
                      icon={<CalendarTodayIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} />}
                      label={topic.year}
                      size="small"
                      sx={{ color: '#fbbf24', bgcolor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Main Content - PDF Viewer */}
      <Box sx={{ bgcolor: '#f3f4f6', py: { xs: 4, md: 6 }, minHeight: '60vh' }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            width: '100%', 
            height: '85vh', 
            bgcolor: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.08)',
            position: 'relative'
          }}>
            {topic.pdf_url ? (
              <>
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(topic.pdf_url)}&embedded=true`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  title={topic.label}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
                {/* Invisible overlay to block right-click context menu on the iframe header (Google Docs viewer header) */}
                <Box
                  onContextMenu={(e) => e.preventDefault()}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    zIndex: 2,
                    cursor: 'default',
                  }}
                />
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                <PictureAsPdfIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">No PDF is currently attached to this material.</Typography>
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </PageLayout>
  );
}
