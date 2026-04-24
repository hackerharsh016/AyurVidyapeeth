export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  year: string;
  role: 'student' | 'creator' | 'admin';
  avatar: string;
  bio: string;
  enrolledCourses: string[];
  wishlist: string[];
  certificates: string[];
}

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Arjun Sharma',
    email: 'arjun@example.com',
    college: 'Banaras Hindu University',
    year: '3rd Year BAMS',
    role: 'student',
    avatar: 'AS',
    bio: 'Passionate Ayurveda student exploring classical texts and modern integrations.',
    enrolledCourses: [],
    wishlist: [],
    certificates: [],
  },
  {
    id: 'creator1',
    name: 'Dr. Priya Sharma',
    email: 'priya@example.com',
    college: 'Gujarat Ayurved University',
    year: 'Faculty',
    role: 'creator',
    avatar: 'PS',
    bio: 'PhD in Dravyaguna, 15+ years teaching experience. Passionate about making Ayurveda accessible.',
    enrolledCourses: [],
    wishlist: [],
    certificates: [],
  },
  {
    id: 'creator2',
    name: 'Dr. Rajesh Nair',
    email: 'rajesh@example.com',
    college: 'All India Institute of Ayurveda',
    year: 'Senior Faculty',
    role: 'creator',
    avatar: 'RN',
    bio: 'Panchakarma specialist with 20 years of clinical and teaching experience.',
    enrolledCourses: [],
    wishlist: [],
    certificates: [],
  },
  {
    id: 'admin1',
    name: 'Admin',
    email: 'admin@ayurvidyapeeth.com',
    college: 'AyurVidyapeeth',
    year: 'Admin',
    role: 'admin',
    avatar: 'AV',
    bio: 'Platform administrator.',
    enrolledCourses: [],
    wishlist: [],
    certificates: [],
  },
];

export const testimonials = [
  {
    id: 't1',
    name: 'Dr. Anjali Verma',
    college: 'National Institute of Ayurveda, Jaipur',
    year: 'Intern',
    quote: 'AyurVidyapeeth has completely transformed how I study. The structured Srotas encyclopedia and expert courses helped me crack my finals with confidence.',
    rating: 5,
    avatar: 'AV',
  },
  {
    id: 't2',
    name: 'Rohit Mishra',
    college: 'Banaras Hindu University',
    year: '2nd Year BAMS',
    quote: 'The Panchakarma Masterclass by Dr. Nair is incredible. Concepts I struggled with for months became crystal clear in just a few sessions.',
    rating: 5,
    avatar: 'RM',
  },
  {
    id: 't3',
    name: 'Kavya Nambiar',
    college: 'Amrita School of Ayurveda, Kerala',
    year: '4th Year BAMS',
    quote: 'The directory section is like having an Ayurvedic encyclopedia at your fingertips. Perfect for quick revision before exams.',
    rating: 5,
    avatar: 'KN',
  },
  {
    id: 't4',
    name: 'Dr. Suresh Patel',
    college: 'IPGT & RA, Jamnagar',
    year: 'PG Scholar',
    quote: 'As a researcher, I find the classical text courses invaluable. The quality of content here matches top university standards.',
    rating: 5,
    avatar: 'SP',
  },
];
