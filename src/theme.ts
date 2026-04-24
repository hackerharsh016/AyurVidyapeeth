import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0E5B44',
      light: '#1A8060',
      dark: '#093D2E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D4A017',
      light: '#E8C04A',
      dark: '#A07810',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAF6EE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#4A4A4A',
    },
    success: {
      main: '#0E5B44',
      light: '#1A8060',
      dark: '#093D2E',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Poppins", "Inter", "Roboto", sans-serif',
      fontWeight: 600,
    },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, padding: '10px 24px', fontWeight: 600 },
        contained: {
          boxShadow: '0 2px 8px rgba(14,91,68,0.25)',
          '&:hover': { boxShadow: '0 4px 16px rgba(14,91,68,0.35)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease, transform 0.2s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: '0 1px 8px rgba(0,0,0,0.08)' } },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500 },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.08)', height: 64 },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { color: '#0E5B44' },
          minWidth: 60,
        },
        label: {
          fontSize: '0.68rem',
          '&.Mui-selected': { fontSize: '0.68rem' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: '#E8F5EF' },
        bar: { borderRadius: 4 },
      },
    },
  },
});

theme = responsiveFontSizes(theme);
export default theme;
