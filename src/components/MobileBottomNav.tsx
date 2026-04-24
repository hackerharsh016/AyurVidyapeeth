import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/directory')) return 1;
    if (path.startsWith('/courses')) return 2;
    if (path.startsWith('/learning')) return 3;
    if (path.startsWith('/profile')) return 4;
    return 0;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
      }}
      elevation={0}
    >
      <Box sx={{ pb: 'env(safe-area-inset-bottom, 0px)' }}>
        <BottomNavigation
          value={getActiveTab()}
          onChange={(_e, val) => {
            const paths = ['/', '/directory', '/courses', '/learning', '/profile'];
            navigate(paths[val]);
          }}
          sx={{ height: 64 }}
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction label="Explore" icon={<SearchIcon />} />
          <BottomNavigationAction label="Courses" icon={<MenuBookIcon />} />
          <BottomNavigationAction label="Learn" icon={<PlayLessonIcon />} />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
        </BottomNavigation>
      </Box>
    </Paper>
  );
}
