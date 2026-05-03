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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import SearchIcon from '@mui/icons-material/Search';
import TimerIcon from '@mui/icons-material/Timer';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../supabase/supabase';
import { useAuthStore } from '../../stores/authStore';
import { SUBJECTS } from '../../constants/subjects';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface Test {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  eligibility: string | null;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  created_at: string;
  _question_count?: number;
}

export default function TestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tests')
        .select('*, test_questions(count)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (data) {
        setTests(data.map((t: any) => ({ ...t, _question_count: t.test_questions?.[0]?.count ?? 0 })));
      }
      setLoading(false);
    };
    fetchTests();
  }, []);

  const filtered = tests.filter(t => {
    const matchesSearch = !search || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subject === 'All' || t.subject === subject;
    return matchesSearch && matchesSubject;
  });

  return (
    <PageLayout>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #0a1628 0%, #0E5B44 100%)', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Chip label="Practice Tests" sx={{ bgcolor: 'rgba(110,231,183,0.15)', color: '#6EE7B7', fontWeight: 700, mb: 2, border: '1px solid rgba(110,231,183,0.3)' }} />
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                MCQ Practice Tests
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400, maxWidth: 560, mx: 'auto' }}>
                Test your Ayurveda knowledge with curated MCQ tests. Get an instant scorecard.
              </Typography>
            </Box>
            <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <TextField 
                placeholder="Search tests by title or subject..."
                value={search} onChange={e => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 300 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} /></InputAdornment>,
                  sx: { bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 3, color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' }, '& input': { color: 'white' }, '& input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 } },
                }} />
              
              <FormControl sx={{ minWidth: 180 }}>
                <Select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.08)', 
                    borderRadius: 3, 
                    color: 'white',
                    height: '56px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                    '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' }
                  }}
                >
                  <MenuItem value="All">All Subjects</MenuItem>
                  {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Stats Row */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '📝', label: `${tests.length} Tests Available` },
              { icon: '⏱️', label: 'Timed Environment' },
              { icon: '🏆', label: 'Instant Scorecard' },
              { icon: '✅', label: 'Detailed Explanations' },
            ].map(s => (
              <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{s.icon}</Typography>
                <Typography variant="body2" fontWeight={600} color="text.secondary">{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 14, textAlign: 'center', opacity: 0.5 }}>
            <QuizIcon sx={{ fontSize: 64, mb: 2, color: 'text.disabled' }} />
            <Typography variant="h5" fontWeight={700}>No tests found</Typography>
            <Typography variant="body2" color="text.secondary">Try a different search or check back later.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filtered.map((test, i) => (
              <Grid key={test.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }} style={{ height: '100%' }}
                >
                  <Card elevation={0} sx={{
                    height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    '&:hover': { borderColor: 'primary.main', boxShadow: '0 8px 32px rgba(14,91,68,0.12)', transform: 'translateY(-4px)' },
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                  }}>
                    {/* Top accent */}
                    <Box sx={{ height: 4, background: 'linear-gradient(90deg, #0E5B44, #10B981)' }} />
                    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {test.subject && (
                        <Chip label={test.subject} size="small" sx={{ alignSelf: 'flex-start', mb: 2, bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.7rem' }} />
                      )}
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 1, lineHeight: 1.3, fontSize: '1rem' }}>
                        {test.title}
                      </Typography>
                      {test.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {test.description}
                        </Typography>
                      )}
                      {test.eligibility && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <SchoolIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled">{test.eligibility}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <QuizIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test._question_count} Qs</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimerIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test.duration_minutes} min</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmojiEventsIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test.total_marks} marks</Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained" fullWidth sx={{ mt: 2, borderRadius: 2.5, fontWeight: 700 }}
                        onClick={() => {
                          if (!isAuthenticated) { alert('Please log in to take a test.'); return; }
                          navigate(`/tests/${test.id}`);
                        }}
                      >
                        Start Test →
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </PageLayout>
  );
}
