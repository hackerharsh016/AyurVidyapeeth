import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import { directoryEntries, categories } from '../../data/directory';

const categoryIcons: Record<string, string> = {
  All: '🌿',
  Srotas: '🌊',
  Dosha: '⚡',
  Dhatu: '💎',
  Herbs: '🌱',
  Disease: '🩺',
};

export default function DirectoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    return directoryEntries.filter(entry => {
      const matchesCategory = activeCategory === 'All' || entry.category === activeCategory;
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        entry.sanskritName.toLowerCase().includes(searchLower) ||
        entry.englishName.toLowerCase().includes(searchLower) ||
        entry.shortDescription.toLowerCase().includes(searchLower) ||
        entry.category.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <PageLayout>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0E5B44 0%, #1A6B52 100%)',
          py: { xs: 5, md: 7 },
        }}
      >
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Ayurveda Encyclopedia
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
                Explore Srotas, Dosha, Dhatu, Herbs & Diseases in depth
              </Typography>
            </Box>

            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="Search Srotas, Dosha, Herbs, Diseases..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: 'white',
                    borderRadius: 3,
                    '& fieldset': { border: 'none' },
                    fontSize: '1rem',
                  },
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: { xs: 56, md: 64 }, zIndex: 100 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 1, py: 1.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            {categories.map(cat => (
              <Chip
                key={cat}
                label={`${categoryIcons[cat]} ${cat}`}
                onClick={() => setActiveCategory(cat)}
                variant={activeCategory === cat ? 'filled' : 'outlined'}
                sx={{
                  bgcolor: activeCategory === cat ? 'primary.main' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'text.secondary',
                  borderColor: activeCategory === cat ? 'primary.main' : 'divider',
                  fontWeight: activeCategory === cat ? 600 : 400,
                  cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { bgcolor: activeCategory === cat ? 'primary.dark' : 'rgba(14,91,68,0.06)' },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Results */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Showing <strong>{filtered.length}</strong> results
            {search && ` for "${search}"`}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
          </Typography>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${search}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Grid container spacing={3}>
              {filtered.map((entry, i) => (
                <Grid key={entry.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      onClick={() => navigate(`/directory/${entry.slug}`)}
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.12)' },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Chip
                            label={`${categoryIcons[entry.category]} ${entry.category}`}
                            size="small"
                            sx={{
                              bgcolor:
                                entry.category === 'Srotas' ? '#E8F5EF' :
                                entry.category === 'Dosha' ? '#FEF3C7' :
                                entry.category === 'Dhatu' ? '#EDE9FE' :
                                entry.category === 'Herbs' ? '#D1FAE5' :
                                '#FEE2E2',
                              color:
                                entry.category === 'Srotas' ? '#065F46' :
                                entry.category === 'Dosha' ? '#92400E' :
                                entry.category === 'Dhatu' ? '#5B21B6' :
                                entry.category === 'Herbs' ? '#065F46' :
                                '#991B1B',
                              fontWeight: 600,
                            }}
                          />
                          <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{ color: 'text.disabled', fontFamily: 'serif', display: 'block', mb: 0.5 }}
                        >
                          {entry.sanskritName}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, fontSize: '1.05rem', lineHeight: 1.3 }}>
                          {entry.englishName}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.6,
                          }}
                        >
                          {entry.shortDescription}
                        </Typography>

                        {entry.subtypes && (
                          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {entry.subtypes.slice(0, 3).map(sub => (
                              <Chip
                                key={sub}
                                label={sub}
                                size="small"
                                sx={{ bgcolor: 'rgba(14,91,68,0.06)', color: 'primary.main', fontSize: '0.65rem', height: 20 }}
                              />
                            ))}
                            {entry.subtypes.length > 3 && (
                              <Chip
                                label={`+${entry.subtypes.length - 3}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(14,91,68,0.06)', color: 'primary.main', fontSize: '0.65rem', height: 20 }}
                              />
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {filtered.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography sx={{ fontSize: '3rem', mb: 2 }}>🔍</Typography>
                <Typography variant="h6" color="text.secondary">No results found</Typography>
                <Typography variant="body2" color="text.disabled" mt={1}>
                  Try different search terms or clear filters
                </Typography>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </Container>
    </PageLayout>
  );
}
