import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '@/api/client';
import { toast } from 'sonner';

export interface User {
  username: string;
  email: string;
  role: string;
  favorites?: string[];
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
        const favorites = Array.isArray(user.favorites) ? user.favorites : get().favorites;
        set({ token, user, isLoggedIn: true, favorites });
      },

      logout: () => {
        set({ token: null, user: null, isLoggedIn: false, favorites: [] });
        toast.info('已退出登录');
      },

      toggleFavorite: (tool: string) => {
        const { favorites, isLoggedIn } = get();
        if (!isLoggedIn) return;

        const newFavorites = favorites.includes(tool)
          ? favorites.filter((f) => f !== tool)
          : [...favorites, tool];
        set({ favorites: newFavorites });

        client.put('/users/favorites', { favorites: newFavorites })
          .catch(() => {
            set({ favorites });
            toast.error('收藏同步失败');
          });
      },

      fetchProfile: async () => {
        try {
          const res = await client.get('/users/profile') as unknown as { code: number; data?: { user?: User } };
          if (res.code === 200) {
            const user = res.data?.user ?? null;
            const fav = user && Array.isArray(user.favorites) ? user.favorites : [];
            set({ user, favorites: fav });
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
