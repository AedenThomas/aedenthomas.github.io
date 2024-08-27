import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AnimatedGreeting = ({ greeting, className }) => {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fadeOutTimeoutRef = useRef(null);

  useEffect(() => {
    console.log(`New greeting: ${greeting}`);
    setVisibleLetters(0);
    setIsFadingOut(false);

    // Clear any existing timeout
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current);
    }

    const letterInterval = setInterval(() => {
      setVisibleLetters((prev) => {
        if (prev < greeting.length) {
          return prev + 1;
        } else {
          clearInterval(letterInterval);
          console.log(`All letters revealed at: ${new Date().toISOString()}`);
          
          // Set new timeout for fading out
          fadeOutTimeoutRef.current = setTimeout(() => {
            console.log(`Starting fade out at: ${new Date().toISOString()}`);
            setIsFadingOut(true);
          }, 4000); // Changed to 4 seconds

          return prev;
        }
      });
    }, 280);

    return () => {
      clearInterval(letterInterval);
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
    };
  }, [greeting]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {greeting.split('').map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: index < visibleLetters ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedGreeting;
