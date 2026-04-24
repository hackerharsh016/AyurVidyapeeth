import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

interface Props {
  open: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

export default function AuthModal({ open, mode, onClose, onSwitchMode }: Props) {
  const navigate = useNavigate();
  const { login, signup } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', college: '', year: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = login(loginForm.email, loginForm.password);
    setLoading(false);
    if (success) {
      onClose();
      navigate('/');
    } else {
      setError('Invalid credentials. Try: student@ayurvidyapeeth.com or admin@ayurvidyapeeth.com with any password.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = signup(signupForm);
    setLoading(false);
    if (success) {
      onClose();
      navigate('/');
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
          m: 2,
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            p: 3,
            pb: 4,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'white', opacity: 0.8 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>🌿</Typography>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
            {mode === 'login' ? 'Welcome Back' : 'Join AyurVidyapeeth'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.5 }}>
            {mode === 'login' ? 'Sign in to continue learning' : 'Start your Ayurveda journey today'}
          </Typography>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 3, px: 3 }}>
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {error && <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>{error}</Alert>}

                  <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                    <Typography variant="caption" sx={{ color: '#065F46', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Demo Accounts:
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#065F46', display: 'block' }}>
                      student@ayurvidyapeeth.com (any password)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#065F46', display: 'block' }}>
                      creator@ayurvidyapeeth.com | admin@ayurvidyapeeth.com
                    </Typography>
                  </Box>

                  <TextField
                    label="Email address"
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    required
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    required
                    size="small"
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.3, borderRadius: 2 }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                  <TextField
                    label="Full Name *"
                    value={signupForm.name}
                    onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Email Address *"
                    type="email"
                    value={signupForm.email}
                    onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="College / Institution"
                    value={signupForm.college}
                    onChange={e => setSignupForm(f => ({ ...f, college: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Year of Study"
                    placeholder="e.g. 2nd Year BAMS"
                    value={signupForm.year}
                    onChange={e => setSignupForm(f => ({ ...f, year: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Password *"
                    type="password"
                    value={signupForm.password}
                    onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    sx={{ py: 1.3, borderRadius: 2 }}
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">or</Typography>
          </Divider>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Box
              component="span"
              onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
              sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </Box>
          </Typography>
        </DialogContent>
      </Box>
    </Dialog>
  );
}
