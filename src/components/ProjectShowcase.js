// ProjectShowcase.js
import React from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import Tilt from 'react-parallax-tilt';

const ProjectShowcase = ({ title, description, imageUrl, onViewClick, index }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1, // Adjust as needed
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1, // stagger the children by 0.1 seconds
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };
  const [isBlurred, setIsBlurred] = useState(false);



  const handleMouseEnter = () => {
    setIsBlurred(true);
  };

  const handleMouseLeave = () => {
    setIsBlurred(false);
  };

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={ref}
      className="w-full md:w-1/2 lg:w-1/3 p-4 cursor-pointer" // Added shadow-lg for box shadow
      initial="hidden"
      animate={controls}
      variants={variants}
    >
      <Tilt
        className="parallax-effect-glare-scale w-full h-full"
        perspective={9000} // Increased perspective for a more subtle tilt effect
        glareEnable={true}
        glareMaxOpacity={0.8}
        scale={1.02}
        gyroscope={true}
      >
        <motion.div
          className="tilt-inner rounded-lg overflow-hidden flex flex-col bg-white dark:bg-black text-black dark:text-white shadow-lg" // Added shadow-lg for box shadow
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          onClick={onViewClick}
        >
          {/* Image */}
          <img src={imageUrl} alt={title} className="w-full transition-transform duration-200 ease-in-out" />

          {/* Text container */}
          <div className="p-4 text-center bg-white dark:bg-black"> {/* Dark mode background color */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2>
            <p className="text-base text-gray-600 dark:text-gray-300" style={{ fontFamily: "'Roboto', sans-serif" }}>{description}</p>
          </div>
        </motion.div>
      </Tilt>
    </motion.div>
  );
};

export default ProjectShowcase;
