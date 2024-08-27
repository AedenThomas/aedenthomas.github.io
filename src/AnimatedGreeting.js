import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AnimatedGreeting = ({ greeting, className }) => {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setVisibleLetters(0);
    setIsFadingOut(false);

    const letterInterval = setInterval(() => {
      setVisibleLetters((prev) => {
        if (prev < greeting.length) {
          return prev + 1;
        } else {
          clearInterval(letterInterval);
          setTimeout(() => setIsFadingOut(true), 500);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(letterInterval);
  }, [greeting]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {greeting.split('').map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: index < visibleLetters ? 1 : 0 }}
          transition={{ duration: 0.1 }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedGreeting;