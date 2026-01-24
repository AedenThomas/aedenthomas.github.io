import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';

function ModeToggle({ viewMode, setViewMode, handleClickableHover, isDarkMode }) {
  // Use a portal to ensure the fixed positioning works relative to the viewport
  // even if parent components have transforms (which Framer Motion adds)
  return ReactDOM.createPortal(
    <motion.div 
      className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2"
      initial={{ y: 100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div 
        className="flex items-center p-1 md:p-1.5 rounded-full backdrop-blur-xl shadow-2xl transition-all duration-500 border bg-[#4E4E50] border-white/10 md:scale-[0.8]"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
        }}
      >
        {/* Human Mode Button */}
        <button
          onClick={() => setViewMode('human')}
          onMouseEnter={() => handleClickableHover(true)}
          onMouseLeave={() => handleClickableHover(false)}
          className={`relative px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-tight transition-all duration-300 ${
            viewMode === 'human'
              ? 'text-black shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
          style={{
             WebkitFontSmoothing: "antialiased",
          }}
        >
          {viewMode === 'human' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              layoutId="modeIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 md:gap-2">
            {/* <span className="text-base md:text-lg">👤</span> */}
            <span>HUMAN</span>
          </span>
        </button>

        {/* Machine Mode Button */}
        <button
          onClick={() => setViewMode('machine')}
          onMouseEnter={() => handleClickableHover(true)}
          onMouseLeave={() => handleClickableHover(false)}
          className={`relative px-3 py-1.5 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-semibold tracking-tight transition-all duration-300 ${
            viewMode === 'machine'
              ? 'text-black shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
          style={{
             WebkitFontSmoothing: "antialiased",
          }}
        >
          {viewMode === 'machine' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              layoutId="modeIndicator"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1 md:gap-2">
            {/* <span className="text-base md:text-lg">🤖</span> */}
            <span>MACHINE</span>
          </span>
        </button>
      </div>
    </motion.div>,
    document.body
  );
}

export default ModeToggle;
