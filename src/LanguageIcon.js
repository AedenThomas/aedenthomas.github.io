import React from 'react';
import { motion } from 'framer-motion';

const icons = {
  react: '⚛️',
  'react native': '📱',
  python: '🐍',
  flutter: '🦋',
  'asp.net core': '🌐',
  // Add more icons as needed
};

const LanguageIcon = ({ language }) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="inline-block ml-1"
    >
      {icons[language.toLowerCase()] || '🚀'}
    </motion.span>
  );
};

export default LanguageIcon;
