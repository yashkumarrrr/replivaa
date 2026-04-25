import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  trialEndsAt: string;
  isTrialActive: boolean;
  subStatus: string | null;
  subPlan: string | null;
  instagramAccount?: {
    id: string;
    username: string;
    isActive: boolean;
    automationOn: boolean;
    followerCount?: number;
    profilePicUrl?: string;
  } | null;
  aiSettings?: any;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      set({ user: null });
      window.location.href = '/auth/login';
    }
  },
}));
