import { create } from 'zustand';
import { supabase } from '../supabase/supabase';

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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: { name: string; email: string; college: string; year: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  initializeSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,

  initializeSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        set({
          user: {
            id: profile.id,
            name: profile.full_name || '',
            email: profile.email || '',
            college: profile.college || '',
            year: profile.year || '',
            role: (profile.role as 'student' | 'creator' | 'admin') || 'student',
            avatar: profile.avatar_url || '',
            bio: '',
          },
          isAuthenticated: true,
        });
      }
    }
  },

  login: async (email: string, password: string) => {
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !session) return false;
    
    await get().initializeSession();
    return true;
  },

  signup: async (data) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          college: data.college,
          year: data.year,
        }
      }
    });

    if (error || !authData.user) return false;
    
    await get().initializeSession();
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    const current = get().user;
    if (!current) return;
    
    await supabase.from('profiles').update({
      full_name: data.name,
      college: data.college,
      year: data.year,
    }).eq('id', current.id);
    
    await get().initializeSession();
  },
}));
