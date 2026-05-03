import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import { motion } from 'framer-motion';
import type { Course } from '../data/courses';

interface Props {
  course: Course;
  index?: number;
}

export default function CourseCard({ course, index = 0 }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <Card
        onClick={() => navigate(`/courses/${course.id}`)}
        sx={{
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Thumbnail */}
        <Box
          sx={{
            height: 160,
            background: `linear-gradient(135deg, #0E5B44 0%, #1A8060 50%, ${course.free ? '#2E7D52' : '#D4A017'} 100%)`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          <Typography sx={{ fontSize: '2.5rem', position: 'relative', zIndex: 1 }}>
            {course.category === 'Pharmacology' ? '🌿' :
             course.category === 'Therapy' ? '🧘' :
             course.category === 'Anatomy' ? '📚' :
             course.category === 'Diagnosis' ? '🔍' :
             course.category === 'Nutrition' ? '🍃' : '📖'}
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              gap: 0.5,
            }}
          >
            {course.free && (
              <Chip
                label="FREE"
                size="small"
                sx={{ bgcolor: '#22C55E', color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20 }}
              />
            )}
            <Chip
              label={course.level}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: 'text.primary', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
            />
          </Box>
          {course.certificate && (
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
              <Chip
                label="Certificate of Completion"
                size="small"
                sx={{ bgcolor: '#D4A017', color: 'white', fontWeight: 600, fontSize: '0.6rem', height: 18 }}
              />
            </Box>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.75, p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.subtitle}
          </Typography>

          {/* Instructor */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 22, height: 22, fontSize: '0.6rem', fontWeight: 700 }}>
              {course.instructorAvatar}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {course.instructor}
            </Typography>
          </Box>

          {/* Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={course.rating} readOnly precision={0.1} size="small" sx={{ fontSize: '0.85rem' }} />
            <Typography variant="caption" fontWeight={600} sx={{ color: '#D4A017' }}>
              {course.rating}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({course.students.toLocaleString()})
            </Typography>
          </Box>

          {/* Meta */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              ⏱ {course.duration}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              📹 {course.totalLessons} lessons
            </Typography>
          </Box>

          {/* Price */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto', pt: 1 }}>
            {course.free ? (
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#22C55E' }}>
                Free
              </Typography>
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  ₹{course.price.toLocaleString()}
                </Typography>
                {course.originalPrice > course.price && (
                  <>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.disabled',
                        textDecoration: 'line-through',
                      }}
                    >
                      ₹{course.originalPrice.toLocaleString()}
                    </Typography>
                    <Chip
                      label={`${Math.round((1 - course.price / course.originalPrice) * 100)}% off`}
                      size="small"
                      sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontSize: '0.6rem', height: 18, fontWeight: 600 }}
                    />
                  </>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}
