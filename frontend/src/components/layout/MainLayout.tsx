import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, glassMorphism, aiInteraction } from '../../styles/design-system';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    darkMode: false,
    reducedMotion: false,
  });

  // Simulate initial loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen ${userPreferences.darkMode ? 'dark' : ''}`}>
      {/* Background with subtle gradient animation */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-neutral-50 dark:from-neutral-900 dark:to-primary-900 transition-colors duration-500" />
      
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: colors.glass.dark }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-full border-4 border-primary-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="relative min-h-screen">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-40 ${glassMorphism.backdrop} ${glassMorphism.border} ${glassMorphism.shadow}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                  AI Interface
                </span>
              </motion.div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full ${aiInteraction.highlight}`}
                  onClick={() => setUserPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                >
                  {userPreferences.darkMode ? '🌞' : '🌙'}
                </motion.button>
              </div>
            </div>
          </div>
        </nav>

        {/* Content area */}
        <div className="pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            {children}
          </motion.div>
        </div>

        {/* AI Assistant Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`fixed bottom-8 right-8 p-4 rounded-full ${aiInteraction.glow} ${glassMorphism.backdrop} ${glassMorphism.border}`}
        >
          <span className="text-2xl">🤖</span>
        </motion.button>
      </main>
    </div>
  );
};

export default MainLayout; 