import Box from '@mui/material/Box';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';

interface Props {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function PageLayout({ children, noPadding = false }: Props) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          pt: { xs: '56px', md: '64px' },
          pb: { xs: '80px', md: 0 },
          minHeight: '100vh',
          ...(noPadding ? {} : {}),
        }}
      >
        {children}
      </Box>
      <MobileBottomNav />
    </Box>
  );
}
