
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
      },
      sidebarCollapsed: false,
      toggleSidebar: () => {
        set({ sidebarCollapsed: !get().sidebarCollapsed })
      },
    }),
    { name: 'plank-tool-menu-store-v1' }
  )
)
