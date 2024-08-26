import React from 'react';

import { motion } from 'framer-motion';

const heroVariants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1, ease: [0.6, -0.05, 0.01, 0.99] },
  },
};


const Hero = () => {
  const heroStyle = {
    height: `calc(100vh - 64px)`, // Subtract the header's height from the viewport height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };


  return (
    <motion.div
      style={heroStyle}
      variants={heroVariants}
      initial="initial"
      animate="animate"

    >

      <div className="text-center">
        <p className="text-sm uppercase tracking-widest mb-4">Introducing</p>
        <h1 className="text-6xl font-extrabold tracking-wide mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
          AEDEN THOMAS
        </h1>
        <a href="#projects" className="mt-4 px-6 py-2 border border-gray-500 text-gray-500 hover:text-white hover:border-white transition-colors duration-300 rounded-full">
          VIEW PROJECTS
        </a>
      </div>
    </motion.div>
  );
};

export default Hero;
