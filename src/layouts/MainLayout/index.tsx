import { useEffect } from "react";
import { useMenuStore } from '@/stores/useMenuStore';
import { motion } from 'motion/react';
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import AnimatedOutlet from '@/components/AnimatedOutlet';

export default function MainLayout() {
  const { theme, sidebarCollapsed } = useMenuStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex flex-col flex-shrink-0 border-r border-border bg-background overflow-hidden"
      >
        <Sidebar />
      </motion.aside>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">        
          <AnimatedOutlet />     
        </main>
        <Footer />
      </div>
    </div>
  )
}
