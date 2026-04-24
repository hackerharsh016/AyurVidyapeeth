import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  college: string;
  year: string;
  role: 'student' | 'creator' | 'admin';
  avatar: string;
  bio: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string) => boolean;
  signup: (data: { name: string; email: string; college: string; year: string; password: string }) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateAvatar = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (email: string, _password: string) => {
        // Simulate login with mock credentials
        const mockAccounts: Record<string, AuthUser> = {
          'admin@ayurvidyapeeth.com': {
            id: 'admin1', name: 'Admin User', email: 'admin@ayurvidyapeeth.com',
            college: 'AyurVidyapeeth', year: 'Admin', role: 'admin', avatar: 'AU', bio: 'Platform administrator',
          },
          'creator@ayurvidyapeeth.com': {
            id: 'creator1', name: 'Dr. Priya Sharma', email: 'creator@ayurvidyapeeth.com',
            college: 'Gujarat Ayurved University', year: 'Faculty', role: 'creator', avatar: 'PS',
            bio: 'PhD in Dravyaguna, 15+ years teaching experience.',
          },
          'student@ayurvidyapeeth.com': {
            id: 'u1', name: 'Arjun Sharma', email: 'student@ayurvidyapeeth.com',
            college: 'Banaras Hindu University', year: '3rd Year BAMS', role: 'student', avatar: 'AS',
            bio: 'Passionate Ayurveda student.',
          },
        };

        const mockUser = mockAccounts[email.toLowerCase()];
        if (mockUser) {
          set({ user: mockUser, isAuthenticated: true });
          return true;
        }

        // Check localStorage for registered users
        const stored = localStorage.getItem('ayurvidya_users');
        if (stored) {
          const users: AuthUser[] = JSON.parse(stored);
          const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (found) {
            set({ user: found, isAuthenticated: true });
            return true;
          }
        }

        return false;
      },

      signup: (data) => {
        const existing = get().user;
        if (existing?.email === data.email) return false;

        const newUser: AuthUser = {
          id: generateId(),
          name: data.name,
          email: data.email,
          college: data.college,
          year: data.year,
          role: 'student',
          avatar: generateAvatar(data.name),
          bio: '',
        };

        // Store in localStorage
        const stored = localStorage.getItem('ayurvidya_users');
        const users: AuthUser[] = stored ? JSON.parse(stored) : [];
        users.push(newUser);
        localStorage.setItem('ayurvidya_users', JSON.stringify(users));

        set({ user: newUser, isAuthenticated: true });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (data) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...data };
        set({ user: updated });
      },
    }),
    { name: 'ayurvidya_auth' }
  )
);
