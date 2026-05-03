import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import CourseCard from '../../components/CourseCard';
import { useCourseStore } from '../../stores/courseStore';
import { SUBJECTS } from '../../constants/subjects';

const subjects = ['All', ...SUBJECTS];
const levels = ['All Years', '1st Professional', '2nd Professional', '3rd Professional'];

export default function CoursesPage() {
  const { courses } = useCourseStore();
  const published = courses.filter(c => c.status === 'published');

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [level, setLevel] = useState('All Years');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('popular');

  const filtered = useMemo(() => {
    let result = published.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !c.instructor.toLowerCase().includes(search.toLowerCase()) &&
          !c.subject.toLowerCase().includes(search.toLowerCase())) return false;
      if (subject !== 'All' && c.subject !== subject) return false;
      if (level !== 'All Years' && c.level !== level) return false;
      if (priceFilter === 'free' && !c.free) return false;
      if (priceFilter === 'paid' && c.free) return false;
      return true;
    });

    if (sortBy === 'popular') result = [...result].sort((a, b) => b.students - a.students);
    else if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'newest') result = [...result].sort((a, b) => b.id.localeCompare(a.id));
    else if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price - a.price);

    return result;
  }, [search, subject, level, priceFilter, sortBy, published]);

  return (
    <PageLayout>
      {/* Hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1, textAlign: 'center' }}>
              All Courses
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400, textAlign: 'center', mb: 4 }}>
              {published.length}+ expert-crafted Ayurveda courses
            </Typography>
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="Search courses, instructors, topics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                  sx: { bgcolor: 'white', borderRadius: 3, '& fieldset': { border: 'none' } },
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Filters */}
        <Box sx={{ mb: 4 }}>
          {/* Subject Chips */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
            {subjects.map(s => (
              <Chip
                key={s}
                label={s}
                onClick={() => setSubject(s)}
                variant={subject === s ? 'filled' : 'outlined'}
                sx={{
                  flexShrink: 0,
                  bgcolor: subject === s ? 'primary.main' : 'transparent',
                  color: subject === s ? 'white' : 'text.secondary',
                  borderColor: subject === s ? 'primary.main' : 'divider',
                  fontWeight: subject === s ? 600 : 400,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Box>

          {/* Advanced Filters Row */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={priceFilter}
              exclusive
              onChange={(_e, val) => val && setPriceFilter(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '8px !important',
                  px: 2,
                  py: 0.75,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' },
                },
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="free">Free</ToggleButton>
              <ToggleButton value="paid">Paid</ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Professional Year</InputLabel>
              <Select value={level} onChange={e => setLevel(e.target.value)} label="Professional Year" sx={{ borderRadius: 2 }}>
                {levels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} onChange={e => setSortBy(e.target.value)} label="Sort By" sx={{ borderRadius: 2 }}>
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              <strong>{filtered.length}</strong> courses found
            </Typography>
          </Box>
        </Box>

        {/* Course Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={`${search}-${subject}-${level}-${priceFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Grid container spacing={3}>
              {filtered.map((course, i) => (
                <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CourseCard course={course} index={i} />
                </Grid>
              ))}
            </Grid>
            {filtered.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>📚</Typography>
                <Typography variant="h6" color="text.secondary">No courses match your filters</Typography>
                <Typography variant="body2" color="text.disabled" mt={1}>Try adjusting your search or filters</Typography>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </PageLayout>
  );
}
