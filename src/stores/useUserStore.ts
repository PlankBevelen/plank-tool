import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '@/api/client';
import { toast } from 'sonner';

interface User {
  username: string;
  email: string;
  role: string;
}

export interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  favorites: string[];
  
  login: (token: string, user: User) => void;
  logout: () => void;
  toggleFavorite: (tool: string) => void;
  fetchProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      favorites: [],

      login: (token, user) => {
        set({ token, user, isLoggedIn: true });
      },

      logout: () => {
        set({ token: null, user: null, isLoggedIn: false });
        toast.info('已退出登录');
      },

      toggleFavorite: (tool: string) => {
        const { favorites } = get();
        const newFavorites = favorites.includes(tool)
          ? favorites.filter((f) => f !== tool)
          : [...favorites, tool];
        set({ favorites: newFavorites });
      },

      fetchProfile: async () => {
        try {
          const res: any = await client.get('/users/profile');
          if (res.code === 200) {
            set({ user: res.data.user });
          }
        } catch (error) {
          console.error('Failed to fetch profile', error);
        }
      },
    }),
    {
      name: 'plank-tool-user-store-v2',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isLoggedIn: state.isLoggedIn, 
        favorites: state.favorites 
      }),
    }
  )
);
