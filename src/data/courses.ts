export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf' | 'quiz';
  preview?: boolean;
  videoUrl?: string;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  instructor: string;
  instructorBio: string;
  instructorAvatar: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  rating: number;
  students: number;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  subject: string;
  tags: string[];
  description: string;
  whatYouLearn: string[];
  curriculum: Section[];
  reviews: Review[];
  category: string;
  free: boolean;
  certificate: boolean;
  totalLessons: number;
  totalPdfs: number;
  status: 'published' | 'pending' | 'draft';
  creatorId: string;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Dravyaguna Fundamentals',
    subtitle: 'Master the science of Ayurvedic pharmacology from scratch',
    instructor: 'Dr. Priya Sharma',
    instructorBio: 'PhD in Dravyaguna from BHU, 15+ years teaching experience',
    instructorAvatar: 'PS',
    thumbnail: '/api/placeholder/400/225',
    price: 2499,
    originalPrice: 4999,
    rating: 4.8,
    students: 3240,
    duration: '24 hrs',
    level: 'Beginner',
    language: 'Hindi + English',
    subject: 'Dravyaguna',
    tags: ['herbs', 'pharmacology', 'basics'],
    category: 'Pharmacology',
    free: false,
    certificate: true,
    totalLessons: 48,
    totalPdfs: 12,
    status: 'published',
    creatorId: 'creator1',
    description: 'A comprehensive course on Dravyaguna — the classical science of Ayurvedic pharmacology. Learn the properties, actions and therapeutic uses of herbs used in Ayurveda. This course covers Rasa, Guna, Virya, Vipaka, Prabhava and detailed profiles of 100+ medicinal plants.',
    whatYouLearn: [
      'Understand Rasa, Guna, Virya, Vipaka and Prabhava',
      'Identify 100+ medicinal plants with their Sanskrit names',
      'Apply pharmacological principles in clinical practice',
      'Prepare simple Ayurvedic formulations',
      'Understand drug-herb interactions',
      'Learn Nighantus — classical Ayurvedic materia medica',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Introduction to Dravyaguna',
        lessons: [
          { id: 'l1', title: 'What is Dravyaguna?', duration: '12:30', type: 'video', preview: true },
          { id: 'l2', title: 'History and Importance', duration: '18:45', type: 'video', preview: true },
          { id: 'l3', title: 'Course Overview PDF', duration: '5 pages', type: 'pdf' },
        ],
      },
      {
        id: 's2',
        title: 'Rasa — Taste Classification',
        lessons: [
          { id: 'l4', title: 'Six Tastes of Ayurveda', duration: '22:10', type: 'video' },
          { id: 'l5', title: 'Sweet & Sour Rasa', duration: '19:30', type: 'video' },
          { id: 'l6', title: 'Pungent, Bitter, Astringent & Salt', duration: '24:00', type: 'video' },
          { id: 'l7', title: 'Rasa Quiz', duration: '10 questions', type: 'quiz' },
        ],
      },
      {
        id: 's3',
        title: 'Guna — Properties',
        lessons: [
          { id: 'l8', title: '20 Gunas of Dravya', duration: '30:15', type: 'video' },
          { id: 'l9', title: 'Applying Gunas in Therapy', duration: '25:00', type: 'video' },
          { id: 'l10', title: 'Guna Reference Charts PDF', duration: '8 pages', type: 'pdf' },
        ],
      },
      {
        id: 's4',
        title: 'Major Medicinal Plants',
        lessons: [
          { id: 'l11', title: 'Ashwagandha — King of Herbs', duration: '28:00', type: 'video' },
          { id: 'l12', title: 'Brahmi — Brain Tonic', duration: '22:30', type: 'video' },
          { id: 'l13', title: 'Triphala and Trikatu', duration: '32:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Arun Kumar', avatar: 'AK', rating: 5, comment: 'Excellent course! Dr. Sharma explains complex concepts very clearly. Best Dravyaguna course available online.', date: '2024-11-15' },
      { id: 'r2', user: 'Meena Patel', avatar: 'MP', rating: 5, comment: 'The herb profiles are incredibly detailed. This has transformed my practice.', date: '2024-10-28' },
      { id: 'r3', user: 'Ravi Singh', avatar: 'RS', rating: 4, comment: 'Very comprehensive content. Would love more clinical case studies.', date: '2024-10-10' },
    ],
  },
  {
    id: '2',
    title: 'Panchakarma Masterclass',
    subtitle: 'Complete guide to the five classical purification therapies',
    instructor: 'Dr. Rajesh Nair',
    instructorBio: 'Senior Panchakarma Specialist, 20 years clinical experience at AIIA',
    instructorAvatar: 'RN',
    thumbnail: '/api/placeholder/400/225',
    price: 3999,
    originalPrice: 7999,
    rating: 4.9,
    students: 1876,
    duration: '36 hrs',
    level: 'Intermediate',
    language: 'English',
    subject: 'Panchakarma',
    tags: ['detox', 'therapy', 'panchakarma'],
    category: 'Therapy',
    free: false,
    certificate: true,
    totalLessons: 72,
    totalPdfs: 18,
    status: 'published',
    creatorId: 'creator2',
    description: 'The most comprehensive Panchakarma course available. Learn all five classical Shodhana therapies — Vamana, Virechana, Basti, Nasya, and Raktamokshana. Includes purvakarma, pradhanakarma, and paschatkarma procedures.',
    whatYouLearn: [
      'Complete Vamana (therapeutic emesis) protocol',
      'Virechana (purgation) therapy in detail',
      'All types of Basti (medicated enema)',
      'Nasya — nasal administration of medicines',
      'Raktamokshana — bloodletting therapy',
      'Snehana and Swedana — preparatory therapies',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Foundation of Panchakarma',
        lessons: [
          { id: 'l1', title: 'Philosophy of Shodhana', duration: '20:00', type: 'video', preview: true },
          { id: 'l2', title: 'Indications and Contraindications', duration: '25:00', type: 'video', preview: true },
        ],
      },
      {
        id: 's2',
        title: 'Purvakarma',
        lessons: [
          { id: 'l3', title: 'Snehana — Internal Oleation', duration: '35:00', type: 'video' },
          { id: 'l4', title: 'Bahya Snehana — External Oleation', duration: '28:00', type: 'video' },
          { id: 'l5', title: 'Swedana — Sudation Therapy', duration: '32:00', type: 'video' },
        ],
      },
      {
        id: 's3',
        title: 'Vamana Therapy',
        lessons: [
          { id: 'l6', title: 'Vamana — Theory and Selection', duration: '30:00', type: 'video' },
          { id: 'l7', title: 'Vamana — Procedure Step by Step', duration: '45:00', type: 'video' },
          { id: 'l8', title: 'Post Vamana Care', duration: '20:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Dr. Sunita Rao', avatar: 'SR', rating: 5, comment: 'Dr. Nair is a true master. This course is the gold standard for Panchakarma education.', date: '2024-12-01' },
      { id: 'r2', user: 'Karan Mehta', avatar: 'KM', rating: 5, comment: 'Completely transformed my understanding of detox therapies. Highly recommended.', date: '2024-11-20' },
    ],
  },
  {
    id: '3',
    title: 'Sharir Rachana Crash Course',
    subtitle: 'Ayurvedic anatomy made simple for first-year BAMS students',
    instructor: 'Dr. Anita Gupta',
    instructorBio: 'Professor of Sharir Rachana, 12 years of teaching experience',
    instructorAvatar: 'AG',
    thumbnail: '/api/placeholder/400/225',
    price: 0,
    originalPrice: 0,
    rating: 4.6,
    students: 8920,
    duration: '12 hrs',
    level: 'Beginner',
    language: 'Hindi',
    subject: 'Sharir Rachana',
    tags: ['anatomy', 'basics', 'BAMS', 'free'],
    category: 'Anatomy',
    free: true,
    certificate: false,
    totalLessons: 24,
    totalPdfs: 6,
    status: 'published',
    creatorId: 'creator1',
    description: 'A fast-paced, engaging crash course on Ayurvedic anatomy. Perfect for BAMS first year students who need to master Sharir Rachana before their exams.',
    whatYouLearn: [
      'All Srotas with their Moolasthana',
      'Dhatu and their progressive formation',
      'Prana Vayu and its subtypes',
      'Classical descriptions of body organs',
      'Marma points and their significance',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Introduction to Sharir',
        lessons: [
          { id: 'l1', title: 'Panchamahabhuta and Body', duration: '15:00', type: 'video', preview: true },
          { id: 'l2', title: 'Tridosha and Dhatu', duration: '20:00', type: 'video', preview: true },
        ],
      },
      {
        id: 's2',
        title: 'Srotas System',
        lessons: [
          { id: 'l3', title: 'Introduction to Srotas', duration: '18:00', type: 'video' },
          { id: 'l4', title: 'Pranavaha and Udakavaha Srotas', duration: '22:00', type: 'video' },
          { id: 'l5', title: 'Annavaha and Rasavaha Srotas', duration: '24:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Pooja Jain', avatar: 'PJ', rating: 5, comment: 'Saved my exams! This free course is better than many paid ones.', date: '2024-11-05' },
      { id: 'r2', user: 'Amit Sharma', avatar: 'AS', rating: 4, comment: 'Clear explanation of complex anatomy topics. Dr. Gupta is fantastic.', date: '2024-10-15' },
    ],
  },
  {
    id: '4',
    title: 'Nadi Pariksha Mastery',
    subtitle: 'Learn the ancient art of pulse diagnosis from basics to advanced',
    instructor: 'Dr. Vikram Joshi',
    instructorBio: 'Expert in Nadi Vigyan, trained under Gurukul tradition',
    instructorAvatar: 'VJ',
    thumbnail: '/api/placeholder/400/225',
    price: 1999,
    originalPrice: 3999,
    rating: 4.7,
    students: 2100,
    duration: '18 hrs',
    level: 'Intermediate',
    language: 'English + Sanskrit',
    subject: 'Nadi Pariksha',
    tags: ['pulse diagnosis', 'pariksha', 'dosha'],
    category: 'Diagnosis',
    free: false,
    certificate: true,
    totalLessons: 36,
    totalPdfs: 10,
    status: 'published',
    creatorId: 'creator2',
    description: 'Deep dive into Nadi Pariksha — the classical pulse diagnosis system. Learn to detect Vata, Pitta, Kapha, and their combinations through pulse assessment.',
    whatYouLearn: [
      'Classical finger placement and pressure techniques',
      'Detect Vata, Pitta, Kapha pulses',
      'Identify Ama in the body through pulse',
      'Assess organ vitality through Nadi',
      'Integrate pulse findings with other Ashtasthana Pariksha',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Foundations of Nadi',
        lessons: [
          { id: 'l1', title: 'History of Nadi Vigyan', duration: '18:00', type: 'video', preview: true },
          { id: 'l2', title: 'Anatomy of the Radial Pulse', duration: '22:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Dr. Lata Krishnan', avatar: 'LK', rating: 5, comment: 'Finally a structured course on Nadi. Dr. Joshi makes it approachable.', date: '2024-11-28' },
    ],
  },
  {
    id: '5',
    title: 'Ayurvedic Nutrition & Diet',
    subtitle: 'Practical guide to Ahara — food as medicine in Ayurveda',
    instructor: 'Dr. Kavitha Menon',
    instructorBio: 'Clinical nutritionist and Ayurveda practitioner, 10 years exp',
    instructorAvatar: 'KM',
    thumbnail: '/api/placeholder/400/225',
    price: 1499,
    originalPrice: 2999,
    rating: 4.5,
    students: 5670,
    duration: '15 hrs',
    level: 'Beginner',
    language: 'English',
    subject: 'Ahara',
    tags: ['nutrition', 'diet', 'lifestyle'],
    category: 'Nutrition',
    free: false,
    certificate: true,
    totalLessons: 30,
    totalPdfs: 8,
    status: 'published',
    creatorId: 'creator1',
    description: 'Transform your health through Ayurvedic nutritional wisdom. Learn Pathya-Apathya (compatible-incompatible foods), seasonal eating, and therapeutic diets for various conditions.',
    whatYouLearn: [
      'Principles of Ahara in Ayurveda',
      'Viruddha Ahara — incompatible food combinations',
      'Dinacharya and Ritucharya diet adjustments',
      'Therapeutic diets for chronic diseases',
      'Kitchen pharmacy — cooking with medicinal spices',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Ahara Fundamentals',
        lessons: [
          { id: 'l1', title: 'Food as Medicine', duration: '16:00', type: 'video', preview: true },
          { id: 'l2', title: 'Dosha and Food Choices', duration: '20:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Sneha Kapoor', avatar: 'SK', rating: 5, comment: 'Changed the way I cook! Practical and science-backed Ayurvedic nutrition.', date: '2024-12-02' },
    ],
  },
  {
    id: '6',
    title: 'Charak Samhita — Key Chapters',
    subtitle: 'Deep study of selected chapters from the master text of Ayurveda',
    instructor: 'Dr. Mahesh Tripathi',
    instructorBio: 'Scholar of Classical Ayurveda, PhD from Gujarat Ayurved University',
    instructorAvatar: 'MT',
    thumbnail: '/api/placeholder/400/225',
    price: 3499,
    originalPrice: 5999,
    rating: 4.9,
    students: 890,
    duration: '40 hrs',
    level: 'Advanced',
    language: 'Sanskrit + English',
    subject: 'Samhita',
    tags: ['classical', 'samhita', 'charak', 'advanced'],
    category: 'Classical Texts',
    free: false,
    certificate: true,
    totalLessons: 80,
    totalPdfs: 25,
    status: 'published',
    creatorId: 'creator2',
    description: 'In-depth exploration of Charak Samhita, the foundational text of Ayurveda. This advanced course covers Sutrasthana, Nidanasthana, and Vimanasthana with complete Sanskrit verses and clinical commentary.',
    whatYouLearn: [
      'Sanskrit pronunciation and verse memorization',
      'Sutrasthana key chapters with commentary',
      'Nidanasthana — Ayurvedic pathology',
      'Vimanasthana — diagnostic principles',
      'Clinical application of classical teachings',
    ],
    curriculum: [
      {
        id: 's1',
        title: 'Sutrasthana',
        lessons: [
          { id: 'l1', title: 'Dirghanjivitiya Adhyaya', duration: '45:00', type: 'video', preview: true },
          { id: 'l2', title: 'Apamarga Tanduliya Adhyaya', duration: '40:00', type: 'video' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', user: 'Dr. Ram Prasad', avatar: 'RP', rating: 5, comment: 'A scholarly masterpiece. Dr. Tripathi brings the text to life.', date: '2024-11-10' },
    ],
  },
];
