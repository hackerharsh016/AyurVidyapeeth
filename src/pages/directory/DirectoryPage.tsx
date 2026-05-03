import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../supabase/supabase';

interface DirectoryEntry {
  id: string;
  type: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  reading_time: number;
  author: string;
  created_at: string;
}

// Extract headings from HTML content for Table of Contents
function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = Array.from(doc.querySelectorAll('h2, h3'));
  return headings.map((el, i) => ({
    id: `heading-${i}`,
    text: el.textContent || '',
    level: parseInt(el.tagName.slice(1)),
  }));
}

// Inject IDs into headings for scroll-to navigation
function processContent(html: string): string {
  let counter = 0;
  return html.replace(/<(h[23])[^>]*>/gi, (_match, tag) => {
    return `<${tag} id="heading-${counter++}">`;
  });
}

export default function DirectoryPage() {
  const [entry, setEntry] = useState<DirectoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      // Fetch the entry that has actual content (most complete one first)
      const { data, error } = await supabase
        .from('directory_entries')
        .select('*')
        .not('content', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (!error && data && data.length > 0) {
        setEntry(data[0] as unknown as DirectoryEntry);
      } else {
        // Fallback: try to get any entry
        const { data: fallbackData } = await supabase
          .from('directory_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fallbackData && fallbackData.length > 0) {
          setEntry(fallbackData[0] as unknown as DirectoryEntry);
        }
        if (error) console.error("Error fetching directory entry:", error);
      }
      setLoading(false);
    };
    fetchEntry();
  }, []);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      setScrollProgress(Math.min(100, (scrolled / totalHeight) * 100));

      // Active heading tracking
      const headings = el.querySelectorAll('h2, h3');
      let active = '';
      headings.forEach(h => {
        if ((h as HTMLElement).getBoundingClientRect().top < 120) {
          active = h.id;
        }
      });
      setActiveHeading(active);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [entry]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        <Container maxWidth="md" sx={{ py: 20, textAlign: 'center' }}>
          <MenuBookIcon sx={{ fontSize: 64, mb: 2, color: 'text.disabled' }} />
          <Typography variant="h4" fontWeight={800} gutterBottom>Encyclopedia Not Initialized</Typography>
          <Typography variant="body1" color="text.secondary">
            The encyclopedia content has not been created yet. Please initialize it from the Admin Panel.
          </Typography>
        </Container>
      </PageLayout>
    );
  }

  const processedContent = entry.content ? processContent(entry.content) : '';
  const toc = entry.content ? extractHeadings(entry.content) : [];
  
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PageLayout>
      {/* Reading Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={scrollProgress}
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, height: 4,
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': { bgcolor: '#10B981', borderRadius: 0 },
        }}
      />

      {/* Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0a1628 0%, #0E5B44 100%)', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', right: -100, top: -100, width: 500, height: 500, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', left: -50, bottom: -150, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.02)' }} />

        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Chip
              label="Ayurveda Encyclopedia"
              size="medium"
              sx={{ bgcolor: 'rgba(110,231,183,0.15)', color: '#6EE7B7', fontWeight: 700, border: '1px solid rgba(110,231,183,0.3)', mb: 4 }}
            />

            <Typography
              variant="h1"
              sx={{ color: 'white', fontWeight: 800, mb: 3, fontSize: { xs: '2.5rem', md: '4rem' }, letterSpacing: '-1.5px', lineHeight: 1.1 }}
            >
              {entry.title}
            </Typography>

            {entry.excerpt && (
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400, maxWidth: 800, lineHeight: 1.7, mb: 5, fontSize: '1.2rem' }}>
                {entry.excerpt}
              </Typography>
            )}

            {/* Meta */}
            <Box sx={{ alignItems: 'center', gap: 4, flexWrap: 'wrap', p: 3, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PersonIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.9)' }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', lineHeight: 1 }}>Author</Typography>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>{entry.author}</Typography>
                </Box>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{entry.reading_time} min read</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>{formatDate(entry.created_at)}</Typography>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Main Content */}
      <Box sx={{ bgcolor: '#FAFAF8', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            
            {/* Sticky Table of Contents (desktop) */}
            {toc.length > 0 && (
              <Grid size={{ xs: 0, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ position: 'sticky', top: 100 }}>
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 2, display: 'block', mb: 3 }}>
                      Sections
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {toc.map(h => (
                        <Box
                          key={h.id}
                          onClick={() => scrollToHeading(h.id)}
                          sx={{
                            pl: h.level === 3 ? 2.5 : 0,
                            py: 1,
                            px: 2,
                            borderRadius: 2,
                            cursor: 'pointer',
                            borderLeft: '3px solid',
                            borderColor: activeHeading === h.id ? 'primary.main' : 'transparent',
                            bgcolor: activeHeading === h.id ? 'rgba(14,91,68,0.06)' : 'transparent',
                            color: activeHeading === h.id ? 'primary.main' : 'text.secondary',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: activeHeading === h.id ? 'rgba(14,91,68,0.08)' : 'rgba(0,0,0,0.03)',
                              color: 'primary.main',
                            }
                          }}
                        >
                          <Typography variant={h.level === 3 ? 'caption' : 'body2'} sx={{ fontWeight: activeHeading === h.id ? 700 : 500 }}>
                            {h.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Box>
              </Grid>
            )}

            {/* HTML Article Body */}
            <Grid size={{ xs: 12, md: 9 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <Paper elevation={0} sx={{ p: { xs: 3, md: 8 }, borderRadius: { xs: 4, md: 6 }, border: '1px solid', borderColor: 'divider', bgcolor: 'white', boxShadow: '0 12px 40px rgba(0,0,0,0.03)' }}>
                  {!processedContent ? (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                      <MenuBookIcon sx={{ fontSize: 56, mb: 2, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>No content yet</Typography>
                      <Typography variant="body2" color="text.disabled">
                        Go to Admin Panel → Encyclopedia → Edit Content to add the article body.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      ref={contentRef}
                      className="article-content"
                      dangerouslySetInnerHTML={{ __html: processedContent }}
                    sx={{
                      color: '#1f2937',
                      fontSize: { xs: '1.05rem', md: '1.15rem' },
                      lineHeight: 1.85,
                      '& h2': {
                        fontSize: { xs: '1.8rem', md: '2.2rem' },
                        fontWeight: 800,
                        color: '#111827',
                        mb: 3,
                        mt: 0,
                        pb: 2,
                        borderBottom: '2px solid rgba(14,91,68,0.1)',
                      },
                      '& h3': {
                        fontSize: { xs: '1.4rem', md: '1.6rem' },
                        fontWeight: 700,
                        color: '#1f2937',
                        mb: 2,
                        mt: 4,
                      },
                      '& p': {
                        mb: 3,
                      },
                      '& ul, & ol': {
                        mb: 4,
                        pl: 3,
                      },
                      '& li': {
                        mb: 1.5,
                      },
                      '& strong': {
                        color: '#111827',
                        fontWeight: 700,
                      },
                      '& em': {
                        color: '#0E5B44',
                        fontStyle: 'normal',
                        bgcolor: 'rgba(14,91,68,0.1)',
                        px: 0.5,
                        borderRadius: 1,
                      },
                      '& blockquote': {
                        margin: '32px 0',
                        padding: '24px 32px',
                        borderLeft: '4px solid #0E5B44',
                        bgcolor: '#FAFAF8',
                        borderRadius: '0 16px 16px 0',
                        fontStyle: 'italic',
                        color: '#4B5563',
                        fontSize: '1.25rem',
                        lineHeight: 1.8,
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        '& p:last-child': {
                          mb: 0
                        }
                      },
                    }}
                  />
                  )}
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </PageLayout>
  );
}
