import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../supabase/supabase';
import { useAuthStore } from '../../stores/authStore';

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  explanation: string | null;
  sort_order: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
}

type Phase = 'loading' | 'intro' | 'exam' | 'submitted' | 'results';

export default function TestTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [score, setScore] = useState(0);
  const [showExplanations, setShowExplanations] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      const [{ data: testData }, { data: qData }] = await Promise.all([
        supabase.from('tests').select('*').eq('id', id!).single(),
        supabase.from('test_questions').select('*').eq('test_id', id!).order('sort_order'),
      ]);
      if (testData) { setTest(testData); setTimeLeft(testData.duration_minutes * 60); }
      if (qData) setQuestions(qData);
      setPhase('intro');
    };
    fetchTest();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setConfirmSubmit(false);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    // Calculate score
    let earned = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) earned += q.marks;
    });
    setScore(earned);

    // Save attempt to Supabase
    if (user && test) {
      await supabase.from('test_attempts').insert({
        test_id: test.id,
        user_id: user.id,
        answers,
        score: earned,
        total_marks: test.total_marks,
        time_taken_seconds: timeTaken,
      });
    }
    setPhase('results');
  }, [answers, questions, startTime, test, user]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, handleSubmit]);

  const startExam = () => { setPhase('exam'); setStartTime(Date.now()); };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answered = Object.keys(answers).length;
  const pct = test ? (score / test.total_marks) * 100 : 0;
  const passed = test ? score >= test.pass_marks : false;

  if (phase === 'loading') return (
    <PageLayout><Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress /></Box></PageLayout>
  );

  /* ─── INTRO ─── */
  if (phase === 'intro' && test) return (
    <PageLayout>
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 5, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(14,91,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <EmojiEventsIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} mb={1}>{test.title}</Typography>
            {test.subject && <Chip label={test.subject} size="small" sx={{ mb: 2, bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontWeight: 700 }} />}
            {test.description && <Typography variant="body1" color="text.secondary" mb={3}>{test.description}</Typography>}
            <Grid container spacing={2} sx={{ mb: 4, textAlign: 'left' }}>
              {[
                { emoji: '📝', label: 'Questions', value: `${questions.length}` },
                { emoji: '⏱️', label: 'Duration', value: `${test.duration_minutes} minutes` },
                { emoji: '🏆', label: 'Total Marks', value: `${test.total_marks}` },
                { emoji: '✅', label: 'Pass Marks', value: `${test.pass_marks}` },
              ].map(item => (
                <Grid key={item.label} size={{ xs: 6 }}>
                  <Box sx={{ p: 2, bgcolor: '#FAFAF8', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: '1.4rem' }}>{item.emoji}</Typography>
                    <Typography variant="caption" color="text.disabled" display="block">{item.label}</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{item.value}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ p: 2, bgcolor: '#FEF3C7', borderRadius: 2, mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" color="#92400E">
                ⚠️ Once you start, the timer cannot be paused. Ensure you have a stable internet connection.
              </Typography>
            </Box>
            <Button variant="contained" size="large" fullWidth onClick={startExam} sx={{ py: 1.8, fontSize: '1.1rem', fontWeight: 700, borderRadius: 3 }}>
              🚀 Start Test
            </Button>
            <Button onClick={() => navigate('/tests')} sx={{ mt: 1.5 }} color="inherit" fullWidth>← Back to Tests</Button>
          </Paper>
        </motion.div>
      </Container>
    </PageLayout>
  );

  /* ─── EXAM ─── */
  if (phase === 'exam' && test) {
    const q = questions[currentQ];
    const isLow = timeLeft < 60;
    const opts: { key: string; label: string }[] = [
      { key: 'A', label: q.option_a }, { key: 'B', label: q.option_b },
      { key: 'C', label: q.option_c }, { key: 'D', label: q.option_d },
    ];
    return (
      <PageLayout>
        {/* Fixed top bar */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>{test.title}</Typography>
          <Chip label={`${answered}/${questions.length} answered`} size="small" sx={{ bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 2, py: 0.5, borderRadius: 2, bgcolor: isLow ? '#FEE2E2' : '#F0FDF4', color: isLow ? '#DC2626' : '#065F46' }}>
            <TimerIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle1" fontWeight={800} fontFamily="monospace">{formatTime(timeLeft)}</Typography>
          </Box>
          <Button variant="outlined" color="error" size="small" onClick={() => setConfirmSubmit(true)}>Submit</Button>
        </Box>
        <LinearProgress variant="determinate" value={(answered / questions.length) * 100} sx={{ height: 3, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />

        <Container maxWidth="md" sx={{ py: 5 }}>
          <Grid container spacing={3}>
            {/* Question Card */}
            <Grid size={{ xs: 12, md: 8 }}>
              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: 'white' }}>Q{currentQ + 1}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.disabled">{q.marks} mark{q.marks > 1 ? 's' : ''}</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 3, lineHeight: 1.5 }}>{q.question}</Typography>
                    <RadioGroup value={answers[q.id] || ''} onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}>
                      {opts.map(opt => {
                        const selected = answers[q.id] === opt.key;
                        return (
                          <Box key={opt.key} sx={{
                            mb: 1.5, borderRadius: 3, border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? 'rgba(14,91,68,0.05)' : 'white',
                            transition: 'all 0.15s ease',
                            '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(14,91,68,0.03)' },
                          }}>
                            <FormControlLabel
                              value={opt.key}
                              control={<Radio sx={{ color: 'primary.main' }} />}
                              label={<Typography variant="body1" sx={{ py: 0.5 }}><strong>{opt.key}.</strong> {opt.label}</Typography>}
                              sx={{ m: 0, px: 2, py: 1, width: '100%' }}
                            />
                          </Box>
                        );
                      })}
                    </RadioGroup>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button startIcon={<ArrowBackIcon />} onClick={() => setCurrentQ(p => p - 1)} disabled={currentQ === 0} variant="outlined">Prev</Button>
                      {currentQ < questions.length - 1
                        ? <Button endIcon={<ArrowForwardIcon />} onClick={() => setCurrentQ(p => p + 1)} variant="contained">Next</Button>
                        : <Button onClick={() => setConfirmSubmit(true)} variant="contained" color="success">Finish & Submit</Button>
                      }
                    </Box>
                  </Paper>
                </motion.div>
              </AnimatePresence>
            </Grid>

            {/* Q Navigator */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 90 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 2, display: 'block', mb: 2 }}>Navigator</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {questions.map((q2, i) => {
                    const isAnswered = !!answers[q2.id];
                    const isCurrent = i === currentQ;
                    return (
                      <Box key={q2.id} onClick={() => setCurrentQ(i)} sx={{
                        width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.15s',
                        border: '2px solid',
                        borderColor: isCurrent ? 'primary.main' : isAnswered ? '#10B981' : 'divider',
                        bgcolor: isCurrent ? 'primary.main' : isAnswered ? 'rgba(16,185,129,0.12)' : '#F9FAFB',
                        color: isCurrent ? 'white' : isAnswered ? '#065F46' : 'text.secondary',
                        '&:hover': { transform: 'scale(1.1)' },
                      }}>
                        {i + 1}
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ mt: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#10B981' }} />
                    <Typography variant="caption">Answered ({answered})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
                    <Typography variant="caption">Skipped ({questions.length - answered})</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Confirm Submit Dialog */}
        <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Submit Test?</DialogTitle>
          <DialogContent>
            <Typography>You've answered <strong>{answered}</strong> of <strong>{questions.length}</strong> questions.</Typography>
            {answered < questions.length && <Typography color="error" sx={{ mt: 1 }}>⚠️ {questions.length - answered} questions are unanswered.</Typography>}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button onClick={() => setConfirmSubmit(false)} color="inherit">Keep Reviewing</Button>
            <Button onClick={() => handleSubmit()} variant="contained" color="success">Yes, Submit</Button>
          </DialogActions>
        </Dialog>
      </PageLayout>
    );
  }

  /* ─── RESULTS ─── */
  if (phase === 'results' && test) {
    const correctCount = questions.filter(q => answers[q.id] === q.correct_option).length;
    return (
      <PageLayout>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Score Card */}
            <Paper elevation={0} sx={{ p: { xs: 3, md: 6 }, borderRadius: 5, border: '2px solid', borderColor: passed ? '#10B981' : '#F87171', textAlign: 'center', mb: 4 }}>
              <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: passed ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                {passed ? <EmojiEventsIcon sx={{ fontSize: 50, color: '#10B981' }} /> : <Typography sx={{ fontSize: '3rem' }}>📚</Typography>}
              </Box>
              <Chip label={passed ? '🎉 Passed!' : 'Better Luck Next Time'} sx={{ mb: 2, fontWeight: 700, bgcolor: passed ? '#D1FAE5' : '#FEE2E2', color: passed ? '#065F46' : '#991B1B', fontSize: '0.9rem', px: 1 }} />
              <Typography variant="h2" fontWeight={900} color={passed ? 'success.main' : 'error.main'} sx={{ lineHeight: 1 }}>
                {score}<Typography component="span" variant="h4" color="text.secondary">/{test.total_marks}</Typography>
              </Typography>
              <Typography variant="h6" color="text.secondary" mt={1}>{pct.toFixed(1)}% Score</Typography>

              <Grid container spacing={2} sx={{ mt: 4, mb: 2 }}>
                {[
                  { label: 'Correct', value: correctCount, color: '#10B981', emoji: '✅' },
                  { label: 'Wrong', value: questions.filter(q => answers[q.id] && answers[q.id] !== q.correct_option).length, color: '#EF4444', emoji: '❌' },
                  { label: 'Skipped', value: questions.filter(q => !answers[q.id]).length, color: '#6B7280', emoji: '⏭️' },
                  { label: 'Pass Marks', value: test.pass_marks, color: '#3B82F6', emoji: '🎯' },
                ].map(item => (
                  <Grid key={item.label} size={{ xs: 6, sm: 3 }}>
                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#FAFAF8', border: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: '1.4rem' }}>{item.emoji}</Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={() => setShowExplanations(p => !p)} sx={{ flex: 1, py: 1.5, borderRadius: 3 }}>
                {showExplanations ? 'Hide' : 'Review'} Answers & Explanations
              </Button>
              <Button variant="contained" onClick={() => navigate('/tests')} sx={{ flex: 1, py: 1.5, borderRadius: 3 }}>
                Browse More Tests
              </Button>
            </Box>

            {/* Answer Review */}
            {showExplanations && (
              <Box>
                <Typography variant="h5" fontWeight={800} mb={3}>Answer Review</Typography>
                {questions.map((q, i) => {
                  const userAns = answers[q.id];
                  const isCorrect = userAns === q.correct_option;
                  const opts: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d };
                  return (
                    <Paper key={q.id} elevation={0} sx={{ p: 3, mb: 2.5, borderRadius: 3, border: '2px solid', borderColor: isCorrect ? '#BBF7D0' : userAns ? '#FECACA' : '#E5E7EB' }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: isCorrect ? '#D1FAE5' : userAns ? '#FEE2E2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isCorrect ? <CheckCircleIcon sx={{ fontSize: 18, color: '#10B981' }} /> : <CancelIcon sx={{ fontSize: 18, color: userAns ? '#EF4444' : '#9CA3AF' }} />}
                        </Box>
                        <Typography variant="body1" fontWeight={700}>{i + 1}. {q.question}</Typography>
                      </Box>
                      {Object.entries(opts).map(([key, label]) => {
                        const isCorrectOpt = key === q.correct_option;
                        const isUserOpt = key === userAns;
                        return (
                          <Box key={key} sx={{ px: 2, py: 1, mb: 0.5, borderRadius: 2, bgcolor: isCorrectOpt ? '#D1FAE5' : isUserOpt && !isCorrect ? '#FEE2E2' : 'transparent', display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={isCorrectOpt || isUserOpt ? 700 : 400} color={isCorrectOpt ? '#065F46' : isUserOpt ? '#991B1B' : 'text.secondary'}>
                              {key}. {label}
                              {isCorrectOpt && ' ✓'}
                              {isUserOpt && !isCorrect && ' ✗'}
                            </Typography>
                          </Box>
                        );
                      })}
                      {q.explanation && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#EFF6FF', borderRadius: 2, borderLeft: '3px solid #3B82F6' }}>
                          <Typography variant="body2" color="#1D4ED8"><strong>💡 Explanation:</strong> {q.explanation}</Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </motion.div>
        </Container>
      </PageLayout>
    );
  }

  return null;
}
