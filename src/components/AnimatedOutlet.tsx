import { useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Suspense } from 'react';

export default function AnimatedOutlet() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="min-h-full"
      >
        <Suspense fallback={<div className="p-6 text-zinc-500">正在加载...</div>}>
          {element}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
