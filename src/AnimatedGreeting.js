import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const AnimatedGreeting = ({ greeting, className }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);
  
  useEffect(() => {
    setVisibleLetters(0);
    setIsComplete(false);

    const letterInterval = setInterval(() => {
      setVisibleLetters((prev) => {
        if (prev < greeting.length) {
          return prev + 1;
        } else {
          clearInterval(letterInterval);
          setIsComplete(true);
          return prev;
        }
      });
    }, 100); // Faster typing speed

    return () => {
      clearInterval(letterInterval);
    };
  }, [greeting]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {greeting.split('').map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: index < visibleLetters ? 1 : 0,
            y: index < visibleLetters ? 0 : 20 
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut",
            delay: index < visibleLetters ? 0 : 0 
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedGreeting;
