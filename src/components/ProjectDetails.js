import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProjectDetails = ({ project, onClose, detailsText }) => {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.95, rotateX: -15, perspective: 1000 },
    in: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    out: {
      opacity: 0,
      scale: 0.95,
      rotateX: -15,
      transition: { duration: 0.5 },
    },
  };
  const handleCardClick = (e) => {
    e.stopPropagation();
  };



  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    in: { y: 0, opacity: 1, transition: { duration: 0.5 } },
    out: { y: -20, opacity: 0, transition: { duration: 0.5 } },
  };

  const overlayVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1, transition: { delay: 0.2, duration: 0.5 } },
    out: { opacity: 0, transition: { duration: 0.5 } },
  };


  return (
    <AnimatePresence>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        onClick={onClose} // Close the details view when the overlay is clicked
        className="fixed inset-0 bg-white dark:bg-black bg-opacity-80 dark:bg-opacity-80 z-50 flex items-center justify-center backdrop-filter backdrop-blur-sm"
      >
        <motion.div
          onClick={handleCardClick} // Prevent the overlay onClick from being triggered when the card is clicked
          variants={containerVariants}
          className="max-w-3xl mx-auto p-8 bg-white dark:bg-black rounded-lg shadow-lg relative"
        >
          <motion.img
            src="https://mockupcloud-themety.imgix.net/uploads/images/2024/03/12/Image0008_copy.jpg?auto=compress,format&fit=clip,max&w=1170"
            alt={project.imageUrl}
            className="w-full h-64 object-cover rounded-lg mb-8"
            variants={itemVariants}
          />
          <motion.h2 className="text-4xl font-bold text-black dark:text-gray-100 mb-4" variants={itemVariants}>
            {project.title}
          </motion.h2>
          <motion.p className="text-xl text-gray-900 dark:text-gray-200 mb-8" variants={itemVariants}>
            {project.description}
          </motion.p>
          <motion.p className="text-lg text-gray-600 dark:text-gray-300" variants={itemVariants}>
            {detailsText}
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

};

export default ProjectDetails;
