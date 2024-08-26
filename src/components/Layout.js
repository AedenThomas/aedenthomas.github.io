import React, { useEffect, useState } from 'react';
import { BsSunFill, BsMoonFill } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
  // Determine initial mode based on local storage or system preference
  const getInitialMode = () => {
    const savedMode = localStorage.getItem('mode');
    if (savedMode) {
      return savedMode;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'day';
  };

  const [mode, setMode] = useState(getInitialMode);

  // Variants for the crossfade effect
  const fadeInOut = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } }
  };

  useEffect(() => {
    // Update the class on the HTML element to toggle dark mode
    const html = document.documentElement;
    html.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('mode', mode); // Save mode to local storage
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'day' ? 'dark' : 'day');
  };

  return (
    <div className={`flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white`}>
      <AnimatePresence mode="wait">
        <motion.header
          key={mode} // Important: change key on mode change to trigger animation
          initial="initial"
          animate="animate"
          exit="exit"
          variants={fadeInOut}
          className="p-5 flex justify-between items-center"
        >
          <h1 className="text-3xl font-bold">AEDEN</h1>
          <button
            className="focus:outline-none"
            onClick={toggleMode}
            aria-label="Toggle Night Mode"
          >
            {mode === 'day' ? <BsMoonFill size={24} /> : <BsSunFill size={24} />}
          </button>
        </motion.header>
      </AnimatePresence>
      <main className="flex-grow">{children}</main>
      <footer className="p-5">
        <div className="container mx-auto text-center">Footer Content</div>
      </footer>
    </div>
  );
};

export default Layout;
