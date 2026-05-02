import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import { useAuthStore } from '../stores/authStore';
import AuthModal from './AuthModal';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Directory', path: '/directory' },
  { label: 'Resources', path: '/resources' },
  { label: 'Courses', path: '/courses' },
  { label: 'Learning', path: '/learning' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenLogin = () => { setAuthMode('login'); setAuthOpen(true); };
  const handleOpenSignup = () => { setAuthMode('signup'); setAuthOpen(true); };
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1200,
          display: { xs: 'none', md: 'flex' },
        }}
      >
        <Toolbar sx={{ gap: 1, px: { md: 3, lg: 4 } }}>
          {/* Logo */}
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              flexShrink: 0,
              mr: 2,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              🌿
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.01em' }}>
              AyurVidyapeeth
            </Typography>
          </Box>

          {/* Nav Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexGrow: 1 }}>
            {navLinks.map(link => (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                sx={{
                  color: isActive(link.path) ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive(link.path) ? 600 : 400,
                  px: 1.5,
                  borderRadius: 2,
                  position: 'relative',
                  '&::after': isActive(link.path) ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    bgcolor: 'primary.main',
                    borderRadius: 1,
                  } : {},
                  '&:hover': { bgcolor: 'rgba(14,91,68,0.06)' },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          {/* Right Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 36,
                      height: 36,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {user?.avatar}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: 3,
                      minWidth: 200,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: '1px solid',
                      borderColor: 'divider',
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    {user?.role !== 'student' && (
                      <Chip
                        label={user?.role}
                        size="small"
                        sx={{
                          mt: 0.5,
                          display: 'block',
                          bgcolor: user?.role === 'admin' ? '#FEF3C7' : '#D1FAE5',
                          color: user?.role === 'admin' ? '#92400E' : '#065F46',
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={() => { navigate('/profile'); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}
                  >
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    My Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => { navigate('/learning'); handleMenuClose(); }}
                    sx={{ gap: 1.5, py: 1.2 }}
                  >
                    <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>
                    My Learning
                  </MenuItem>
                  {(user?.role === 'creator' || user?.role === 'admin') && (
                    <MenuItem
                      onClick={() => { navigate('/creator'); handleMenuClose(); }}
                      sx={{ gap: 1.5, py: 1.2 }}
                    >
                      <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                      Creator Dashboard
                    </MenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <MenuItem
                      onClick={() => { navigate('/admin'); handleMenuClose(); }}
                      sx={{ gap: 1.5, py: 1.2 }}
                    >
                      <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
                      Admin Panel
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleOpenLogin}
                  sx={{ borderRadius: 10, px: 2 }}
                >
                  Log In
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenSignup}
                  sx={{ borderRadius: 10, px: 2, bgcolor: 'primary.main' }}
                >
                  Sign Up Free
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Top Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1200,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px !important' }}>
          <Box
            component={Link}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
          >
            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
              🌿
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              AyurVidyapeeth
            </Typography>
          </Box>
          {isAuthenticated ? (
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700 }}>
                {user?.avatar}
              </Avatar>
            </IconButton>
          ) : (
            <Button variant="contained" color="primary" onClick={handleOpenLogin} size="small" sx={{ borderRadius: 10 }}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </>
  );
}
