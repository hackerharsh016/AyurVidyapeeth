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
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import QuizIcon from '@mui/icons-material/Quiz';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { supabase } from '../../supabase/supabase';
import { useAuthStore } from '../../stores/authStore';
import { SUBJECTS } from '../../constants/subjects';

interface Question {
  id?: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
  explanation: string | null;
  sort_order: number | null;
}

interface Test {
  id?: string;
  title: string;
  description: string;
  subject: string;
  eligibility: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  status: 'draft' | 'published';
  creator_id?: string;
  created_at?: string;
  _question_count?: number;
}

const emptyQ = (): Question => ({
  question: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'A', marks: 1, explanation: '', sort_order: 0,
});

const emptyTest: Test = {
  title: '', description: '', subject: SUBJECTS[0], eligibility: '',
  duration_minutes: 30, total_marks: 0, pass_marks: 0, status: 'draft',
};

export default function ManageTestsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Test form dialog
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testForm, setTestForm] = useState<Test>(emptyTest);

  // Questions dialog
  const [qDialogOpen, setQDialogOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeTestTitle, setActiveTestTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string, severity: 'success' | 'error' = 'success') =>
    setToast({ open: true, message, severity });

  const fetchTests = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('tests')
      .select('*, test_questions(count)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTests(data.map((t: any) => ({ ...t, _question_count: t.test_questions?.[0]?.count ?? 0 })));
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated && user) fetchTests(); }, [user, isAuthenticated]);

  /* ──── Test CRUD ──── */
  const openTestDialog = (test?: Test) => {
    setEditingTest(test || null);
    setTestForm(test ? { ...test } : emptyTest);
    setTestDialogOpen(true);
  };

  const saveTest = async () => {
    if (!user) return;
    setSaving(true);
    const { id, created_at, _question_count, ...cleanPayload } = testForm;
    const payload = { ...cleanPayload, creator_id: user.id };
    let err;
    if (editingTest?.id) {
      ({ error: err } = await supabase.from('tests').update(payload).eq('id', editingTest.id));
    } else {
      ({ error: err } = await supabase.from('tests').insert([payload]));
    }
    setSaving(false);
    if (err) { showToast(err.message, 'error'); return; }
    showToast(editingTest ? 'Test updated!' : 'Test created!');
    setTestDialogOpen(false);
    fetchTests();
  };

  const togglePublish = async (test: Test) => {
    const newStatus = test.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('tests').update({ status: newStatus }).eq('id', test.id!);
    if (!error) { showToast(`Test ${newStatus === 'published' ? 'published' : 'unpublished'}!`); fetchTests(); }
  };

  const deleteTest = async (id: string) => {
    if (!confirm('Delete this test and all its questions?')) return;
    await supabase.from('tests').delete().eq('id', id);
    showToast('Test deleted.'); fetchTests();
  };

  /* ──── Questions CRUD ──── */
  const openQuestions = async (test: Test) => {
    setActiveTestId(test.id!);
    setActiveTestTitle(test.title);
    setQLoading(true);
    setQDialogOpen(true);
    const { data } = await supabase.from('test_questions').select('*').eq('test_id', test.id!).order('sort_order');
    setQuestions(data?.length ? data : [emptyQ()]);
    setQLoading(false);
  };

  const addQuestion = () => setQuestions(prev => [...prev, { ...emptyQ(), sort_order: prev.length }]);
  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, field: keyof Question, value: string | number) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));

  const saveQuestions = async () => {
    if (!activeTestId) return;
    setSaving(true);
    // Calculate total marks from questions
    const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 1), 0);

    // Delete all existing questions for this test then re-insert
    await supabase.from('test_questions').delete().eq('test_id', activeTestId);
    
    const payload = questions.map((q, i) => {
      const { id: qId, created_at: qAt, ...questionData } = q as any;
      return {
        ...questionData,
        test_id: activeTestId,
        sort_order: i,
        marks: Number(q.marks) || 1,
      };
    });
    
    const { error } = await supabase.from('test_questions').insert(payload);
    // Update total_marks on the test
    await supabase.from('tests').update({ total_marks: totalMarks }).eq('id', activeTestId);

    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(`${questions.length} questions saved!`);
    setQDialogOpen(false);
    fetchTests();
  };

  return (
    <PageLayout>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #0a1628 0%, #0E5B44 100%)', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/creator')} sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, '&:hover': { color: 'white' } }}>
            Creator Dashboard
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>Manage Tests</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)' }}>Create, edit, and publish MCQ practice tests for your students.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openTestDialog()}
              sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700, '&:hover': { bgcolor: '#F0FDF4' }, borderRadius: 3, px: 3 }}>
              New Test
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress /></Box>
        ) : tests.length === 0 ? (
          <Box sx={{ py: 14, textAlign: 'center', opacity: 0.5 }}>
            <QuizIcon sx={{ fontSize: 64, mb: 2, color: 'text.disabled' }} />
            <Typography variant="h5" fontWeight={700}>No tests yet</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Create your first MCQ test and publish it for students.</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openTestDialog()}>Create Test</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {tests.map((test, i) => (
              <Grid key={test.id} size={{ xs: 12, md: 6 }}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, overflow: 'hidden', transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 24px rgba(0,0,0,0.08)' } }}>
                    <Box sx={{ height: 4, bgcolor: test.status === 'published' ? '#10B981' : '#D97706' }} />
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ flex: 1, pr: 2 }}>{test.title}</Typography>
                        <Chip label={test.status} size="small" sx={{ fontWeight: 700, bgcolor: test.status === 'published' ? '#D1FAE5' : '#FEF3C7', color: test.status === 'published' ? '#065F46' : '#92400E' }} />
                      </Box>
                      {test.subject && <Chip label={test.subject} size="small" sx={{ mb: 1.5, bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main', fontSize: '0.7rem' }} />}
                      {test.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>{test.description}</Typography>}
                      <Box sx={{ display: 'flex', gap: 3, mb: 2.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <QuizIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test._question_count} Questions</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimerIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test.duration_minutes} min</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmojiEventsIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                          <Typography variant="caption" fontWeight={700}>{test.total_marks} marks</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" startIcon={<QuizIcon />} variant="outlined" onClick={() => openQuestions(test)} sx={{ borderRadius: 2 }}>
                          Questions
                        </Button>
                        <Button size="small" startIcon={<EditIcon />} variant="outlined" onClick={() => openTestDialog(test)} sx={{ borderRadius: 2 }}>
                          Edit
                        </Button>
                        <Button size="small" startIcon={test.status === 'published' ? <UnpublishedIcon /> : <PublishIcon />}
                          variant={test.status === 'published' ? 'outlined' : 'contained'}
                          color={test.status === 'published' ? 'warning' : 'success'}
                          onClick={() => togglePublish(test)} sx={{ borderRadius: 2 }}>
                          {test.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <IconButton size="small" color="error" onClick={() => deleteTest(test.id!)} sx={{ ml: 'auto' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ─── Test Details Dialog ─── */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider' }}>
          {editingTest ? 'Edit Test' : 'Create New Test'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Test Title *" value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} fullWidth />
            <TextField label="Description" value={testForm.description} onChange={e => setTestForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline rows={3} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    label="Subject"
                    value={testForm.subject}
                    onChange={e => setTestForm(f => ({ ...f, subject: e.target.value }))}
                  >
                    {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Eligibility" value={testForm.eligibility} onChange={e => setTestForm(f => ({ ...f, eligibility: e.target.value }))} fullWidth placeholder="e.g. BAMS 1st Year" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Duration (minutes)" type="number" value={testForm.duration_minutes} onChange={e => setTestForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} fullWidth inputProps={{ min: 1 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Total Marks" type="number" value={testForm.total_marks} onChange={e => setTestForm(f => ({ ...f, total_marks: Number(e.target.value) }))} fullWidth inputProps={{ min: 0 }} helperText="Auto-calculated on save" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Pass Marks" type="number" value={testForm.pass_marks} onChange={e => setTestForm(f => ({ ...f, pass_marks: Number(e.target.value) }))} fullWidth inputProps={{ min: 0 }} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setTestDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={saveTest} disabled={saving || !testForm.title}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : editingTest ? 'Update' : 'Create Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Questions Builder Dialog ─── */}
      <Dialog open={qDialogOpen} onClose={() => setQDialogOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, height: '92vh' } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          <QuizIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={800}>Question Builder</Typography>
            <Typography variant="caption" color="text.secondary">{activeTestTitle}</Typography>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={`${questions.length} Questions`} size="small" color="primary" />
            <Chip label={`${questions.reduce((s, q) => s + (Number(q.marks) || 1), 0)} total marks`} size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E' }} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {qLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {questions.map((q, idx) => (
                <Paper key={idx} elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ color: 'white' }}>Q{idx + 1}</Typography>
                    </Box>
                    <TextField
                      label="Marks" type="number" value={q.marks}
                      onChange={e => updateQuestion(idx, 'marks', Number(e.target.value))}
                      size="small" sx={{ width: 90 }} inputProps={{ min: 1 }}
                    />
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" color="error" onClick={() => removeQuestion(idx)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>

                  <TextField
                    label="Question *" value={q.question} onChange={e => updateQuestion(idx, 'question', e.target.value)}
                    fullWidth multiline rows={2} sx={{ mb: 2 }}
                    placeholder={`Q${idx + 1}. Type your MCQ question here...`}
                  />

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                      const key = `option_${opt}` as keyof Question;
                      const isCorrect = q.correct_option === opt.toUpperCase();
                      return (
                        <Grid key={opt} size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ position: 'relative' }}>
                            <TextField
                              label={`Option ${opt.toUpperCase()}`}
                              value={q[key] as string}
                              onChange={e => updateQuestion(idx, key, e.target.value)}
                              fullWidth size="small"
                              InputProps={{ sx: { borderRadius: 2, borderColor: isCorrect ? '#10B981' : undefined } }}
                              sx={{ '& .MuiOutlinedInput-root': { borderColor: isCorrect ? '#10B981' : undefined, '& fieldset': { borderColor: isCorrect ? '#10B981' : undefined, borderWidth: isCorrect ? 2 : 1 } } }}
                            />
                            <Button
                              size="small"
                              onClick={() => updateQuestion(idx, 'correct_option', opt.toUpperCase())}
                              sx={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                minWidth: 0, px: 1, py: 0.25, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: isCorrect ? '#D1FAE5' : '#F3F4F6',
                                color: isCorrect ? '#065F46' : '#6B7280',
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: isCorrect ? '#BBF7D0' : '#E5E7EB' },
                              }}>
                              {isCorrect ? '✓ Correct' : 'Set Correct'}
                            </Button>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  <TextField
                    label="Explanation (optional)" value={q.explanation}
                    onChange={e => updateQuestion(idx, 'explanation', e.target.value)}
                    fullWidth size="small" placeholder="Add an explanation that students will see in the answer review..."
                  />
                </Paper>
              ))}

              <Button startIcon={<AddIcon />} onClick={addQuestion} variant="outlined" fullWidth
                sx={{ py: 2, borderRadius: 3, borderStyle: 'dashed', fontWeight: 700 }}>
                Add Question
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {questions.length} questions • {questions.reduce((s, q) => s + (Number(q.marks) || 1), 0)} total marks
          </Typography>
          <Button onClick={() => setQDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={saveQuestions} disabled={saving} sx={{ px: 4 }}>
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : `Save ${questions.length} Questions`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} sx={{ borderRadius: 2 }}>{toast.message}</Alert>
      </Snackbar>
    </PageLayout>
  );
}
